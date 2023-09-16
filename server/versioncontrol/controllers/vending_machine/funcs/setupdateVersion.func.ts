import { Transaction } from "sequelize";
import { dbConnection, vendingVersionEntity } from "../../../../entities";
import { IENMessage } from "../../../../services/laab.service";
import { ISetUpdateVendingVersion } from "../../../models/base.model";
import { convertVersion, redisClient } from "../../../../services/service";

export class SetUpdateVersionFunc {

    private uuid: string;
    private machines: Array<string> = [];

    private version: any = {} as any;
    private response: any = {} as any;

    constructor() {}

    public Init(params: ISetUpdateVendingVersion): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const FindVersion = await this.FindVersion();
                if (FindVersion != IENMessage.success) throw new Error(FindVersion);

                const SetVersion = await this.SetVersion();
                if (SetVersion != IENMessage.success) throw new Error(SetVersion);

                resolve(this.response);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private InitParams(params: ISetUpdateVendingVersion): void {
        this.uuid = params.uuid;
        this.machines = params.machines;
    }

    private ValidateParams(): string {
        if (!(this.uuid)) return IENMessage.parametersEmpty;
        if (this.machines != undefined && Object.entries(this.machines).length == 0) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindVersion(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const conditino: any = {
                    where: {
                        uuid: this.uuid,
                        isActive: true
                    }
                }
                const run = await vendingVersionEntity.findOne(conditino);
                if (run == null) throw new Error(IENMessage.notFoundUpdateVersion);
                this.version = {
                    uuid: run.uuid,
                    version: run.version,
                    versionText: convertVersion(run.version),
                    url: run.file.url
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private SetVersion(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                for(let i = 0; i < this.machines.length; i++) {
                    await redisClient.set(`${this.machines[i]}_version`, JSON.stringify(this.version));
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}