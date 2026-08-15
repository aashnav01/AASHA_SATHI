import { Schema, model, Types, Document } from 'mongoose';

export interface IIncentiveLog extends Document {
  asha_id: Types.ObjectId;
  task_id: string;
  task_name: string;
  // Matches NRHMTask['category'] on the frontend (8 real NRHM categories) —
  // kept as a plain string rather than an enum so the schema doesn't drift
  // out of sync with the canonical task list again.
  category: string;
  amount_earned: number;
  date_completed: Date;
  status: 'pending' | 'submitted' | 'paid';
  dispute_reason?: string;
  // Dexie offline sync deduplication key
  clientId?: string;
}

const IncentiveLogSchema = new Schema<IIncentiveLog>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  task_id: { type: String, required: true },
  task_name: { type: String, required: true },
  category: { type: String, required: true },
  amount_earned: { type: Number, required: true },
  date_completed: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'submitted', 'paid'],
    default: 'pending',
    required: true
  },
  dispute_reason: { type: String },
  clientId: { type: String },
}, { timestamps: false });

IncentiveLogSchema.index({ asha_id: 1 });
// Sparse unique index on clientId for idempotent sync
IncentiveLogSchema.index({ clientId: 1 }, { unique: true, sparse: true });

export const IncentiveLog = model<IIncentiveLog>('IncentiveLog', IncentiveLogSchema, 'incentive_logs');
