import dotenv from "dotenv";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import path from "path";
import { LeadModel, LeadDocument } from "./model/lead-model";
import { logger } from "./logger-utility";
import { emailTemplates, EmailTemplate } from "./email-templates";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string);

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: parseInt(process.env.SMTP_PORT as string),
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

function getEmailTemplate(gender: string, lastName: string): EmailTemplate {
	const template = emailTemplates[gender] || emailTemplates.other;
	return {
		subject: template.subject,
		text: template.text.replace("{lastName}", lastName),
	};
}

export async function sendPersonalizedEmail(lead: LeadDocument): Promise<void> {
	const lastName = lead.lastName || "";
	const { subject, text } = getEmailTemplate(lead.gender, lastName);

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: lead.email,
		subject: subject,
		text: text,
		attachments: [
			{
				filename: "product_brochure.pdf",
				path: path.join(__dirname, "../", process.env.PDF_PATH as string),
			},
		],
	};

	try {
		await transporter.sendMail(mailOptions);
		lead.emailSent = "sent";
		await lead.save();
		logger.info(`Email sent successfully to ${lead.email}`);
	} catch (error) {
		lead.emailSent = "failed";
		await lead.save();
		logger.error(`Failed to send email to ${lead.email}:`, error);
		throw error;
	}
}

async function processNewLeads(): Promise<void> {
	try {
		const newLeads = await LeadModel.find({ emailSent: "pending" });
		logger.info(`Processing ${newLeads.length} new leads`);

		for (const lead of newLeads) {
			try {
				await sendPersonalizedEmail(lead);
			} catch (error) {
				logger.error(`Error processing lead ${lead._id}:`, error);
			}
		}
	} catch (error) {
		logger.error("Error fetching new leads:", error);
	} finally {
		await mongoose.connection.close();
		logger.info("MongoDB connection closed");
	}
}

// Run the script
processNewLeads().catch((error) => {
	logger.error("Unhandled error in lead processing:", error);
	process.exit(1);
});
