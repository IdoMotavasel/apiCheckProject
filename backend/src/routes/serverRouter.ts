import { Router } from "express";
import authenticationRouter from "./authenticationRouter";
import refreshTokenRouter from "./refreshTokenRouter";
import userRouter from "./userRouter";
import adminRouter from "./adminRouter";

// ---------------- MAIN SERVER ROUTER -----------------

const router: Router = Router();
export default (): Router => {
    authenticationRouter(router);
    refreshTokenRouter(router);
    userRouter(router);
    adminRouter(router);
    return router;
}