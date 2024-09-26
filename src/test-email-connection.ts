import { log } from "console";
import dotenv from "dotenv";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";

dotenv.config();

async function testEmailConnection() {
	const requiredEnvVars = [
		"EMAIL_HOST",
		"EMAIL_PORT",
		"EMAIL_USER",
		"EMAIL_PASS",
		"SMTP_HOST",
		"SMTP_PORT",
	];
	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			throw new Error(`Missing required environment variable: ${envVar}`);
		}
		console.log(
			`${envVar}: ${envVar.includes("PASS") ? "*****" : process.env[envVar]}`
		);
	}

	const client = new ImapFlow({
		host: process.env.EMAIL_HOST!,
		port: parseInt(process.env.EMAIL_PORT!),
		secure: true,
		auth: {
			user: process.env.EMAIL_USER!,
			pass: process.env.EMAIL_PASS!,
		},
	});

	try {
		console.log(
			`Attempting to connect to IMAP server: ${process.env.EMAIL_HOST}`
		);
		await client.connect();
		console.log("IMAP connection successful");
		await client.logout();
	} catch (error) {
		console.error("IMAP connection failed:", error);
	}

	const smtpPort = parseInt(process.env.SMTP_PORT!);
	const smtpConfig = {
		host: process.env.SMTP_HOST!,
		port: smtpPort,
		secure: smtpPort === 465,
		auth: {
			user: process.env.EMAIL_USER!,
			pass: process.env.EMAIL_PASS!,
		},
		tls: {
			rejectUnauthorized: false, // Only use this for testing. Remove in production.
		},
	};

	console.log("SMTP Configuration:", {
		...smtpConfig,
		auth: { user: smtpConfig.auth.user, pass: "*****" },
	});

	const transporter = nodemailer.createTransport(smtpConfig);

	try {
		console.log(
			`Attempting to connect to SMTP server: ${process.env.SMTP_HOST}`
		);
		await transporter.verify();
		console.log("SMTP connection successful");
	} catch (error) {
		console.error("SMTP connection failed:", error);
	}
}

testEmailConnection().catch(console.error);
