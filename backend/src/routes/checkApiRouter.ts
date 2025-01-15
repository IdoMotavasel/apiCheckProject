import { Router } from "express";
import { checkApi } from "../controllers/checkApiController";
import { protectedRoute } from "../middleware/protectedRoute";

export default( router: Router): void =>{
    router.post('/checkApi/:userId',protectedRoute, checkApi);
};