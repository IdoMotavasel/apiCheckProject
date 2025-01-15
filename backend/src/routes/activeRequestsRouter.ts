import { Router } from "express";
import { getActiveRequests } from "../controllers/activeRequestsController";
import { protectedRoute } from "../middleware/protectedRoute";

export default (router: Router): void => {
    router.get('/active-request/:userId', protectedRoute, getActiveRequests);
};