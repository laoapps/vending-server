import { Transaction } from "sequelize";
import { dbConnection, vendingVersionEntity } from "../../../../entities";
import { IENMessage } from "../../../../services/laab.service";
import { ICreateVendingVersion } from "../../../models/base.model";

export class CreateVersionFunc {

    private transaction: Transaction;

    private commit_version: string;
    private title: string;
    private subtitle: string; 
    private file: { 
        url: string, 
        filename: string, 
        filesize: string 
    } = {} as any;
    private readme: {
        section: Array<string>,
        description: Array<string>,
        hightlight: Array<string>
    } = {} as any;

    private id: number;
    private uuid: string;
    private response: any = {} as any;

    constructor() {}

    public Init(params: ICreateVendingVersion): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            this.transaction = await dbConnection.transaction();
            try {
                
                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const CreateVersion = await this.CreateVersion();
                if (CreateVersion != IENMessage.success) throw new Error(CreateVersion);

                const AutoUpdateVersion = await this.AutoUpdateVersion();
                if (AutoUpdateVersion != IENMessage.success) throw new Error(AutoUpdateVersion);

                await this.transaction.commit();
                resolve(this.response);

            } catch (error) {
                await this.transaction.rollback();
                resolve(error.message);
            }
        });
    }

    private InitParams(params: ICreateVendingVersion): void {
        this.commit_version = params.commit_version;
        this.title = params.title;
        this.subtitle = params.subtitle;
        this.file = params.file;
        this.readme = params.readme;
    }

    private ValidateParams(): string {
        if (!(this.file.url && this.file.filename && this.file.filesize)) return IENMessage.invalidFile;
        if (!(this.commit_version && this.title && this.subtitle)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private CreateVersion(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    commit_version: this.commit_version,
                    header: {
                        title: this.title,
                        subtitle: this.subtitle,
                    },
                    file: this.file,
                    readme: this.readme
                }

                const run = await vendingVersionEntity.create(params, { transaction: this.transaction });
                if (!run) return resolve(IENMessage.createVersionFail);
                this.id = run.id;
                this.uuid = run.uuid;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private AutoUpdateVersion(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let version: string = '';
                for(let i = 0; i < 1; i++) {
                    for(let j = 0; j < 11 - this.id.toString().length; j++) {
                        version += '0';
                    }
                    version = version + this.id.toString();
                }

                const model = {
                    version: version
                }
                const condition = {
                    where: {
                        id: this.id
                    },
                    transaction: this.transaction
                }
                const run = await vendingVersionEntity.update(model, condition);
                if (!run) return resolve(IENMessage.updateUniqueVersionFail);

                this.response = {
                    id: this.id,
                    uuid: this.uuid,
                    version: version,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}