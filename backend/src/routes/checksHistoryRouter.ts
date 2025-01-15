import { Router } from "express";
import { getChecksHistory } from "../controllers/checksHistoryController";
import { protectedRoute } from "../middleware/protectedRoute";

export default (router: Router): void => {
    router.get('/checks-history/:userId', protectedRoute, getChecksHistory);
};