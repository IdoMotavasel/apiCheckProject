import { Router } from "express";
import authenticationRouter from "./authenticationRouter";
import refreshTokenRouter from "./refreshTokenRouter";
import tarRouter from "./tarRouter";
import userRequestsRouter from "./userRequestsRouter";

const router: Router = Router();
export default (): Router => {
    authenticationRouter(router);
    refreshTokenRouter(router);
    tarRouter(router);
    userRequestsRouter(router);
    return router;
}