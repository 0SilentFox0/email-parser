import { ParsedMail } from "mailparser";
import { Lead } from "./model/lead-model";

export class LeadExtractor {
	extractLeadInfo(parsedEmail: ParsedMail): Lead {
		const content = parsedEmail.text || "";
		const lines = content.split("\n");

		const name = this.extractName(lines);
		const gender = this.extractGender(lines);
		const geburtsdatum = this.extractBirthDate(lines);
		const leadId = this.extractLeadId(lines);

		return {
			wunschposition:
				this.extractField(lines, "Wunschposition") || "Nicht angegeben",
			name: name,
			anschrift: this.extractField(lines, "Anschrift") || "Nicht angegeben",
			geburtsdatum: geburtsdatum,
			tel: this.extractField(lines, "Tel") || "Nicht angegeben",
			geburtsort: this.extractField(lines, "Geburtsort") || "Nicht angegeben",
			ip: this.extractIp(lines),
			leadId: leadId,
			eingabeschluessel:
				this.extractField(lines, "Eingabeschlüssel") || "Nicht angegeben",
			email: this.extractEmail(parsedEmail) || "no-email@example.com",
			emailReceived: parsedEmail.date || new Date(),
			emailSent: "pending",
			gender: gender,
		};
	}

	private extractField(lines: string[], fieldName: string): string {
		const line = lines.find((l) =>
			l.toLowerCase().includes(fieldName.toLowerCase())
		);
		return line ? line.split(":")[1]?.trim() || "" : "";
	}

	private extractIp(lines: string[]): string {
		const ipLine = lines.find((l) => l.toLowerCase().includes("ip:"));
		if (!ipLine) return "0.0.0.0";

		const ipMatch = ipLine.match(/IP:\s*(.+)/i);
		if (!ipMatch) return "0.0.0.0";

		const ip = ipMatch[1].trim();

		// Validate IPv4
		if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
			return ip;
		}

		// Validate IPv6
		if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip)) {
			return ip;
		}

		return "0.0.0.0";
	}

	private extractName(lines: string[]): string {
		const name = this.extractField(lines, "Name")
			.split(",")
			.map((n) => n.trim());
		const [lastName = "Unbekannt", firstName = "Unbekannt"] = name;
		return `${firstName} ${lastName}`;
	}

	private extractGender(lines: string[]): "male" | "female" | "other" {
		const genderField = this.extractField(lines, "Geschlecht").toLowerCase();
		const genderMap: Record<string, "male" | "female" | "other"> = {
			männlich: "male",
			weiblich: "female",
		};
		return genderMap[genderField] || "other";
	}

	private extractBirthDate(lines: string[]): Date {
		const dateStr = this.extractField(lines, "Geburtsdatum");
		const [day, month, year] = dateStr.split(".").map(Number);
		const geburtsdatum = new Date(year, month - 1, day);
		return isNaN(geburtsdatum.getTime()) ? new Date() : geburtsdatum;
	}

	private extractLeadId(lines: string[]): number {
		const leadIdStr = this.extractField(lines, "ID");
		return parseInt(leadIdStr) || 0;
	}

	private extractEmail(parsedEmail: ParsedMail): string {
		return (
			this.extractField(parsedEmail.text?.split("\n") || [], "E-Mail") ||
			parsedEmail.from?.value[0]?.address ||
			"no-email@example.com"
		);
	}
}
