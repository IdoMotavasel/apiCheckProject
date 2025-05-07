import { Router } from "express";
import { protectedRoute } from "../middleware/protectedRoute";
import { getGroupData, removeUserFromGroup, getGroupStats } from "../controllers/groupDataController";
import { getRequestsHistory } from "../controllers/requestsHistoryController.ts";
import { getWaitingRequests, updateUserRequest } from "../controllers/waitingRequestsController";

export default( router: Router): void =>{
    //Group Data Routes
    router.get('/admin/:userId/group-data', protectedRoute, getGroupData);
    router.delete('/admin/:adminId/remove-user/:userId', protectedRoute, removeUserFromGroup);
    router.get('/admin/:adminId/group-stats', protectedRoute, getGroupStats);

    //Requests History Routes
    router.get('/admin/requests-history/:userId', protectedRoute, getRequestsHistory);

    //Waiting Requests Routes
    router.get('/admin/:userId/waiting-requests', protectedRoute, getWaitingRequests);
    router.patch('/admin/update-user-request/:requestId',protectedRoute,updateUserRequest);
};