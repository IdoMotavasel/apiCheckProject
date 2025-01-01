import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS:number = Number(process.env.SALT_ROUNDS); // Number of salt rounds for bcrypt

// Function to hash a password
export const hashPassword = async (password: string): Promise<string> => {
    const salt:string = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
};

// Function to compare a password with a hash
export const isPasswordMatch = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};