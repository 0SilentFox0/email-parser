import { ParsedMail } from "mailparser";
import { Lead } from "./model/lead-model";

export class LeadExtractor {
	extractLeadInfo(parsedEmail: ParsedMail): Lead {
		const content = parsedEmail.text || "";
		const lines = content.split("\n");

		const extractedFields = {
			wunschposition: this.extractField(lines, "Wunschposition"),
			...this.extractName(lines),
			gender: this.extractGender(lines),
			email: this.extractEmail(parsedEmail),
			anschrift: this.extractField(lines, "Anschrift"),
			geburtsdatum: this.extractBirthDate(lines),
			tel: this.extractField(lines, "Tel"),
			geburtsort: this.extractField(lines, "Geburtsort"),
			ip: this.extractField(lines, "IP"),
			leadId: this.extractLeadId(lines),
			eingabeschluessel: this.extractField(lines, "Eingabeschlüssel"),
		};

		return {
			...extractedFields,
			emailReceived: parsedEmail.date || new Date(),
			emailSent: "pending",
		};
	}

	private extractField(lines: string[], fieldName: string): string {
		const line = lines.find((l) =>
			l.toLowerCase().startsWith(fieldName.toLowerCase() + ":")
		);
		const extracted = line ? line.split(":").slice(1).join(":").trim() : "";
		return extracted || "Nicht angegeben";
	}

	private extractName(lines: string[]): {
		firstName: string;
		lastName: string;
	} {
		const firstNameField = this.extractField(lines, "Vorname");
		const lastNameField = this.extractField(lines, "Nachname");
		return {
			firstName: firstNameField || "Unbekannt",
			lastName: lastNameField || "Unbekannt",
		};
	}

	private extractGender(lines: string[]): "male" | "female" | "other" {
		const genderField = this.extractField(lines, "Geschlecht").toLowerCase();
		const genderMap: Record<string, "male" | "female" | "other"> = {
			männlich: "male",
			weiblich: "female",
		};
		const gender = genderMap[genderField] || "other";
		return gender;
	}

	private extractBirthDate(lines: string[]): Date {
		const dateStr = this.extractField(lines, "Geburtsdatum");
		const [month, day, year] = dateStr.split(" ");
		const monthMap: { [key: string]: number } = {
			Januar: 0,
			Februar: 1,
			März: 2,
			April: 3,
			Mai: 4,
			Juni: 5,
			Juli: 6,
			August: 7,
			September: 8,
			Oktober: 9,
			November: 10,
			Dezember: 11,
		};
		const monthIndex = monthMap[month];
		const parsedDay = parseInt(day.replace(",", ""));
		const parsedYear = parseInt(year);

		if (isNaN(monthIndex) || isNaN(parsedDay) || isNaN(parsedYear)) {
			return new Date();
		}

		const date = new Date(parsedYear, monthIndex, parsedDay);
		return date;
	}

	private extractLeadId(lines: string[]): number {
		const leadIdStr = this.extractField(lines, "ID");
		const leadId = parseInt(leadIdStr) || 0;
		return leadId;
	}

	private extractEmail(parsedEmail: ParsedMail): string {
		const emailFromContent = this.extractEmailFromContent(
			parsedEmail.text || ""
		);
		if (emailFromContent) {
			return emailFromContent;
		}

		const fromAddress = parsedEmail.from?.value[0]?.address;
		if (fromAddress && this.isValidEmail(fromAddress)) {
			return fromAddress;
		}

		return "no-email@example.com";
	}

	private extractEmailFromContent(content: string): string | null {
		const lines = content.split("\n");
		const emailLine = lines.find((line) =>
			line.toLowerCase().startsWith("e-mail adresse:")
		);
		if (emailLine) {
			const emailMatch = emailLine.match(/[\w.-]+@[\w.-]+\.\w+/);
			if (emailMatch && this.isValidEmail(emailMatch[0])) {
				return emailMatch[0];
			}
		}
		return null;
	}

	private isValidEmail(email: string): boolean {
		const emailRegex =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return emailRegex.test(email);
	}
}
