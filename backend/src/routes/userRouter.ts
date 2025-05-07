import { Router } from "express";
import { protectedRoute } from "../middleware/protectedRoute";
import { getActiveRequests } from "../controllers/activeRequestsController";
import { checkApi } from "../controllers/checkApiController";
import { getChecksHistory } from "../controllers/checksHistoryController";
import { createContainerFromTar, getApprovedApiCodesByUser, getContainersForAdminGroup } from "../controllers/containerController";
import { getContainerLogs, runContainer, stopContainer, executeInContainer } from "../controllers/dockerController";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export default (router: Router): void => {
    //Active Requests Routes
    router.get('/user/active-request/:userId', protectedRoute, getActiveRequests);

    //Check API Routes
    router.post('/user/checkApi/:userId',protectedRoute, checkApi);

    //Checks History Routes
    router.get('/user/checks-history/:userId', protectedRoute, getChecksHistory);

    //Container Routes
    router.post('/user/containers/create-from-api', protectedRoute, upload.single('tarFile'), createContainerFromTar);
    router.get('/user/containers/approved-apis/:userId', protectedRoute, getApprovedApiCodesByUser);
    router.get('/user/containers/admin-group/:userId', protectedRoute, getContainersForAdminGroup);

    //Docker Routes
    router.post('/user/docker/run', protectedRoute, runContainer);
    router.post('/user/docker/stop', protectedRoute, stopContainer);
    router.post('/user/docker/logs', protectedRoute, getContainerLogs);
    router.post('/user/docker/exec',protectedRoute ,executeInContainer);

};