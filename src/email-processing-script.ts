import dotenv from "dotenv";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import mongoose from "mongoose";
import { EmailProcessor } from "./email-processor-service";
import { EmailMover } from "./email-mover-service";
import { LeadExtractor } from "./lead-extractor-service";
import { LeadModel } from "./model/lead-model";
import { logger } from "./logger-utility";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;
const EMAIL_HOST = process.env.EMAIL_HOST as string;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT as string);
const EMAIL_USER = process.env.EMAIL_USER as string;
const EMAIL_PASS = process.env.EMAIL_PASS as string;

const imapConfig = {
	host: EMAIL_HOST,
	port: EMAIL_PORT,
	auth: { user: EMAIL_USER, pass: EMAIL_PASS },
	secure: true,
	// logger: console, // Add this line for debugging
};

async function connectToMongoDB(): Promise<void> {
	try {
		await mongoose.connect(MONGODB_URI);
	} catch (err) {
		throw err;
	}
}

async function connectToIMAPServer(): Promise<ImapFlow> {
	const client = new ImapFlow(imapConfig);
	try {
		await client.connect();
		return client;
	} catch (err) {
		throw err;
	}
}

async function processSingleEmail(
	message: any,
	emailProcessor: EmailProcessor,
	emailMover: EmailMover,
	leadExtractor: LeadExtractor
): Promise<void> {
	try {
		const parsed = await simpleParser(message.source);
		const lead = leadExtractor.extractLeadInfo(parsed);
		const leadExists = await LeadModel.leadExists(lead.leadId, lead.email);

		if (leadExists) {
			await emailMover.moveEmail(message.uid, "Duplicate");
		} else {
			try {
				await LeadModel.create(lead);
				await emailMover.moveEmail(message.uid, "Processed");
			} catch (dbError) {
				await emailMover.moveEmail(message.uid, "ProcessingError");
			}
		}

		await emailMover.markAsRead(message.uid);
	} catch (error) {
		await emailMover.moveEmail(message.uid, "ProcessingError");
		await emailMover.markAsRead(message.uid);
	}
}

async function processEmails(): Promise<void> {
	let client: ImapFlow | null = null;

	try {
		await connectToMongoDB();
		client = await connectToIMAPServer();

		const emailProcessor = new EmailProcessor(client);
		const emailMover = new EmailMover(client);
		const leadExtractor = new LeadExtractor();

		await emailMover.initialize();

		const lock = await client.getMailboxLock("INBOX");
		try {
			const messages = await emailProcessor.fetchUnseenMessages();

			for await (const message of messages) {
				await processSingleEmail(
					message,
					emailProcessor,
					emailMover,
					leadExtractor
				);
			}
		} finally {
			lock.release();
		}
	} catch (error) {
	} finally {
		if (client) {
			await client.logout();
		}
		logger.info("Finished");
		mongoose.connection.close();
	}
}

processEmails()
	.catch((error) => {
		logger.error("Unhandled error in email processing:", error);
	})
	.finally(() => {
		process.exit(0);
	});
