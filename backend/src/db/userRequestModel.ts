import mongoose, {Model,Schema} from 'mongoose';

export interface UserRequestType extends Document {
    _id: mongoose.Types.ObjectId;
    isValid: boolean;
    username: string;
    apiCodeId: mongoose.Types.ObjectId;
    adminsNotes?: string;
    adminsDecision?: string;
}

const UserRequestSchema: Schema<UserRequestType>= new mongoose.Schema<UserRequestType>(
    {
        isValid: { type: Boolean, required: true },
        username: { type: String, required: true },
        apiCodeId: { type: Schema.Types.ObjectId, ref: 'ApiCode', required: true },
        adminsNotes: { type: String, default: null },
        adminsDecision: { type: String, default: null },
    },
    {
        timestamps: true,
    }
);

export const UserRequest: Model<UserRequestType> = mongoose.model<UserRequestType>('UserRequest',UserRequestSchema);
