import { ImapFlow } from "imapflow";

export class EmailMover {
	constructor(private client: ImapFlow) {}

	async moveEmail(uid: string | number[], destFolder: string): Promise<void> {
		await this.client.messageMove(uid, destFolder);
	}
}
