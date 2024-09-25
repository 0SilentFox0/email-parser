import dotenv from "dotenv";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import mongoose from "mongoose";
import { EmailProcessor } from "./email-processor-service";
import { EmailMover } from "./email-mover-service";
import { LeadExtractor } from "./lead-extractor-service-ts";
import { LeadModel } from "./model/lead-model";
import { logger } from "./logger-utility";

dotenv.config();

mongoose
	.connect(process.env.MONGODB_URI as string)
	.then(() => logger.info("Connected to MongoDB"))
	.catch((err) => logger.error("MongoDB connection error:", err));

const imapConfig = {
	host: process.env.EMAIL_HOST as string,
	port: parseInt(process.env.EMAIL_PORT as string),
	auth: {
		user: process.env.EMAIL_USER as string,
		pass: process.env.EMAIL_PASS as string,
	},
	secure: true,
};

async function processEmails(): Promise<void> {
	const client = new ImapFlow(imapConfig);
	const emailProcessor = new EmailProcessor(client);
	const emailMover = new EmailMover(client);
	const leadExtractor = new LeadExtractor();

	try {
		await client.connect();
		logger.info("Connected to IMAP server");

		const lock = await client.getMailboxLock("INBOX");
		try {
			const messages = await emailProcessor.fetchUnseenMessages();
			logger.info(`Fetched ${messages} unseen messages`);

			for await (const message of messages) {
				try {
					logger.info(`Processing message with UID: ${message.uid}`);
					const parsed = await simpleParser(message.source);
					logger.info(`Parsed email from: ${parsed.from?.text}`);

					const lead = leadExtractor.extractLeadInfo(parsed);
					logger.info(`Extracted lead info: ${JSON.stringify(lead)}`);

					const leadExists = await LeadModel.leadExists(
						lead.leadId,
						lead.email
					);
					logger.info(`Lead exists: ${leadExists}`);

					if (leadExists) {
						logger.info(
							`Lead already exists: ${lead.email} (ID: ${lead.leadId})`
						);
						await emailMover.moveEmail(message.uid.toString(), "Duplicate");
						logger.info(`Moved email to Duplicate folder`);
					} else {
						try {
							const createdLead = await LeadModel.create(lead);
							logger.info(`Created new lead in database: ${createdLead._id}`);
							await emailMover.moveEmail(message.uid.toString(), "Processed");
							logger.info(`Moved email to Processed folder`);
						} catch (dbError) {
							logger.error(`Database error for email ${message.uid}:`, dbError);
							await emailMover.moveEmail(
								message.uid.toString(),
								"DatabaseError"
							);
							logger.info(`Moved email to DatabaseError folder`);
						}
					}
				} catch (parsingError) {
					logger.error(`Parsing error for email ${message.uid}:`, parsingError);
					await emailMover.moveEmail(message.uid.toString(), "ParsingError");
					logger.info(`Moved email to ParsingError folder`);
				}
			}
		} catch (processingError) {
			logger.error("Error processing messages:", processingError);
		} finally {
			lock.release();
		}
	} catch (connectionError) {
		logger.error("Error connecting to IMAP server:", connectionError);
	} finally {
		await client.logout();
		logger.info("Logged out from IMAP server");
	}
}

processEmails().catch((error) => {
	logger.error("Unhandled error in email processing:", error);
	process.exit(1);
});
