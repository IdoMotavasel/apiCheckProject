import { Router } from "express";
import authenticationRouter from "./authenticationRouter";
import refreshTokenRouter from "./refreshTokenRouter";
import tarRouter from "./tarRouter";
import checkApiRouter from "./checkApiRouter";
import activeRequestsRouter from "./activeRequestsRouter";
import checksHistoryRouter from "./checksHistoryRouter";
import waitingRequestsRouter from "./waitingRequestsRouter.ts";
import requestHistoryRouter from "./requestHistoryRouter";
import groupDataRouter from "./groupDataRouter";

// ---------------- MAIN SERVER ROUTER -----------------

const router: Router = Router();
export default (): Router => {
    authenticationRouter(router);
    refreshTokenRouter(router);
    tarRouter(router);
    checkApiRouter(router);
    activeRequestsRouter(router);
    checksHistoryRouter(router);
    waitingRequestsRouter(router);
    requestHistoryRouter(router);
    groupDataRouter(router);
    return router;
}