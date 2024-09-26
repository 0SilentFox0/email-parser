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

mongoose.connect(process.env.MONGODB_URI as string);

const imapConfig = {
	host: process.env.EMAIL_HOST as string,
	port: parseInt(process.env.EMAIL_PORT as string),
	auth: {
		user: process.env.EMAIL_USER as string,
		pass: process.env.EMAIL_PASS as string,
	},
	secure: true,
	emitLogs: true,
	timeoutConnection: 30000, // 30 seconds
	timeoutIdle: 300000, // 5 minutes
};

async function createImapConnection(): Promise<ImapFlow> {
	const client = new ImapFlow(imapConfig);
	try {
		await client.connect();
		logger.info("Connected to IMAP server");
		return client;
	} catch (error) {
		logger.error("Error connecting to IMAP server:", error);
		throw error;
	}
}

async function processEmails(): Promise<void> {
	let client: ImapFlow | null = null;

	try {
		client = await createImapConnection();
		const emailProcessor = new EmailProcessor(client);
		const emailMover = new EmailMover(client);
		const leadExtractor = new LeadExtractor();

		const lock = await client.getMailboxLock("INBOX");
		try {
			const messages = await emailProcessor.fetchUnseenMessages();
			logger.info(`Fetched ${messages.length} unseen messages`);

			for (const message of messages) {
				try {
					const parsed = await simpleParser(message.source);
					const lead = leadExtractor.extractLeadInfo(parsed);
					await LeadModel.create(lead);
					await emailMover.moveEmail(message.uid.toString(), "Processed");
					logger.info(`Processed email: ${message.uid}`);
				} catch (error) {
					logger.error(`Error processing email ${message.uid}:`, error);
					if (client.usable) {
						await emailMover.moveEmail(message.uid.toString(), "ParsingError");
					} else {
						logger.error("IMAP connection lost, reconnecting...");
						client = await createImapConnection();
						await emailMover.moveEmail(message.uid.toString(), "ParsingError");
					}
				}
			}
		} finally {
			lock.release();
		}
	} catch (error) {
		logger.error("Error in email processing:", error);
	} finally {
		if (client) {
			try {
				await client.logout();
				logger.info("Logged out from IMAP server");
			} catch (error) {
				logger.error("Error logging out from IMAP server:", error);
			}
		}
	}
}

async function main() {
	try {
		await processEmails();
	} catch (error) {
		logger.error("Unhandled error in main process:", error);
	} finally {
		await mongoose.connection.close();
		logger.info("Closed MongoDB connection");
	}
}

main().catch(console.error);
