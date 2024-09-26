import { ImapFlow } from "imapflow";

export class EmailMover {
	private folders = ["Duplicate", "Processed", "ProcessingError"];

	constructor(private client: ImapFlow) {}

	async initialize(): Promise<void> {
		for (const folder of this.folders) {
			await this.createFolderIfNotExists(folder);
		}
	}

	private async createFolderIfNotExists(folderName: string): Promise<void> {
		try {
			const list = await this.client.list();
			const folderExists = list.some((mailbox) => mailbox.path === folderName);

			if (!folderExists) {
				await this.client.mailboxCreate(folderName);
			} else {
			}
		} catch (error) {
			throw new Error(
				`Failed to create or check folder ${folderName}: ${error}`
			);
		}
	}

	async moveEmail(uid: string | number[], destFolder: string): Promise<void> {
		if (!this.folders.includes(destFolder)) {
			throw new Error(`Invalid destination folder: ${destFolder}`);
		}
		try {
			await this.client.messageMove(uid, destFolder);
		} catch (error) {
			throw error;
		}
	}

	async markAsRead(uid: string | number[]): Promise<void> {
		try {
			await this.client.messageFlagsAdd(uid, ["\\Seen"]);
		} catch (error) {
			throw error;
		}
	}
}
