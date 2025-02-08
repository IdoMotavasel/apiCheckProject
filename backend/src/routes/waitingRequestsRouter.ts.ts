import { Router } from "express";
import { getWaitingRequests,updateUserRequest } from "../controllers/waitingRequestsController";
import { protectedRoute } from "../middleware/protectedRoute";

export default (router: Router): void => {
    router.get('/admin/:userId/waiting-requests', protectedRoute, getWaitingRequests);
    router.patch('/admin/update-user-request/:requestId',protectedRoute,updateUserRequest);
};