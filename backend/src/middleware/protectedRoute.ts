import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokenVerification";
import { handleError } from "../utils/errorHandler";
import  jwt  from "jsonwebtoken";

export const protectedRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        const token: string | undefined = req.headers.authorization?.split(' ')[1];
        if(!token){
            res.status(401).json({ message: 'Access token required'});
            return;
        }
        const verified: string | jwt.JwtPayload | null = verifyAccessToken(token);
        if(!verified || typeof verified !== 'object' || !verified.userId){
            res.status(401).json({ message: 'Invalid access token'});
            return;
        }
        (req as any).userId = verified.userId; // to find a better solution
        next();
    }catch(error: any){
        handleError(res, 500,'Internal server error protected');
    }
    
};