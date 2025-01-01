import { Response } from 'express';

export const handleError = (res: Response, statusCode: number, message: string): void => {
    console.log(message);
    res.status(statusCode).json({ message });
};
