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
			}
		} catch (error) {
			throw new Error(
				`Failed to create or check folder ${folderName}: ${error}`
			);
		}
	}

	async moveEmail(uid: number, destFolder: string): Promise<void> {
		if (!this.folders.includes(destFolder)) {
			throw new Error(`Invalid destination folder: ${destFolder}`);
		}
		try {
			await this.client.messageMove([uid], destFolder, { uid: true });
		} catch (error) {
			throw error;
		}
	}

	// async markAsRead(uid: number): Promise<void> {
	// 	try {
	// 		await this.client.messageFlagsAdd([uid], ["\\Seen"], { uid: true });
	// 	} catch (error) {
	// 		throw error;
	// 	}
	// }
}
