import { Schema, model, Types, Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  mobile: string;
  pin_hash: string;
  role: 'asha' | 'supervisor' | 'admin';
  emergency_contacts: Array<{ name: string; phone: string }>;
  // supervisor_id stored as ObjectId | null; Python app stored as None/string – see ensureSupervisorIdObjectId()
  supervisor_id: Types.ObjectId | null;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  pin_hash: { type: String, required: true },
  role: { type: String, enum: ['asha', 'supervisor', 'admin'], required: true },
  emergency_contacts: [
    {
      name: { type: String },
      phone: { type: String },
    },
  ],
  supervisor_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: false });

UserSchema.index({ role: 1 });

export const User = model<IUser>('User', UserSchema, 'users');
