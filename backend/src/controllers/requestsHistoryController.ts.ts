import { Request, Response } from "express";
import AdminModel, { AdminType } from "../db/adminModel";
import { UserRequest, UserRequestType } from "../db/userRequestModel";
import UserModel, { UserType } from "../db/userModel";
import { Params } from "../types/params";
import mongoose from "mongoose";

//------------------ ADMIN CONTROLLER----------------

export const getRequestsHistory = async (req: Request<Params,{},{}>, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Find the admin by ID and get the usersGroup
    const admin: AdminType | null = await AdminModel.findById(userId).populate("usersGroup");
    if (!admin) {
      res.status(404).json({ message: "Admin not found." });
      return;
    }

    const userIds: mongoose.Types.ObjectId[] = admin.usersGroup;
    if (userIds.length === 0) {
      res.status(200).json({ message: "No users in the group." });
      return;
    }

    // Fetch usernames of users in the group
    const users: UserType[] = await UserModel.find({ _id: { $in: userIds } }).select("username");
    const usernames: string[] = users.map(user => user.username);

    // Fetch user requests associated with the usernames
    const requests: UserRequestType[] = await UserRequest.find({
      username: { $in: usernames },
    })
      .populate({
        path: "apiCodeId",
        select: "description",
      })
      .select("username createdAt isValid adminsNotes adminsDecision apiCodeId")
      .exec();

    res.status(200).json(requests);
  } catch (error:any) {
    console.error("Error fetching requests history:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
