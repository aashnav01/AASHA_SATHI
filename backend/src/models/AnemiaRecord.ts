import { Schema, model, Types, Document } from 'mongoose';

export interface IAnemiaRecord extends Document {
  asha_id: Types.ObjectId;
  symptoms: string[];
  foods_consumed: string[];
  advice_given: string;
  timestamp: Date;
  // Dexie offline sync deduplication key
  clientId?: string;
}

const AnemiaRecordSchema = new Schema<IAnemiaRecord>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: [{ type: String }],
  foods_consumed: [{ type: String }],
  advice_given: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
  clientId: { type: String, index: true, sparse: true },
}, { timestamps: false });

AnemiaRecordSchema.index({ asha_id: 1 });
// Sparse unique index on clientId for idempotent sync
AnemiaRecordSchema.index({ clientId: 1 }, { unique: true, sparse: true });

export const AnemiaRecord = model<IAnemiaRecord>('AnemiaRecord', AnemiaRecordSchema, 'anemia_records');
