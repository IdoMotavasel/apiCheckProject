import mongoose from 'mongoose';

interface userRequestType extends Document {
    _id: mongoose.Types.ObjectId;
    apiCodeId: mongoose.Types.ObjectId;
    status: 0 | 1 ;
}

const userRequestSchema = new mongoose.Schema<userRequestType>(
    {
        apiCodeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'ApiCode'},
        status: { type: Number, required: true, enum: [0,1]},
    },
    {
        timestamps: true,
    }
);

export const userRequest = mongoose.model<userRequestType>('userRequest',userRequestSchema);

//לבדוק לגבי טבלה של הערות של אדמין למשתמש תחתיו