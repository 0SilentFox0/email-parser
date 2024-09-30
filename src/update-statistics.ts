import dotenv from "dotenv";
import mongoose from "mongoose";
import { LeadModel } from "./model/lead-model";
import { logger } from "./logger-utility";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string);

// Define the statistics model
const StatisticsSchema = new mongoose.Schema({
	date: { type: Date, unique: true },
	count: Number,
});

const StatisticsModel = mongoose.model("Statistics", StatisticsSchema);

async function updateStatistics(): Promise<void> {
	try {
		// Get the date range
		const oldestLead = await LeadModel.findOne().sort({ emailReceived: 1 });
		const newestLead = await LeadModel.findOne().sort({ emailReceived: -1 });

		if (!oldestLead || !newestLead) {
			logger.info("No leads found in the database.");
			return;
		}

		const startDate = new Date(oldestLead.emailReceived);
		startDate.setUTCHours(0, 0, 0, 0);
		const endDate = new Date(newestLead.emailReceived);
		endDate.setUTCHours(23, 59, 59, 999);

		// Generate an array of all dates between start and end
		const dateArray = getDatesArray(startDate, endDate);

		// Aggregate leads by date
		const dailyStats = await LeadModel.aggregate([
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$emailReceived",
							timezone: "UTC",
						},
					},
					count: { $sum: 1 },
				},
			},
		]);

		// Create a map of date to count
		const statsMap = new Map(dailyStats.map((stat) => [stat._id, stat.count]));

		// Update or insert statistics for each date
		for (const date of dateArray) {
			const dateString = date.toISOString().split("T")[0];
			const count = statsMap.get(dateString) || 0;

			await StatisticsModel.findOneAndUpdate(
				{ date },
				{ count },
				{ upsert: true, new: true }
			);

			logger.info(`Updated statistics for ${dateString}: ${count} lead(s)`);
		}

		logger.info("Statistics updated successfully");
	} catch (error) {
		logger.error("Error updating statistics:", error);
	} finally {
		await mongoose.connection.close();
		logger.info("MongoDB connection closed");
	}
}

function getDatesArray(start: Date, end: Date): Date[] {
	const dates = [];
	let currentDate = new Date(start);

	while (currentDate <= end) {
		dates.push(new Date(currentDate));
		currentDate.setUTCDate(currentDate.getUTCDate() + 1);
	}

	return dates;
}

updateStatistics().catch((error) => {
	logger.error("Unhandled error in statistics update:", error);
	process.exit(1);
});
