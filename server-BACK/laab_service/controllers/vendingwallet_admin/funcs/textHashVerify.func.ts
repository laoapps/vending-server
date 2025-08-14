import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_FindMyWallet, LAAB_Register2, LAAB_TextHashVerify, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";

export class TextHashVerifyFunc {

    private ownerUuid:string;
    private walletType: string;
    private sender: string;
    private hashM: string;
    private info: string;

    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`find merchant`, 1);

                this.InitParams(params);

                console.log(`find merchant`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`find merchant`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`find merchant`, 4);

                const Verify = await this.Verify();
                if (Verify != IENMessage.success) throw new Error(Verify);

                console.log(`find merchant`, 5);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.sender = params.sender;
        this.walletType = IVendingWalletType.merchant;
        this.hashM = params.hashM;
        this.info = params.info;

    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.sender && this.hashM && this.info)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: this.walletType } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.uuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);
                this.passkeys = run.passkeys;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private Verify(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: this.sender,
                    hashM: this.hashM,
                    info: this.info,

                    // access by passkey
                    phonenumber: this.suuid,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_TextHashVerify, params);
                if (run.data.status != 1) return resolve(run.data.message);

                this.response = {
                    result: run.data.info,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}