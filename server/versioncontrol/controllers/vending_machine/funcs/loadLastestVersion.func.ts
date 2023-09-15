import { Transaction } from "sequelize";
import { dbConnection, vendingVersionEntity } from "../../../../entities";
import { IENMessage } from "../../../../services/laab.service";
import { ICreateVendingVersion } from "../../../models/base.model";

export class LoadLastestVersionFunc {

    private response: any = {} as any;

    constructor() {}

    public Init(params: ICreateVendingVersion): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
            

                const LoadData = await this.LoadData();
                if (LoadData != IENMessage.success) throw new Error(LoadData);

                resolve(this.response);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private LoadData(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const condition: any = {
                    where: {
                        isActive: true
                    },
                    order: [[ 'id', 'DESC' ]]
                }

                const run = await vendingVersionEntity.findOne(condition);
                this.response = {
                    data: run,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

}