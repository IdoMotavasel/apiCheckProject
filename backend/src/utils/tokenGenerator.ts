import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

export const generateAccessToken = (userId: mongoose.Types.ObjectId , role: 'admin' | 'user'): string => {
    if(!accessTokenSecret)
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    return jwt.sign({ userId, role }, accessTokenSecret, {expiresIn: process.env.ACCESS_TOKEN_EXPIRATION});
};

export const generateRefreshToken = (userId: mongoose.Types.ObjectId , role: 'admin' | 'user'): string => {
    if(!refreshTokenSecret)
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    return jwt.sign({ userId, role }, refreshTokenSecret, {expiresIn: process.env.REFRESH_TOKEN_EXPIRATION});
};