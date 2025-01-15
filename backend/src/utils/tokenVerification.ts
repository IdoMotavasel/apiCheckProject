import jwt from 'jsonwebtoken';

const accessTokenSecret: string = process.env.ACCESS_TOKEN_SECRET!;
const refreshTokenSecret: string = process.env.REFRESH_TOKEN_SECRET!;

export const verifyAccessToken = (token: string): string | jwt.JwtPayload | null => {
    if(!accessTokenSecret)
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    try{
        return jwt.verify(token,accessTokenSecret) as jwt.JwtPayload;
    }
    catch(error: any){
        console.error('Access token verification failed:', error);
        return null;
    }
};

export const verifyRefreshToken = (token: string): string | jwt.JwtPayload | null => {
    if(!refreshTokenSecret)
        throw new Error('REFRESH_TOKEN_SECRET is not defined');
    try{
        return jwt.verify(token,refreshTokenSecret) as jwt.JwtPayload;
    }
    catch(error: any){
        console.error('Refresh token verification failed:', error);
        return null;
    }
};