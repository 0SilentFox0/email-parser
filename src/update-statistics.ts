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
		// Aggregate leads by date
		const dailyStats = await LeadModel.aggregate([
			{
				$group: {
					_id: {
						$dateToString: { format: "%Y-%m-%d", date: "$emailReceived" },
					},
					count: { $sum: 1 },
				},
			},
		]);

		// Update or insert statistics
		for (const stat of dailyStats) {
			await StatisticsModel.findOneAndUpdate(
				{ date: new Date(stat._id) },
				{ count: stat.count },
				{ upsert: true, new: true }
			);
		}

		logger.info("Statistics updated successfully");
	} catch (error) {
		logger.error("Error updating statistics:", error);
	} finally {
		await mongoose.connection.close();
		logger.info("MongoDB connection closed");
	}
}

updateStatistics().catch((error) => {
	logger.error("Unhandled error in statistics update:", error);
	process.exit(1);
});
