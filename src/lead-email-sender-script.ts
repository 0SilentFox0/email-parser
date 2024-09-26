import dotenv from "dotenv";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import path from "path";
import { LeadModel, LeadDocument } from "./model/lead-model";
import { logger } from "./logger-utility";

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

async function sendPersonalizedEmail(lead: LeadDocument): Promise<void> {
	const greeting = lead.gender === "male" ? "Mr." : "Ms.";
	const lastName = lead.name.split(" ").pop() || "";

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: lead.email,
		subject: "Welcome to Our Service",
		text: `Dear ${greeting} ${lastName},

Thank you for your interest in our service. We're excited to have you on board!

Please find attached our product brochure with more information about our offerings.

If you have any questions, feel free to reach out to us.

Best regards,
Your Company Name`,
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
	} catch (error) {
		lead.emailSent = "failed";
		await lead.save();
		throw error;
	}
}

async function processNewLeads(): Promise<void> {
	try {
		const newLeads = await LeadModel.find({ emailSent: "pending" });

		for (const lead of newLeads) {
			try {
				await sendPersonalizedEmail(lead);
			} catch (error) {}
		}
	} catch (error) {
	} finally {
		await mongoose.connection.close();
	}
}

// Run the script
processNewLeads().catch((error) => {
	logger.error("Unhandled error in lead processing:", error);
	process.exit(1);
});
