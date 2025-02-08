import { Router } from "express";
import { createTar, getTar } from "../controllers/tarController";
import { protectedRoute } from "../middleware/protectedRoute";

//------------ USELESS RIGHT NOW ---------------

export default( router: Router): void =>{
    router.get('/getTar/:userId',protectedRoute, getTar);
    router.post('/createTar',protectedRoute, createTar);
};