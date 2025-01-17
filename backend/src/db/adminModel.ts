import mongoose, { Schema, Document, Model } from "mongoose";

export interface AdminType extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    password: string;
    role: "admin";
    adminGroupCode: string;
    usersGroup: mongoose.Types.ObjectId[];
    }

const AdminSchema: Schema<AdminType> = new Schema<AdminType>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin"], default: "admin" },
    adminGroupCode: { type: String, required: true, unique: true },
    usersGroup: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
);

const AdminModel: Model<AdminType> = mongoose.model<AdminType>("Admin", AdminSchema);

export default AdminModel;