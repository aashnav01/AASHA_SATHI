import { Schema, model, Types, Document } from 'mongoose';

export interface IPPDRecord extends Document {
  asha_id: Types.ObjectId;
  epds_answers: number[];   // 10 values 0-3
  total_score: number;
  risk_level: 'low' | 'medium' | 'high';
  referral_message: string;
  timestamp: Date;
  clientId?: string;
}

const PPDRecordSchema = new Schema<IPPDRecord>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  epds_answers: [{ type: Number }],
  total_score: { type: Number, required: true },
  risk_level: { type: String, enum: ['low', 'medium', 'high'], required: true },
  referral_message: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
  clientId: { type: String, sparse: true },
}, { timestamps: false });

PPDRecordSchema.index({ asha_id: 1 });
PPDRecordSchema.index({ clientId: 1 }, { unique: true, sparse: true });

export const PPDRecord = model<IPPDRecord>('PPDRecord', PPDRecordSchema, 'ppd_records');
