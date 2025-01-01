import mongoose from 'mongoose';

interface IBlacklist extends Document {
    token: string;
}

const blacklistSchema = new mongoose.Schema<IBlacklist>(
    {
        token: {type: String, required:true},
    },
    {
        timestamps: true,
    }
);

export const Blacklist = mongoose.model<IBlacklist>('Blacklist',blacklistSchema);
