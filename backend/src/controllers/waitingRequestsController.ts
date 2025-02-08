import { Request, Response } from "express";
import AdminModel, { AdminType } from "../db/adminModel";
import { UserRequest, UserRequestType } from "../db/userRequestModel";
import UserModel, { UserType } from "../db/userModel";
import { Params } from "../types/params";
import mongoose from "mongoose";

//----------------- ADMIN CONTROLLER---------------

export const getWaitingRequests = async (req: Request<Params,{},{}>, res: Response): Promise<void> => {
  try {
    console.log("entered getWaitingRequests");
    const { userId } = req.params;
    console.log("userid: ", userId);

    // Find the admin by ID and populate their usersGroup
    const admin: AdminType | null = await AdminModel.findById(userId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found." });
      return;
    }

    // Use the usersGroup directly (it's already an array of ObjectId)
    const userIds: mongoose.Types.ObjectId[] = admin.usersGroup;
    console.log("users ids: ", userIds);

    if (userIds.length === 0) {
        res.status(200).json({ message: "No users yet" });
        return;
    }

    const users: UserType[] = await UserModel.find({
        _id: { $in: userIds },
      }).select("username");
  
    const usernames: string[] = users.map((user) => user.username);
    console.log("usernames: ", usernames);

    // Fetch all requests with status "waiting" and valid users
    const requests: UserRequestType[] = await UserRequest.find({
      status: "waiting",
      isValid: true,
      username: { $in: usernames },
    })
      .populate({
        path: "apiCodeId",
        select: "description", 
      })
      .select("username createdAt") 
      .exec();

      console.log("waiting requests: ", requests);

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
      requestId, // Search by ID
      {
        adminsNotes,
        adminsDecision,
        status: "checked", // Update status to 'checked'
      },
      { new: true } // Return the updated document
    );

    if (!updatedRequest) {
      res.status(404).json({ message: "Request not found." });
      return;
    }

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
