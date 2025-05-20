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

// ===========================
// Create Container from uploaded tar file
// ===========================
export const createContainerFromTar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiCodeName, userId } = req.body;
    const tarFile = req.file;// Uploaded .tar file

    // Check if all required fields are provided
    if (!apiCodeName || !userId || !tarFile) {
      console.log("Missing required fields or tar file.");
      res.status(400).json({ message: 'Missing required fields or tar file.' });
      return;
    }

    // Sanitize API code name (lowercase, no spaces or special characters)
    const sanitizedName = apiCodeName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();

    // Check if a container for this user & API already exists
    const existingContainer = await ContainerModel.findOne({ sanitizedName, userId });
    if (existingContainer) {
      res.status(409).json({ message: `Container of userId "${userId}" for API "${sanitizedName}" already exists.` });
      return;
    }

    // Fetch the approved API code from DB
    const apiCodeDoc = await ApiCode.findOne({ name: apiCodeName });
    if (!apiCodeDoc || !apiCodeDoc.apiCode) {
      console.log("API code not found or missing code content.");
      res.status(404).json({ message: 'API code not found or missing code content.' });
      return;
    }

    // Helper to normalize code (remove extra spaces, windows line endings)
    const normalizeCode = (code: string) =>
      code.replace(/\r\n/g, '\n').replace(/\s+$/gm, '').trim();

    const apiCodeFromDb = normalizeCode(apiCodeDoc.apiCode);
    
    // Create temporary directory to extract tar contents
    const tempDir = path.join(os.tmpdir(), `container-${uuidv4()}`);
    fs.mkdirSync(tempDir);

    // Save uploaded tar file to temp directory
    const tarPath = path.join(tempDir, 'container.tar');
    fs.writeFileSync(tarPath, tarFile.buffer);

    // Extract tar file into tempDir
    await extract({ C: tempDir, file: tarPath });

    // Check if package.json exists
    const packageJsonPath = path.join(tempDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log("package.json not found in tar.");
      res.status(400).json({ message: 'package.json not found in tar archive.' });
      return;
    }

    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Path of main file
    const tsMainPath = path.join(tempDir, 'src', 'index.ts');
    let extractedCode = '';

    if (fs.existsSync(tsMainPath)) {
      // TypeScript project detected
      console.log('Detected TypeScript project (src/index.ts found).');
      extractedCode = normalizeCode(fs.readFileSync(tsMainPath, 'utf-8'));
    } else {
      // Otherwise fallback to JavaScript project
      const mainFileName = packageJson.main;
      if (!mainFileName) {
        console.log("Main file not specified in package.json.");
        res.status(400).json({ message: 'Main file not specified in package.json.' });
        return;
      }

      const mainFilePath = path.join(tempDir, mainFileName);
      if (!fs.existsSync(mainFilePath)) {
        console.log(`Main file "${mainFileName}" not found in tar.`);
        res.status(400).json({ message: `Main file "${mainFileName}" not found in tar archive.` });
        return;
      }

      console.log('Detected JavaScript project (using main field in package.json).');
      extractedCode = normalizeCode(fs.readFileSync(mainFilePath, 'utf-8'));
    }

    console.log("Extracted code from tar:", extractedCode);

    // Compare extracted code with the approved code from DB
    if (extractedCode !== apiCodeFromDb) {
      console.log("Provided API code does not match the approved version.");
      res.status(400).json({ message: 'Provided API code does not match the approved version.' });
      return;
    }

    // Save container in DB
    const container = await ContainerModel.create({
      sanitizedName,
      tarData: tarFile.buffer,
      userId,
    });

    // Save the tar file also to a downloads directory for local testing
    const outputDir = path.join(__dirname, '../../downloads');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filename = sanitizedName + '.tar';
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, tarFile.buffer);

    // Respond success
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
  
  
// ===========================
// Get Approved API Codes for a User
// ===========================
export const getApprovedApiCodesByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'Missing userId in request params' });
      return;
    }

    // Find approved user requests with associated API codes
    const approvedRequests = await UserRequest.find({
      userId,
      status: 'checked',
      adminsDecision: 'approved',
    }).populate('apiCodeId', 'name description'); // Populate only name and description fields

    // Map approved requests into array of API name + description
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

// ===========================
// Get Containers belonging to Admin's Group
// ===========================
export const getContainersForAdminGroup = async (req: Request<Params, {}, {}>, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        res.status(400).json({ message: 'Missing userId parameter.' });
        return;
      }

      // Find user by ID
      const user = await UserModel.findById(userId);
      if (!user || !user.adminId) {
        res.status(404).json({ message: 'User or admin reference not found.' });
        return;
      }
  
      // Find admin who owns this user
      const admin = await AdminModel.findById(user.adminId);
      if (!admin) {
        res.status(404).json({ message: 'Admin or user group not found.' });
        return;
      }

      // Get all users that belong to this admin
      const userIds = await UserModel.find({ adminId: admin._id }).distinct('_id');
      if (userIds.length === 0) {
        res.status(200).json({ containers: [] });
        return;
      }
      // Find all containers created by users in this admin group
      const containers = await ContainerModel.find({
        userId: { $in: userIds },
      })
        .select('sanitizedName')
        .lean();
  
      // Fetch matching descriptions from API codes
      const apiCodeNames = containers.map(c => c.sanitizedName);
      const apiCodes = await ApiCode.find({ name: { $in: apiCodeNames } }).select('name description').lean();

      // Merge container list with their description
      const result = containers.map(container => {
      const matchingApi = apiCodes.find(api => api.name === container.sanitizedName);
      return {
        sanitizedName: container.sanitizedName,
        description: matchingApi?.description || '',
      };
    });
      res.status(200).json({ containers: result });
    } catch (err) {
      console.error('Error fetching containers for admin group:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };

  // ===========================
  // Delete a Container
  // ===========================
  export const deleteContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sanitizedName, userId } = req.body;

    if (!sanitizedName || !userId) {
      res.status(400).json({ message: 'Missing sanitizedName or userId' });
      return;
    }

    // Find and delete container by sanitizedName and userId
    const deleted = await ContainerModel.findOneAndDelete({ sanitizedName, userId });

    if (!deleted) {
      res.status(404).json({ message: 'Container not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Container deleted successfully' });
  } catch (error) {
    console.error('Error deleting container:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

  


