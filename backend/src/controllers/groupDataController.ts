import { Request, Response } from "express";
import { Params } from "../types/params";
import AdminModel, { AdminType } from "../db/adminModel";
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

    const userIds = await UserModel.find({ adminId: admin._id }).distinct("_id");
    if (userIds.length === 0) {
      res.status(200).json({ groupSummary: {}, userStats: [] });
      return;
    }

    const requests = await UserRequest.find({ userId: { $in: userIds } })
      .populate({ path: "userId", select: "username" })
      .select("userId adminsDecision status mlConfidence")
      .exec();

    let totalConfidence = 0;
    let validCount = 0;
    let invalidCount = 0;
    let approved = 0;
    let disapproved = 0;
    let agreement = 0;

    const userMap: Record<string, { total: number; approved: number; confidenceSum: number }> = {};

    for (const req of requests) {
      const username = (req.userId as any).username;
      const conf = req.mlConfidence || 0;
      const decision = req.adminsDecision;

      if (!userMap[username]) {
        userMap[username] = { total: 0, approved: 0, confidenceSum: 0 };
      }

      userMap[username].total++;
      userMap[username].confidenceSum += conf;

      if (decision === "approved") approved++;
      if (decision === "disapproved") disapproved++;

      if (conf >= 0.5) validCount++;
      else invalidCount++;

      // Model-admin agreement tracking
      if ((conf >= 0.5 && decision === "approved") || (conf < 0.5 && decision === "disapproved")) {
        agreement++;
      }

      if (decision === "approved") {
        userMap[username].approved++;
      }

      totalConfidence += conf;
    }

    const userStats = Object.entries(userMap)
    .map(([username, data]) => ({
      username,
      avgConfidence: data.total ? +(data.confidenceSum / data.total).toFixed(2) : 0,
      total: data.total,
      approved: data.approved
    }))
    .sort((a, b) => b.total - a.total);

    const totalRequests = requests.length;
    const avgConfidence = totalRequests ? +(totalConfidence / totalRequests).toFixed(2) : 0;

    res.status(200).json({
      groupSummary: {
        avgConfidence,
        totalRequests,
        totalValid: validCount,
        totalInvalid: invalidCount,
        approved,
        disapproved,
        modelAdminAgreement: agreement
      },
      userStats
    });
  } catch (error) {
    console.error("Error fetching enhanced group stats:", error);
    res.status(500).json({ message: "Failed to fetch enhanced group statistics." });
  }
  };