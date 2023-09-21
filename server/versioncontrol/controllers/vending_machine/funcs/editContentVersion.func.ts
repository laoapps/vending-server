import { Transaction } from "sequelize";
import { dbConnection, vendingVersionEntity } from "../../../../entities";
import { IENMessage } from "../../../../services/laab.service";
import { ICreateVendingVersion } from "../../../models/base.model";

export class EditContentVersionFunc {

    private transaction: Transaction;

    private id: number;
    private title: string;
    private subtitle: string; 
    private readme: {
        section: Array<string>,
        description: Array<string>,
        hightlight: Array<string>
    } = {} as any;

    private connection: any = {} as any;
    private response: any = {} as any;

    constructor() {}

    public Init(params: ICreateVendingVersion): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            this.transaction = await dbConnection.transaction();
            try {
                
                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const FindData = await this.FindData();
                if (FindData != IENMessage.success) throw new Error(FindData);

                const UpdateContent = await this.UpdateContent();
                if (UpdateContent != IENMessage.success) throw new Error(UpdateContent);

                await this.transaction.commit();
                resolve(this.response);

            } catch (error) {
                await this.transaction.rollback();
                resolve(error.message);
            }
        });
    }

    private InitParams(params: ICreateVendingVersion): void {
        this.id = params.id;
        this.title = params.title;
        this.subtitle = params.subtitle;
        this.readme = params.readme;
    }

    private ValidateParams(): string {
        if (!(this.id && this.title && this.subtitle)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindData(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const condition = {
                    where: {
                        id: this.id
                    }
                }

                const run = await vendingVersionEntity.findOne(condition);
                if (run == null) return resolve(IENMessage.invalidData);
                this.connection = run;

                resolve(IENMessage.success);
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private UpdateContent(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                this.connection.header = {
                    title: this.title,
                    subtitle: this.subtitle
                }
                this.connection.readme = this.readme;
                
                const run = await this.connection.save({ transaction: this.transaction });
                if (!run) return resolve(IENMessage.updateContentVersionFail);

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

}