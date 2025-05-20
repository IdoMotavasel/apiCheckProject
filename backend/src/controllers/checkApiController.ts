import { Request, Response } from 'express';
import axios from 'axios';
import ApiCode, { ApiCodeType } from '../db/apiCodeModel';
import { UserRequest} from '../db/userRequestModel';
import UserModel from '../db/userModel';
import { checkApiRequestBody } from '../types/checkApiTypes';
import { Params } from '../types/params';
import { UserType } from '../db/userModel';
import dotenv from 'dotenv';
import { io } from '../sockets/socketServer';

dotenv.config();
const FLASK_SERVER_URL: string = process.env.FLASK_SERVER_URL!;


//------------------ USER CONTROLLER----------------

export const checkApi = async (req: Request<Params, {}, checkApiRequestBody>, res: Response): Promise<void> => {
    const { description, apiCode, name } = req.body;
    console.log('entered Check api');
    console.log('description: ', description);
    console.log('mainCode: ', apiCode);
    console.log('name: ', name);

    const { userId } = req.params;
    console.log('userId: ', userId);

    try {
        const user: UserType | null = await UserModel.findById(userId);
        if (!user) {
            console.log('user not found');
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let isValid: boolean;
        let confidence: number = -1;
        try {
            const mlRes = await axios.post(
                FLASK_SERVER_URL,
                { code: apiCode },
                { timeout: 5000 }
            );
            isValid = mlRes.data.validity === 'valid';
            confidence = mlRes.data.confidence ?? -1;
        } catch (mlError: any) {
            console.error('Error calling ML service:', mlError.message || mlError);
            res.status(502).json({ message: 'Failed to classify code' });
            return;
        }
        const apiCodeCreated: ApiCodeType = await ApiCode.create({
            description,
            apiCode,
            name,
            userId,
        });

        if (isValid) {
            await UserRequest.create({
                userId,
                apiCodeId: apiCodeCreated._id,
                status: "waiting",
                mlConfidence: confidence,
            });

            const adminId = user.adminId.toString();
            const username = user.username;

            io.to(adminId).emit("newWaitingRequest", {
                username,
            });
        }

        res.status(200).json({
            message: 'API code processed successfully.',
            validityCheck: isValid ? 'valid' : 'invalid',
            confidence: confidence
        });
    } catch (error: any) {
        console.error('Error in checkApi:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};