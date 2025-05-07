// models/containerModel.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ContainerType extends Document {
  sanitizedName: string;
  tarData: Buffer;
  createdAt: Date;
  userId: mongoose.Types.ObjectId;
  version: string;
}

const ContainerSchema = new Schema<ContainerType>(
  {
    sanitizedName: { type: String, required: true },
    tarData: { type: Buffer, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent duplicates for the same sanitizedName + version + userId
ContainerSchema.index({ sanitizedName: 1, version: 1, userId: 1 }, { unique: true });

const ContainerModel = mongoose.model<ContainerType>('Container', ContainerSchema);
export default ContainerModel;
