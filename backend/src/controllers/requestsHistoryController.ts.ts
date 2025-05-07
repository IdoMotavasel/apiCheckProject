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
    const admin: AdminType | null = await AdminModel.findById(userId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found." });
      return;
    }

    const userIds = await UserModel.find({ adminId: admin._id }).distinct("_id");
    if (userIds.length === 0) {
      res.status(200).json([]);
      return;
    }

    const requests: UserRequestType[] = await UserRequest.find({
      userId: { $in: userIds }, status: "checked",
    })
      .populate({
        path: "apiCodeId",
        select: "description",
      })
      .populate({
        path:"userId",
        select: "username",
      })
      .select("createdAt adminsNotes adminsDecision apiCodeId")
      .exec();

    res.status(200).json(requests);
  } catch (error:any) {
    console.error("Error fetching requests history:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
