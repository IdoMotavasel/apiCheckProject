import { Router } from "express";
import { getGroupData } from "../controllers/groupDataController";
import { protectedRoute } from "../middleware/protectedRoute";

export default (router: Router): void => {
    router.get('/admin/:userId/group-data', protectedRoute, getGroupData);
};