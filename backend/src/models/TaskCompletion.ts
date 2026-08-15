import { Schema, model, Types, Document } from 'mongoose';

export interface ITaskCompletion extends Document {
  asha_id: Types.ObjectId;
  task_id: string;
  task_name: string;
  category: string;
  completed_at: string; // ISO timestamp
  date: string; // YYYY-MM-DD for grouping by day
  frequency: string;
  incentive_amount: number;
  clientId?: string;
  timestamp?: Date;
}

const TaskCompletionSchema = new Schema<ITaskCompletion>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  task_id: { type: String, required: true },
  task_name: { type: String, required: true },
  category: { type: String, required: true },
  completed_at: { type: String, required: true },
  date: { type: String, required: true },
  frequency: { type: String, default: 'once' },
  incentive_amount: { type: Number, default: 0 },
  clientId: { type: String },
  timestamp: { type: Date, default: () => new Date() },
}, { timestamps: false });

TaskCompletionSchema.index({ asha_id: 1 });
TaskCompletionSchema.index({ asha_id: 1, date: 1 });
TaskCompletionSchema.index({ clientId: 1 }, { unique: true, sparse: true });

export const TaskCompletion = model<ITaskCompletion>('TaskCompletion', TaskCompletionSchema, 'task_completions');
