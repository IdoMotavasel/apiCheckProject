import { Request, Response } from "express";
import AdminModel , {AdminType} from "../db/adminModel";
import UserModel , {UserType} from "../db/userModel";
import { isPasswordMatch, hashPassword } from "../utils/passwordHandler";
import { LoginRequestBody, RegisterRequestBody } from "../types/authenticationControllerTypes";
import { handleError } from "../utils/errorHandler";
import { Blacklist } from "../db/blacklistModel";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenGenerator";
import { verifyRefreshToken } from "../utils/tokenVerification";

const adminAuthorizationSecret = process.env.ADMIN_AUTHORIZATION_SECRET; //להעביר את זה לצד לקוח ואת הבדיקה שלו

export const login = async ( req: Request<{},{},LoginRequestBody>, res: Response): Promise<void> => {
    const { username, password } = req.body;

    //frontend: add field is missing check

    let retrievedUser: UserType | AdminType | null;
    try{
        retrievedUser = await AdminModel.findOne({ username: username }) || await UserModel.findOne({ username: username });
    }
    catch(error){
        handleError(res, 400, 'Login Failed');
        return;
    }
    
    if(!retrievedUser){
        handleError(res, 400, 'User not found');
        return;
    }
    if(!(await isPasswordMatch(password, retrievedUser.password))){
        handleError(res, 400, 'Wrong password');
        return;
    }

    const accessToken: string = generateAccessToken(retrievedUser._id,retrievedUser.role);
    const refreshToken: string = generateRefreshToken(retrievedUser._id,retrievedUser.role);

    res.status(200).json({accessToken: accessToken, refreshToken: refreshToken, message: 'Logged in successfully', userId: retrievedUser._id}); 
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if(!refreshToken){
        handleError(res,400,'Refresh token is required');
        return;
    }

    try{
        const verified = verifyRefreshToken(refreshToken);
        if (!verified) {
            handleError(res, 400, 'Invalid refresh token');
            return;
        }
        await Blacklist.create({ token: refreshToken});
        res.status(200).json({ message: 'Logged out successfully'});
    }catch(error){
        handleError(res,500,'Failed to log out.')
    }
};

export const register = async ( req: Request<{},{},RegisterRequestBody>, res: Response): Promise<void> => {
    const { username, password, role, adminGroupCode, adminAuthorizationCode } = req.body;
    const existingUser = await UserModel.findOne({ username }) || await AdminModel.findOne({ username });
    if(existingUser){
        handleError(res, 400, 'Username already exists');
        return;
    }
    const hashedPassword = await hashPassword(password);
    if( role === "user"){

        const admin = await AdminModel.findOne({adminGroupCode});
        if(!admin){
            handleError(res,404,'Invalid adminGroupCode');
            return;
        }
        const newUser = new UserModel({
            username,
            password: hashedPassword,
            role,
            adminId:admin._id,
        });
        const savedUser = await newUser.save();

        admin.usersGroup.push(savedUser._id);
        await admin.save();

        res.status(201).json({ message: "User registered successfully", user: savedUser});
        return;
    }else if( role === "admin"){
        if (adminAuthorizationCode !== adminAuthorizationSecret){
            handleError(res,403,'Invalid adminAuthorizationCode');
            return;
        }
        const generatedAdminGroupCode = generateObfuscatedGroupCode();
        const newAdmin = new AdminModel({
            username,
            password: hashedPassword,
            role,
            usersGroup: [],
            adminGroupCode: generatedAdminGroupCode,
        });

        const savedAdmin = await newAdmin.save();
        res.status(201).json({ message: 'Admin registered successfully', admin: savedAdmin});
    }
};

const generateObfuscatedGroupCode = (): string => {
    // current timestamp in 'YYYYMMDDHHMMSS' format
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours()
        .toString()
        .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds()
        .toString()
        .padStart(2, '0')}`;

    const shuffledTimestamp = parseInt(timestamp.split('').reverse().join(''), 10).toString(36).toUpperCase();
    const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${shuffledTimestamp}-${randomString}`;
};

//to do:
//use case and uml
//create group codes for each admin that register - did
//change all errors to handle error.
//user: username, password, role, admin group code
//admin: username, password, role, admin group code, userGroup