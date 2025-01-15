import mongoose, {Document, Schema, Model} from "mongoose";

export interface ApiCodeType extends Document{
    _id: mongoose.Types.ObjectId;
    description: string;
    zippedApi: Buffer ;
    userId: mongoose.Types.ObjectId;
}

const ApiCodesSchema:Schema<ApiCodeType> = new mongoose.Schema<ApiCodeType>({
    description: { type: String, required: true},
    zippedApi: { type: Buffer, required: true},
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    },
    {
        timestamps: true
    }
);

const apiCode:Model<ApiCodeType>= mongoose.model<ApiCodeType>('ApiCode',ApiCodesSchema);
export default apiCode;