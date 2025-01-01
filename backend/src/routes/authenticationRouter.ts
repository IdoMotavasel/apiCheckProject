import { Router } from "express";
import { register, login, logout } from '../controllers/authenticationController';
import { protectedRoute } from "../middleware/protectedRoute";

export default( router: Router): void =>{
    router.post('/auth/register', register);
    router.post('/auth/login', login);
    router.post('/auth/logout',protectedRoute,logout);
};