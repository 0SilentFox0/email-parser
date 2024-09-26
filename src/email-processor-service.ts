import { ImapFlow, FetchMessageObject } from "imapflow";
import { logger } from "./logger-utility";

export class EmailProcessor {
	constructor(private client: ImapFlow) {}

	async fetchUnseenMessages(): Promise<FetchMessageObject[]> {
		logger.info("Starting to fetch unseen messages...");
		try {
			const messages = this.client.fetch(
				"1:*",
				{
					uid: true,
					flags: true,
					bodyStructure: true,
					envelope: true,
					internalDate: true,
					size: true,
					source: true,
				},
				{
					uid: true,
					changedSince: BigInt(1),
				}
			);

			const messageArray: FetchMessageObject[] = [];
			for await (const message of messages) {
				messageArray.push(message);
			}

			logger.info(`Fetched ${messageArray.length} unseen messages`);
			return messageArray;
		} catch (error) {
			logger.error("Error fetching unseen messages:", error);
			throw error;
		}
	}
}
