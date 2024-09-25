import nodemailer from "nodemailer";
import { Lead } from "./model/lead-model";

export class EmailSender {
	constructor(private transporter: nodemailer.Transporter) {}

	async sendEmail(lead: Lead): Promise<void> {
		const greeting = lead.gender === "male" ? "Mr." : "Ms.";
		const lastName = lead.name.split(" ").pop() || "";

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: lead.email,
			subject: "Welcome to Our Service",
			text: `Dear ${greeting} ${lastName},\n\nThank you for your interest in our service. Please find attached our product brochure.\n\nBest regards,\nYour Company Name`,
			attachments: [
				{
					filename: "product_brochure.pdf",
					path: process.env.PDF_PATH,
				},
			],
		};

		await this.transporter.sendMail(mailOptions);
	}
}
