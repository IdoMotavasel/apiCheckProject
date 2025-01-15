import { Request, Response } from "express";
import { UserRequest } from "../db/userRequestModel";
import { handleError } from "../utils/errorHandler";
import  UserModel, {UserType} from "../db/userModel";
import { Params } from "../types/params";
import { UserRequestType } from "../db/userRequestModel";

export const getActiveRequests = async (req:Request<Params,{},{}>, res: Response): Promise<void> => {
    const {userId} = req.params;

    try{
        const user: UserType | null = await UserModel.findById(userId).select("username").exec();
        if (!user) {
            handleError(res,404,'User not found');
            return;
        }
        const username: string = user.username;

        const requests: UserRequestType[] = await UserRequest.find({ username, isValid: true })
        .populate({
            path: "apiCodeId",
            select: "description",
        }).exec();
        res.status(200).json(requests);
    }catch (error: any) {
        console.error("Error fetching active requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};