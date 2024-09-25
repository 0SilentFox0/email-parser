import { ImapFlow } from "imapflow";

export class EmailProcessor {
	constructor(private client: ImapFlow) {}

	async fetchUnseenMessages() {
		// First, search for unseen messages
		const results = await this.client.search({ seen: false });

		// Then, fetch the details of these messages
		const messages = this.client.fetch(
			results,
			{
				uid: true,
				flags: true,
				bodyStructure: true,
				envelope: true,
				internalDate: true,
				size: true,
				source: true,
			},
			{ uid: true }
		);

		return messages;
	}
}
