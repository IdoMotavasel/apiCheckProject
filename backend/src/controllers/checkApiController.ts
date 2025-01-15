import { Request, Response } from 'express';
import ApiCode, { ApiCodeType } from '../db/apiCodeModel';
import {UserRequest, UserRequestType} from '../db/userRequestModel';
import { createTarFile } from '../utils/createTarFile';
import UserModel from '../db/userModel';
import { checkApiRequestBody} from '../types/checkApiTypes';
import { Params } from '../types/params';
import { UserType } from '../db/userModel';

export const checkApi = async (req: Request<Params,{},checkApiRequestBody>, res: Response):Promise<void> => {
    const { description, dockerfileCode, packageJsonCode, apiCode } = req.body;
    console.log('entered Check api');
    console.log('description: ',description);
    console.log('dockerfile: ',dockerfileCode);
    console.log('packageJson: ',packageJsonCode);
    console.log('mainCode: ',apiCode);

    const {userId} = req.params;
    console.log('userId: ', userId);
    try{
        const user: UserType | null = await UserModel.findById(userId);
        if (!user) {
            console.log('user not found');
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const username: string = user.username;
        console.log('username retrieved: ', username);
        
        const tarFile: Buffer<ArrayBufferLike> = await createTarFile([
            { name: 'Dockerfile', content: dockerfileCode },
            { name: 'package.json', content: packageJsonCode },
            { name: 'main.js', content: apiCode },
        ]);
    
        // Randomly determine if the API is valid (for now)
        const isValid: boolean = Math.random() > 0.5;
        const apiCodeCreated: ApiCodeType = await ApiCode.create({
            description,
            zippedApi: tarFile,
            userId,
        });
        const userRequest: UserRequestType = await UserRequest.create({
            isValid,
            username,
            apiCodeId: apiCodeCreated._id,
        });

        res.status(200).json({
            message: 'API code processed successfully.',
            validityCheck: isValid ? 'valid' : 'invalid',
        });
    }catch(error:any){
        console.error('Error in checkApi:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};