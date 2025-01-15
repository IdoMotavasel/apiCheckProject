import { Router } from "express";
import authenticationRouter from "./authenticationRouter";
import refreshTokenRouter from "./refreshTokenRouter";
import tarRouter from "./tarRouter";
import checkApiRouter from "./checkApiRouter";
import activeRequestsRouter from "./activeRequestsRouter";
import checksHistoryRouter from "./checksHistoryRouter";

const router: Router = Router();
export default (): Router => {
    authenticationRouter(router);
    refreshTokenRouter(router);
    tarRouter(router);
    checkApiRouter(router);
    activeRequestsRouter(router);
    checksHistoryRouter(router);
    return router;
}