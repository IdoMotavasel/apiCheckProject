import {Request, Response} from 'express';
import fs from 'fs-extra';
import path from 'path';
import {create} from 'tar';
import apiCode, {ApiCodeType} from '../db/apiCodeModel';
import { handleError } from '../utils/errorHandler';
import { CreateTarRequestBody } from '../types/tarControllerTypes';
import { Params } from "../types/params";

export const createFiles = (dockerfile: string, packageJson: string, apiCode: string, userId: string): string[] => {
    console.log("User ID:", userId);

    const directoryPath: string = path.resolve(__dirname, "../uploads",userId);
    console.log("Directory Path:", directoryPath);

    fs.ensureDirSync(directoryPath);

    const dockerfilePath: string = path.join(directoryPath, "DockerFile");
    const packageJsonPath: string = path.join(directoryPath, "package.json");
    const mainJsPath: string = path.join(directoryPath, "main.js");

    console.log("File Paths:", { dockerfilePath, packageJsonPath, mainJsPath });

    fs.writeFileSync(dockerfilePath, dockerfile);
    fs.writeFileSync(packageJsonPath,packageJson);
    fs.writeFileSync(mainJsPath, apiCode);

    return [dockerfilePath, packageJsonPath, mainJsPath];
};

export const createTarFile = async (files: string[], userId: string): Promise<string> => {
    const tarPath: string = path.resolve(__dirname, "../uploads", `${userId}.tar.gz`);
    const cwd: string = path.resolve(__dirname, "../uploads", userId);
    console.log("Creating tar at:", tarPath);
    console.log(`CWD: ${cwd}`);
    console.log(`Files: ${files.map((file) => path.resolve(cwd, file))}`);
    try{ 
        await create(
            {
                gzip: true,
                file: tarPath,
                cwd,
            },
            files.map((file) => path.resolve(cwd, file)) 
        );
        console.log("Tar file created successfully:", tarPath);
        return tarPath;
    }catch(error: any){
        console.error('Error creating tar file: ', error);
        throw error;
    }
    
};

export const createTar = async (req:Request<{},{},CreateTarRequestBody>, res:Response):Promise<void> => {
    const {dockerfile,packageJson,apiCode: apiCodeContent}=req.body;
    const userId: any = req.body.userId || (req as any).userId; // to find a better solution
    try{
        const filePaths: string[] = createFiles(dockerfile,packageJson,apiCodeContent,userId);
        const tarPath: string = await createTarFile(filePaths,userId);
        const newApiCode: ApiCodeType = new apiCode({
            description: req.body.description,
            zippedApi: fs.readFileSync(tarPath),
            userId,
        });
        await newApiCode.save();
        res.status(201).json({message: "Tar file created and saved successfully", fileId: newApiCode._id});
        fs.removeSync(path.dirname(tarPath));
    }catch(error: any){
        console.log(error);
        handleError(res, 500, 'internal server error tar');
    }
};

export const getTar = async (req:Request<Params,{},{}>, res:Response): Promise<void> => {
    const {userId}= req.params;
    try{
        const apicode: ApiCodeType | null = await apiCode.findOne({ userId });
        if(!apicode){
            handleError( res, 404, 'File not found');
            return;
        }
        const zippedApiBuffer: Buffer<ArrayBufferLike> = apicode.zippedApi instanceof Buffer 
            ? apicode.zippedApi
            : Buffer.from(apicode.zippedApi.toString('base64'), 'base64');
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="${userId}.tar.gz"`);
        console.log(apicode.zippedApi); 
        res.send(zippedApiBuffer);
    }catch(error: any){
        console.error('Error in getTar:', error);
        handleError(res, 500, 'Internal server error');
    }
};