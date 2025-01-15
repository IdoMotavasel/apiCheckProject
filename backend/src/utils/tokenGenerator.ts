import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const accessTokenSecret: string = process.env.ACCESS_TOKEN_SECRET!;
const refreshTokenSecret: string = process.env.REFRESH_TOKEN_SECRET!;

export const generateAccessToken = (userId: mongoose.Types.ObjectId , role: 'admin' | 'user', username: string): string => {
    if(!accessTokenSecret)
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    return jwt.sign({ userId, role, username }, accessTokenSecret, {expiresIn: process.env.ACCESS_TOKEN_EXPIRATION});
};

export const generateRefreshToken = (userId: mongoose.Types.ObjectId , role: 'admin' | 'user', username: string): string => {
    if(!refreshTokenSecret)
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    return jwt.sign({ userId, role, username }, refreshTokenSecret, {expiresIn: process.env.REFRESH_TOKEN_EXPIRATION});
};