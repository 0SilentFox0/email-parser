import { ImapFlow } from "imapflow";

export class EmailProcessor {
	constructor(private client: ImapFlow) {}

	async fetchUnseenMessages() {
		const results = await this.client.search({ seen: false });
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
		);

		return messages;
	}
}
