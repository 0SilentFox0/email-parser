import { ParsedMail } from "mailparser";
import { Lead } from "./model/lead-model";

export class LeadExtractor {
	extractLeadInfo(parsedEmail: ParsedMail): Lead {
		const content = parsedEmail.text || "";
		const lines = content.split("\n");

		const extractField = (fieldName: string): string => {
			const line = lines.find((l) =>
				l.toLowerCase().includes(fieldName.toLowerCase())
			);
			return line ? line.split(":")[1]?.trim() || "" : "";
		};

		const name = extractField("Name");
		const [lastName, firstName] = name.split(",").map((n) => n.trim());

		const determineGender = (gender: string): "male" | "female" | "other" => {
			const lowerGender = gender.toLowerCase();
			if (lowerGender.includes("männlich")) return "male";
			if (lowerGender.includes("weiblich")) return "female";
			return "other";
		};

		const gender = determineGender(extractField("Geschlecht"));

		const parseDate = (dateStr: string): Date => {
			const [day, month, year] = dateStr.split(".").map(Number);
			return new Date(year, month - 1, day);
		};

		const geburtsdatum = parseDate(extractField("Geburtsdatum"));
		const leadId = parseInt(extractField("Lead-ID"));

		return {
			wunschposition: extractField("Wunschposition") || "Nicht angegeben",
			name: `${firstName} ${lastName}` || "Unbekannt",
			anschrift: extractField("Anschrift") || "Nicht angegeben",
			geburtsdatum: isNaN(geburtsdatum.getTime()) ? new Date() : geburtsdatum,
			tel: extractField("Tel") || "Nicht angegeben",
			geburtsort: extractField("Geburtsort") || "Nicht angegeben",
			ip: extractField("IP") || "0.0.0.0",
			leadId: isNaN(leadId) ? 0 : leadId,
			eingabeschluessel: extractField("Eingabeschlüssel") || "Nicht angegeben",
			email:
				extractField("E-Mail") ||
				parsedEmail.from?.value[0].address ||
				"no-email@example.com",
			emailReceived: parsedEmail.date || new Date(),
			emailSent: "pending",
			gender: gender,
		};
	}
}
