import { Request, Response } from 'express';
import { userRequest } from '../db/userRequestModel';
import { handleError } from '../utils/errorHandler';

export const createUserRequest = async (req: Request, res: Response):Promise<void> => {
    const { apiCodeId, status} = req.body;
    try{
        const newUserRequest = new userRequest({apiCodeId, status});
        await newUserRequest.save();
        res.status(201).json({ message: 'User request created successfully'});
    }catch(error){
        handleError(res,500,'Failed to create user request')
    }
};

export const deleteUserRequest = async (req: Request, res: Response):Promise<void> => {
    const {userId} = req.params;
    try{
        const deletedRequest = await userRequest.findByIdAndDelete(userId);
        if(!deletedRequest){
            handleError(res, 404, 'User request not found');
            return;
        }
        res.status(200).json({ message: 'User request deleted successfully'});
    }catch(error){
        handleError(res, 500, 'Failed to delete user Request');
    }
};

//לתקן , לא עובד
