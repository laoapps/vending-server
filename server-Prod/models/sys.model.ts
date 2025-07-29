import { IBase } from "./base.model";

export interface IClientlog extends IBase {
    machineId: string;
    errorLog: any;
    description: any;
}


export interface ILogsTemp {
    id?: number;
    uuid?: string;
    createdAt: Date;
    machineId: string;
    mstatus: any;
    description: any;
}