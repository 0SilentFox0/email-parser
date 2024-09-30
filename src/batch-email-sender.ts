import dotenv from "dotenv";
import mongoose from "mongoose";
import { LeadModel } from "./model/lead-model";
import { sendPersonalizedEmail } from "./lead-email-sender-script";
import { logger } from "./logger-utility";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string);

async function sendBatchEmails(batchSize: number): Promise<void> {
	try {
		const leads = await LeadModel.find({ emailSent: "pending" }).limit(
			batchSize
		);
		logger.info(`Processing ${leads.length} leads in batch`);

		for (const lead of leads) {
			try {
				await sendPersonalizedEmail(lead);
			} catch (error) {
				logger.error(`Error processing lead ${lead._id}:`, error);
			}
		}
	} catch (error) {
		logger.error("Error fetching leads for batch processing:", error);
	} finally {
		await mongoose.connection.close();
		logger.info("MongoDB connection closed");
	}
}

const batchSize = parseInt(process.argv[2], 10) || 10;
sendBatchEmails(batchSize).catch((error) => {
	logger.error("Unhandled error in batch email processing:", error);
	process.exit(1);
});
