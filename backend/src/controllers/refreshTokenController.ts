import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { Request, Response } from "express";
import { verifyRefreshToken } from "../utils/tokenVerification";
import { generateAccessToken } from "../utils/tokenGenerator";
import mongoose from "mongoose";
import { Blacklist, IBlacklist } from "../db/blacklistModel";
import { handleError } from "../utils/errorHandler";
import { RefreshRequestBody } from "../types/refreshControllerTypes";

const accessTokenSecret: string = process.env.ACCESS_TOKEN_SECRET!;

export const refreshToken = async(req:Request<{},{},RefreshRequestBody>, res:Response):Promise<void> => {
    const {accessToken, refreshToken} = req.body;

    if(!accessToken || !refreshToken) {
        handleError(res, 400, 'both tokens required');
        return;
    }

    const isBlacklisted: IBlacklist | null = await Blacklist.findOne({ token: refreshToken });
        if (isBlacklisted) {
            handleError(res,401,'refresh token is blacklisted');
            return;
        }

    console.log('before decoding in refresh');
    let decodedAccessToken: JwtPayload | null = null;
    try {
        decodedAccessToken = jwt.verify(accessToken, accessTokenSecret!) as JwtPayload;
    } catch (error:any) {
        if (error instanceof TokenExpiredError) {
            console.warn("Access token is expired, proceeding to refresh...");
        } else {
            console.error("Access token verification failed:", error);
            handleError(res, 401, "Invalid access token");
            return;
        }
    }
    console.log('decodedAccessToken: ', decodedAccessToken);
    if(decodedAccessToken){
        res.status(200).json({ message: 'Access token is still valid'});
        return;
    }

    console.log('before decoding refresh');
    const decodedRefreshToken: string | jwt.JwtPayload | null = verifyRefreshToken(refreshToken);
    console.log('decodedRefreshToken: ', decodedRefreshToken);
    if(!decodedRefreshToken){
        console.log('invalid refresh token');
        handleError(res,401,'Invalid refresh token');
        return;
    }

    const { userId, role, username } = decodedRefreshToken as {userId: mongoose.Types.ObjectId; role: 'admin' | 'user', username: string};
    try{
        const newAccessToken: string = generateAccessToken(userId,role, username);
        console.log('generated new access: ',newAccessToken);
        res.status(200).json({ message: 'New access token generated successfully', accessToken: newAccessToken,});
    }catch(error: any){
        handleError(res,500, 'failed to generate new access token');
    }
};