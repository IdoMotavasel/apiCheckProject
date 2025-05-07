import mongoose,{Schema, Model} from 'mongoose';

export interface IBlacklist extends Document {
    token: string;
    expiresAt: Date;
}

const blacklistSchema: Schema<IBlacklist>= new Schema<IBlacklist>(
    {
        token: {type: String, required:true},
        expiresAt: { type: Date, required: true, expires: 0 },
    },
    {
        timestamps: true,
    }
);

export const Blacklist: Model<IBlacklist> = mongoose.model<IBlacklist>('Blacklist',blacklistSchema);
