import { Router } from "express";
import { createUserRequest, deleteUserRequest } from "../controllers/userRequestsController";
import { protectedRoute } from "../middleware/protectedRoute";

export default( router: Router): void =>{
    router.post('/userRequest',protectedRoute, createUserRequest);
    router.delete('/userRequest/:userId',protectedRoute, deleteUserRequest);
};