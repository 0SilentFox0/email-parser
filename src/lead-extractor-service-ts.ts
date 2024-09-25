import { ParsedMail } from "mailparser";
import { Lead } from "./model/lead-model";

export class LeadExtractor {
	extractLeadInfo(parsedEmail: ParsedMail): Lead {
		const content = parsedEmail.text || "";
		const lines = content.split("\n");

		const extractField = (fieldName: string): string => {
			const line = lines.find((l) =>
				l.toLowerCase().startsWith(fieldName.toLowerCase())
			);
			return line ? line.split(":")[1]?.trim() || "" : "";
		};

		const name = extractField("Name");
		const [lastName, firstName] = name.split(",").map((n) => n.trim());

		const determineGender = (
			salutation: string
		): "male" | "female" | "other" => {
			const lowerSalutation = salutation.toLowerCase();
			if (lowerSalutation.includes("herr")) return "male";
			if (lowerSalutation.includes("frau")) return "female";
			return "other";
		};

		const salutation = extractField("Anrede");
		const gender = determineGender(salutation);

		const geburtsdatum = new Date(extractField("Geburtsdatum"));
		const leadId = parseInt(extractField("ID"));

		// Validate and provide default values for required fields
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
			email: parsedEmail.from?.value[0].address || "no-email@example.com",
			emailReceived: parsedEmail.date || new Date(),
			emailSent: "pending",
			gender: gender,
		};
	}
}
