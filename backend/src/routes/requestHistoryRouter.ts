import { Router } from "express";
import { getRequestsHistory } from "../controllers/requestsHistoryController.ts";
import { protectedRoute } from "../middleware/protectedRoute";

export default (router: Router): void => {
  router.get('/requests-history/:userId', protectedRoute, getRequestsHistory);
};