import { Schema, model, Types, Document } from 'mongoose';

export interface IAlert extends Document {
  asha_id: Types.ObjectId;
  location: { lat: number; lng: number };
  timestamp: Date;
  status: 'active' | 'resolved';
  notified_recipients: number;
  clientId?: string;
}

const AlertSchema = new Schema<IAlert>({
  asha_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  timestamp: { type: Date, default: () => new Date() },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  notified_recipients: { type: Number, default: 0 },
  clientId: { type: String },
}, { timestamps: false });

AlertSchema.index({ asha_id: 1 });
AlertSchema.index({ clientId: 1 }, { unique: true, sparse: true });

export const Alert = model<IAlert>('Alert', AlertSchema, 'alerts');
