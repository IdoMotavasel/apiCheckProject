import { Request, Response } from "express";
import AdminModel, { AdminType } from "../db/adminModel";
import { UserRequest, UserRequestType } from "../db/userRequestModel";
import UserModel from "../db/userModel";
import { Params } from "../types/params";
import { io } from "../sockets/socketServer";
//----------------- ADMIN CONTROLLER---------------

export const getWaitingRequests = async (req: Request<Params,{},{}>, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const admin: AdminType | null = await AdminModel.findById(userId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found." });
      return;
    }
    const userIds = await UserModel.find({ adminId: admin._id }).distinct("_id");

    if (userIds.length === 0) {
        res.status(200).json({ message: "No users yet" });
        return;
    }
    const requests: UserRequestType[] = await UserRequest.find({
      status: "waiting",
      userId: { $in: userIds },
    })
      .populate({
        path: "apiCodeId",
        select: "description apiCode", 
      })
      .populate({
        path:"userId",
        select: "username",
      })
      .select("createdAt mlConfidence") 
      .exec();

    res.status(200).json(requests);
  } catch (error: any) {
    console.error("Error fetching waiting requests:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateUserRequest  = async (req:Request, res:Response):Promise<void> => {
  const { requestId } = req.params;
  const { adminsNotes, adminsDecision} = req.body;

  if (!adminsDecision || !["approved", "disapproved"].includes(adminsDecision)) {
    res.status(400).json({ message: "Invalid decision. Must be 'approved' or 'disapproved'." });
    return;
  }

  try{
    const updatedRequest = await UserRequest.findByIdAndUpdate(
      requestId, 
      {
        adminsNotes,
        adminsDecision,
        status: "checked", 
      },
      { new: true } 
    );

    if (!updatedRequest) {
      res.status(404).json({ message: "Request not found." });
      return;
    }

    const userId = updatedRequest.userId.toString();

    const populatedRequest = await updatedRequest.populate("apiCodeId", "name");
    const requestName = (populatedRequest.apiCodeId as any)?.name || "your request";

    io.to(userId).emit("requestChecked", {
      requestId: updatedRequest._id,
      requestName,
    });

    // Respond with the updated request
    res.status(200).json({
      message: "Request updated successfully.",
      data: updatedRequest,
    });
  }catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}
