// controllers/containerController.ts
import { Request, Response } from 'express';
import ContainerModel from '../db/containerModel';
import ApiCode from '../db/apiCodeModel';
import AdminModel from '../db/adminModel';
import UserModel from '../db/userModel';
import { UserRequest } from '../db/userRequestModel';
import fs from 'fs';
import path from 'path';
import {extract} from 'tar';
import os from 'os';
import {v4 as uuidv4} from 'uuid';
import { Params } from '../types/params';

export const createContainerFromTar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { apiCodeName, userId, version } = req.body;
      const tarFile = req.file;
      if (!apiCodeName || !userId || !version || !tarFile) {
        console.log("Missing required fields or tar file.");
        res.status(400).json({ message: 'Missing required fields or tar file.' });
        return;
      }

      const sanitizedName = apiCodeName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();

      const existingContainer = await ContainerModel.findOne({ sanitizedName, version });
      if (existingContainer) {
        console.log(`Container with version "${version}" for API "${sanitizedName}" already exists.`);
        res.status(409).json({ message: `Container with version "${version}" for API "${sanitizedName}" already exists.` });
        return;
      }
  
      const apiCodeDoc = await ApiCode.findOne({ name: apiCodeName });
      if (!apiCodeDoc || !apiCodeDoc.apiCode) {
        console.log("API code not found or missing code content.");
        res.status(404).json({ message: 'API code not found or missing code content.' });
        return;
      }

      const normalizeCode = (code: string) =>
        code.replace(/\r\n/g, '\n').replace(/\s+$/gm, '').trim();
  
      const apiCodeFromDb = normalizeCode(apiCodeDoc.apiCode);
  
      const tempDir = path.join(os.tmpdir(), `container-${uuidv4()}`);
      fs.mkdirSync(tempDir);
      const tarPath = path.join(tempDir, 'container.tar');
      fs.writeFileSync(tarPath, tarFile.buffer);
  
      await extract({ C: tempDir, file: tarPath });
  
      const packageJsonPath = path.join(tempDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.log("package.json not found in tar");
        res.status(400).json({ message: 'package.json not found in tar archive.' });
        return;
      }
  
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const mainFileName = packageJson.main;
      if (!mainFileName) {
        console.log("main file not specified in package json");
        res.status(400).json({ message: 'Main file not specified in package.json.' });
        return;
      }
  
      const mainFilePath = path.join(tempDir, mainFileName);
      if (!fs.existsSync(mainFilePath)) {
        console.log("main file not found in tar");
        res.status(400).json({ message: `Main file "${mainFileName}" not found in tar archive.` });
        return;
      }
  
      const extractedCode = normalizeCode(fs.readFileSync(mainFilePath, 'utf-8'));
      console.log("api code from tar file: ", extractedCode);
      if (extractedCode !== apiCodeFromDb) {
        console.log("api code not matching the tar main code");
        res.status(400).json({ message: 'Provided API code does not match the approved version.' });
        return;
      }
  
      const container = await ContainerModel.create({
        sanitizedName,
        tarData: tarFile.buffer,
        userId,
        version,
      });
  
      const outputDir = path.join(__dirname, '../../downloads');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
  
      const filename = sanitizedName + '.tar';
      const outputPath = path.join(outputDir, filename);
      fs.writeFileSync(outputPath, tarFile.buffer);
  
      res.status(201).json({
        message: 'Container validated, saved, and tar downloaded.',
        containerId: container._id,
        localPath: outputPath,
      });
    } catch (err) {
      console.error('Error handling tar container:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
};
  
  

export const getApprovedApiCodesByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'Missing userId in request params' });
      return;
    }

    const approvedRequests = await UserRequest.find({
      userId,
      status: 'checked',
      adminsDecision: 'approved',
    }).populate('apiCodeId', 'name description');

    const approvedNames = approvedRequests
      .map((req) => {
        const apiCode = req.apiCodeId as unknown as { name: string; description: string };
        return {
            name: apiCode.name,
            description: apiCode.description,
        }
      })

    res.status(200).json({ approvedApiNames: approvedNames });
  } catch (error) {
    console.error('Error fetching approved APIs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getContainersForAdminGroup = async (req: Request<Params, {}, {}>, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        res.status(400).json({ message: 'Missing userId parameter.' });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user || !user.adminId) {
        res.status(404).json({ message: 'User or admin reference not found.' });
        return;
      }
  
      const admin = await AdminModel.findById(user.adminId);
      if (!admin) {
        res.status(404).json({ message: 'Admin or user group not found.' });
        return;
      }

      const userIds = await UserModel.find({ adminId: admin._id }).distinct('_id');
      if (userIds.length === 0) {
        res.status(200).json({ containers: [] });
        return;
      }
      // Find all containers created by users in the admin's user group
      const containers = await ContainerModel.find({
        userId: { $in: userIds },
      })
        .select('sanitizedName version')
        .lean();
  
      // Fetch matching descriptions from ApiCode collection
      const apiCodeNames = containers.map(c => c.sanitizedName);
      const apiCodes = await ApiCode.find({ name: { $in: apiCodeNames } }).select('name description').lean();
      const result = containers.map(container => {
      const matchingApi = apiCodes.find(api => api.name === container.sanitizedName);
      return {
        sanitizedName: container.sanitizedName,
        version: container.version,
        description: matchingApi?.description || '',
      };
    });
      res.status(200).json({ containers: result });
    } catch (err) {
      console.error('Error fetching containers for admin group:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
  


