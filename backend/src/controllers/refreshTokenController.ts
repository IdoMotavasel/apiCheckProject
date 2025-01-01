import { Request, Response } from "express";
import { verifyAccessToken, verifyRefreshToken } from "../utils/tokenVerification";
import { generateAccessToken } from "../utils/tokenGenerator";
import mongoose from "mongoose";
import { Blacklist } from "../db/blacklistModel";
import { handleError } from "../utils/errorHandler";

export const refreshToken = async(req:Request, res:Response):Promise<void> => {
    const {accessToken, refreshToken} = req.body;

    if(!accessToken || !refreshToken) {
        handleError(res, 400, 'both tokens required');
        return;
    }

    const isBlacklisted = await Blacklist.findOne({ token: refreshToken });
        if (isBlacklisted) {
            handleError(res,401,'refresh token is blacklisted');
            return;
        }

    const decodedAccessToken = verifyAccessToken(accessToken);
    if(decodedAccessToken){
        res.status(200).json({ message: 'Access token is still valid'});
        return;
    }

    const decodedRefreshToken = verifyRefreshToken(refreshToken);
    if(!decodedRefreshToken){
        handleError(res,401,'Invalid refresh token');
        return;
    }

    const { userId, role } = decodedRefreshToken as {userId: mongoose.Types.ObjectId; role: 'admin' | 'user'};
    try{
        const newAccessToken = generateAccessToken(userId,role);
        res.status(200).json({ message: 'New access token generated successfully', accessToken: newAccessToken,});
    }catch(error){
        handleError(res,500, 'failed to generate new access token');
    }
};