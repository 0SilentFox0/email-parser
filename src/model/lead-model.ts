import mongoose, { Document, Schema } from "mongoose";

export interface Lead {
	wunschposition: string;
	gender: "male" | "female" | "other";
	name: string;
	anschrift: string;
	geburtsdatum: Date;
	tel: string;
	geburtsort: string;
	ip: string;
	leadId: number;
	eingabeschluessel: string;
	email: string;
	emailReceived: Date;
	emailSent: "pending" | "sent" | "failed";
}

export interface LeadDocument extends Lead, Document {}

const leadSchema = new Schema<LeadDocument>({
	wunschposition: { type: String, required: true },
	name: { type: String, required: true },
	anschrift: { type: String, required: true },
	geburtsdatum: { type: Date, required: true },
	tel: { type: String, required: true },
	geburtsort: { type: String, required: true },
	ip: { type: String, required: true },
	leadId: { type: Number, required: true },
	eingabeschluessel: { type: String, required: true },
	email: { type: String, required: true },
	emailReceived: { type: Date, required: true, default: Date.now },
	emailSent: {
		type: String,
		enum: ["pending", "sent", "failed"],
		default: "pending",
	},
});

leadSchema.statics.leadExists = async function (
	leadId: number,
	email: string
): Promise<boolean> {
	const existingLead = await this.findOne({
		$or: [{ leadId: leadId }, { email: email }],
	});
	return !!existingLead;
};

export const LeadModel = mongoose.model<
	LeadDocument,
	mongoose.Model<LeadDocument> & {
		leadExists: (leadId: number, email: string) => Promise<boolean>;
	}
>("Lead", leadSchema);
