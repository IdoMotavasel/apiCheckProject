import { Router } from "express";
import { refreshToken } from "../controllers/refreshTokenController";


export default( router: Router): void =>{
    router.post('/refresh', refreshToken);
};