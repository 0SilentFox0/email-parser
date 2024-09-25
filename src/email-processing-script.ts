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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string);

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

			for await (const message of messages) {
				try {
					const parsed = await simpleParser(message.source);
					const lead = leadExtractor.extractLeadInfo(parsed);
					logger.info(`THIS Lead ${lead}`);

					// Check if lead already exists
					const leadExists = await LeadModel.leadExists(
						lead.leadId,
						lead.email
					);

					if (leadExists) {
						logger.info(
							`Lead already exists: ${lead.email} (ID: ${lead.leadId})`
						);
						await emailMover.moveEmail(message.uid.toString(), "Duplicate");
					} else {
						try {
							await LeadModel.create(lead);
							await emailMover.moveEmail(message.uid.toString(), "Processed");
							logger.info(
								`Processed new lead: ${lead.email} (ID: ${lead.leadId})`
							);
						} catch (dbError) {
							logger.error(`Database error for email ${message.uid}:`, dbError);
							await emailMover.moveEmail(
								message.uid.toString(),
								"DatabaseError"
							);
						}
					}
				} catch (parsingError) {
					logger.error(`Parsing error for email ${message.uid}:`, parsingError);
					await emailMover.moveEmail(message.uid.toString(), "ParsingError");
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
	}
}

processEmails().catch((error) => {
	logger.error("Unhandled error in email processing:", error);
	process.exit(1);
});
