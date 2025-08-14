import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_FindMyWallet, LAAB_Login, LAAB_Register2 } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";

export class LoginFunc {

    private phonenumber: string;
    private password: string;

    private response: any = {} as any;

    constructor() { }

    public Init(params: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                console.log(`login`, 1);

                this.InitParams(params);

                console.log(`login`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`login`, 3);

                const LAABLogin = await this.LAABLogin();
                if (LAABLogin != IENMessage.success) throw new Error(LAABLogin);

                console.log(`login`, 4);

                resolve(this.response);

            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.phonenumber = params.phonenumber;
        this.password = params.password;
    }

    private ValidateParams(): string {
        if (!(this.phonenumber && this.password)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private LAABLogin(): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const params = {
                    phonenumber: this.phonenumber,
                    password: this.password
                }
                console.log(`-->LAABLogin`, LAAB_Login);
                const run = await axios.post(LAAB_Login, params);
                console.log(`response`, run.data);
                if (run.data.status != 1) return resolve(run.data.message);

                this.response = {
                    token: run.data.info.token,
                    ownerUuid: this.phonenumber,
                    name: run.data.info.name,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}