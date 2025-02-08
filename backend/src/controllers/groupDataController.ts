import { Request, Response } from "express";
import { Params } from "../types/params";
import AdminModel, { AdminType } from "../db/adminModel";
import mongoose from "mongoose";
import UserModel, { UserType } from "../db/userModel";

export const getGroupData = async (req:Request<Params,{},{}>, res: Response): Promise<void> => {

    const {userId} = req.params;
    try{
        const admin: AdminType | null = await AdminModel.findById(userId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found." });
      return;
    }

    const userIds: mongoose.Types.ObjectId[] = admin.usersGroup;
    console.log("users ids: ", userIds);

    if (userIds.length === 0) {
        res.status(200).json({ message: "No users yet" });
        return;
    }

    const users: UserType[] = await UserModel.find({
        _id: { $in: userIds },
    });

    res.status(200).json({ adminGroupCode: admin.adminGroupCode, users: users});

    } catch (error: any) {
        console.error("Error fetching waiting requests:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};