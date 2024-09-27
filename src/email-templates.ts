// email-templates.ts

export interface EmailTemplate {
	subject: string;
	text: string;
}

export const emailTemplates: Record<string, EmailTemplate> = {
	male: {
		subject: "Welcome aboard, Sir!",
		text: `Dear Mr. {lastName},

We're thrilled to have you join our service tailored for gentlemen. Our premium offerings are designed to meet the sophisticated needs of modern men like yourself.

Attached, you'll find our exclusive product brochure showcasing our gentleman's collection.

Should you have any inquiries, our dedicated team is at your service.

Best regards,
Your Company Name`,
	},
	female: {
		subject: "Welcome to our community, Madam!",
		text: `Dear Ms. {lastName},

We're delighted to welcome you to our service crafted for discerning women. Our curated selection is designed to cater to the unique preferences of today's empowered women.

Please find attached our product brochure featuring our exclusive women's line.

If you have any questions, our team is here to assist you.

Warm regards,
Your Company Name`,
	},
	other: {
		subject: "Welcome to our inclusive community!",
		text: `Dear {lastName},

We're excited to welcome you to our inclusive service that celebrates diversity. Our offerings are designed to cater to the unique needs and preferences of all individuals.

Attached is our product brochure showcasing our inclusive and diverse range of products.

If you have any questions or need assistance, our inclusive support team is here for you.

Best wishes,
Your Company Name`,
	},
};
