import { Schema, model, Types, Document } from 'mongoose';

export interface IReferral extends Document {
  asha_id: Types.ObjectId;
  patient_name: string;
  facility_id: string;
  status: 'pending' | 'transported';
  checklist: {
    ifa_tablets: boolean;
    anc_card: boolean;
    aadhaar: boolean;
    cash: boolean;
  };
  // Dexie offline sync deduplication key
  clientId?: string;
  timestamp?: Date;
}

const ReferralSchema = new Schema<IReferral>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  patient_name: { type: String, required: true },
  facility_id: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'transported'],
    default: 'pending',
    required: true,
  },
  checklist: {
    ifa_tablets: { type: Boolean, default: false },
    anc_card: { type: Boolean, default: false },
    aadhaar: { type: Boolean, default: false },
    cash: { type: Boolean, default: false },
  },
  clientId: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

ReferralSchema.index({ asha_id: 1 });
// Sparse unique index on clientId for idempotent sync
ReferralSchema.index({ clientId: 1 }, { unique: true, sparse: true });

export const Referral = model<IReferral>('Referral', ReferralSchema, 'referrals');
