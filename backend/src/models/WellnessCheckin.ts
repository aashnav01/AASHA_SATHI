import { Schema, model, Types, Document } from 'mongoose';

export interface IWellnessCheckin extends Document {
  asha_id: Types.ObjectId;
  date: string; // YYYY-MM-DD
  mood: number; // 1-5 emoji scale
  tiredness: number; // 0-3 scale
  supervisor_support: number; // 0-3 scale
  completed_visits: number; // 0-3 scale
  overall_score: number; // 0-9 (sum of above)
  clientId?: string;
  timestamp?: Date;
}

const WellnessCheckinSchema = new Schema<IWellnessCheckin>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  mood: { type: Number, required: true, min: 1, max: 5 },
  tiredness: { type: Number, required: true, min: 0, max: 3 },
  supervisor_support: { type: Number, required: true, min: 0, max: 3 },
  completed_visits: { type: Number, required: true, min: 0, max: 3 },
  overall_score: { type: Number, default: 0 },
  clientId: { type: String, sparse: true },
  timestamp: { type: Date, default: () => new Date() },
}, { timestamps: false });

WellnessCheckinSchema.index({ asha_id: 1 });
WellnessCheckinSchema.index({ asha_id: 1, date: 1 });
WellnessCheckinSchema.index({ clientId: 1 }, { unique: true, sparse: true });

export const WellnessCheckin = model<IWellnessCheckin>('WellnessCheckin', WellnessCheckinSchema, 'wellness_checkins');
