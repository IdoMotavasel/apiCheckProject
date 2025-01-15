import mongoose, { Schema, Document, Model} from "mongoose";

export interface UserType extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  role: "user";
  adminId: mongoose.Types.ObjectId;
}

const UserSchema: Schema<UserType> = new Schema<UserType>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["user"], default: "user" },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true }, // reference to admin
},
);

const UserModel: Model<UserType> = mongoose.model<UserType>("User", UserSchema);

export default UserModel;
