import { IBase } from "./base.model";

export interface IClientlog extends IBase {
    machineId: string;
    errorLog: any;
    description: any;
}