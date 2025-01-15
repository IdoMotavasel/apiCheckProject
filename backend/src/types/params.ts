import { ParamsDictionary} from 'express-serve-static-core';

export interface Params extends ParamsDictionary {
    userId: string;
}