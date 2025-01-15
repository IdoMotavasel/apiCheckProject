import mongoose,{Schema, Model} from 'mongoose';

export interface IBlacklist extends Document {
    token: string;
}

const blacklistSchema: Schema<IBlacklist>= new mongoose.Schema<IBlacklist>(
    {
        token: {type: String, required:true},
    },
    {
        timestamps: true,
    }
);

export const Blacklist: Model<IBlacklist> = mongoose.model<IBlacklist>('Blacklist',blacklistSchema);
