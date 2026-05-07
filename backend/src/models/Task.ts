import { Schema, model, Types, Document } from 'mongoose';

export interface ITask extends Document {
  asha_id: Types.ObjectId;
  title: string;
  description?: string;
  due_date?: Date;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  created_at: Date;
  location?: string;
  is_recurring: boolean;
}

const TaskSchema = new Schema<ITask>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  due_date: { type: Date },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  completed: { type: Boolean, default: false },
  created_at: { type: Date, default: () => new Date() },
  location: { type: String },
  is_recurring: { type: Boolean, default: false },
}, { timestamps: false });

TaskSchema.index({ asha_id: 1 });

export const Task = model<ITask>('Task', TaskSchema, 'tasks');
