import * as redis from 'redis';
import axios from "axios";
import {v4 as uuid4} from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { EMessage, IResModel } from '../entities/syste.model';
import moment from 'moment';

const _default_format = 'YYYY-MM-DD HH:mm:ss';
export const getNow=()=>moment().format(_default_format);
export const redisClient =redis.createClient({url:process.env.DATABASE_HOST+'' || '0.0.0.0'});
export enum RedisKeys{
    storenamebyprofileuuid='store_name_by_profileuuid_',
}

export function PrintSucceeded(command:string,data: any, message: string, code: string = '0'): IResModel {
    return {
       command, data, message, code, status: 1
    } as IResModel;
}
export function PrintError(command:string,data: any, message: string, code: string = '0'): IResModel {
    return {
        command,data: data, message, code, status: 0
    } as IResModel;
}

