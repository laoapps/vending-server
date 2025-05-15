import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_Register2, LAAB_RegisterCoin, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, vendingWallet } from "../../../../entities";

export class CreateLockerWalletCoinFunc {

    private transaction: Transaction;
    
    private ownerUuid:string;
    private machineClientId: string;
    private coinListId: string;
    private coinCode: string;

    private uuid: string;
    private suuid: string;
    private walletType: string;
    private passkeys:string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            this.transaction = await dbConnection.transaction();
            try {

                console.log(`create vending wallet coin`, 1);

                this.InitParams(params);

                console.log(`create vending wallet coin`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create vending wallet coin`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`create vending wallet coin`, 4);

                const FindLockerWallet = await this.FindLockerWallet();
                if (FindLockerWallet != IENMessage.success) throw new Error(FindLockerWallet);

                const RegisterCoinLockerWallet = await this.RegisterCoinLockerWallet();
                if (RegisterCoinLockerWallet != IENMessage.success) throw new Error(RegisterCoinLockerWallet);

                console.log(`create vending wallet coin`, 5);

                await this.transaction.commit();
                resolve(this.response);
                
            } catch (error) {

                await this.transaction.rollback();
                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.machineClientId = params.machineId;

        this.walletType = IVendingWalletType.lockerWallet;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.machineClientId)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: IVendingWalletType.merchant } });
                if (run == null) throw new Error(IENMessage.merchantHasNotCreatedYet);
                this.coinListId = run.coinListId;
                this.coinCode = run.coinCode;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindLockerWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, machineClientId: this.machineClientId, walletType: this.walletType } });
                if (run == null) throw new Error(IENMessage.invalidLockerWallet);
                this.uuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);
                this.passkeys = run.passkeys;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private RegisterCoinLockerWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: this.suuid,
                    coin_list_id: this.coinListId,
                    coin_code: this.coinCode,

                    // access by passkey
                    phonenumber: this.suuid,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_RegisterCoin, params);
                if (run.data.status != 1) return resolve(run.data.message);

                this.response = {
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