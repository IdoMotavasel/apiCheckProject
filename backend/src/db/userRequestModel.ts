import mongoose, {Model,Schema} from 'mongoose';

export interface UserRequestType extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    apiCodeId: mongoose.Types.ObjectId;
    adminsNotes?: string;
    adminsDecision?: "approved" | "disapproved" | null;
    status: "waiting" | "checked";
}

const UserRequestSchema: Schema<UserRequestType>= new mongoose.Schema<UserRequestType>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        apiCodeId: { type: Schema.Types.ObjectId, ref: 'ApiCode', required: true },
        adminsNotes: { type: String, default: null },
        adminsDecision: { type: String, enum: ["approved", "disapproved", null], default: null },
        status: { type: String, required: true, enum: ["waiting", "checked"], default: "waiting" },
    },
    {
        timestamps: true,
    }
);

export const UserRequest: Model<UserRequestType> = mongoose.model<UserRequestType>('UserRequest',UserRequestSchema);
