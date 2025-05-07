import { Request, Response } from "express";
import { Params } from "../types/params";
import AdminModel, { AdminType } from "../db/adminModel";
import mongoose from "mongoose";
import UserModel, { UserType } from "../db/userModel";
import {UserRequest} from "../db/userRequestModel";
import ApiCode from "../db/apiCodeModel";
import Container from "../db/containerModel";
import dotenv from 'dotenv';
import { io } from '../sockets/socketServer';

dotenv.config();

export const getGroupData = async (req:Request<Params,{},{}>, res: Response): Promise<void> => {

    const {userId} = req.params;
    try{
        const admin: AdminType | null = await AdminModel.findById(userId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found." });
      return;
    }

    const users: UserType[] = await UserModel.find({ adminId: admin._id });
    res.status(200).json({ adminGroupCode: admin.adminGroupCode, users: users});

    } catch (error: any) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const removeUserFromGroup = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { adminCode} = req.body;

    if (!adminCode) {
        res.status(400).json({ message: 'Admin code is required.' });
        return;
    }
    if (adminCode !== process.env.ADMIN_AUTHORIZATION_SECRET) {
        res.status(403).json({ message: 'Invalid admin authorization code.' });
        return;
    }
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }
  
      await Promise.all([
        UserRequest.deleteMany({ userId }),
        ApiCode.deleteMany({ userId }),
        Container.deleteMany({ userId }),
        UserModel.findByIdAndDelete(userId)
      ]);
      
      io.to(userId).emit('userRemoved', { message: 'Admin removed you.' });
      console.log(`Sent userRemoved event to userId: ${userId}`);
  
      res.status(200).json({ message: "User and all related data deleted successfully." });
    } catch (error) {
      console.error("Error removing user:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };

  export const getGroupStats = async (req: Request, res: Response): Promise<void> => {
    const { adminId } = req.params;
  
    try {
      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        res.status(404).json({ message: "Admin or group not found." });
        return;
      }

      const userIds = await UserModel.find({ adminId: admin._id }).distinct('_id');
  
      const approvedCount = await UserRequest.countDocuments({
        userId: { $in: userIds },
        status: "checked",
        adminsDecision: "approved"
      });
  
      const disapprovedCount = await UserRequest.countDocuments({
        userId: { $in: userIds },
        status: "checked",
        adminsDecision: "disapproved"
      });
  
      res.status(200).json({
        approved: approvedCount,
        disapproved: disapprovedCount,
        total: approvedCount + disapprovedCount
      });
    } catch (error) {
      console.error("Error fetching group stats:", error);
      res.status(500).json({ message: "Failed to fetch group statistics." });
    }
  };