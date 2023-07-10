import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_CoinTransfer, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";
import { writeMachineBalance } from "../../../../services/service";

export class ShowVendingWalletCoinBalanceFunc {

    private machineId:string;


    private ownerUuid: string;
    private coinListId: string;
    private coinCode: string;
    private coinName: string;
    private name: string;

    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`client show vending wallet coin balance`, 1);

                this.InitParams(params);

                console.log(`client show vending wallet coin balance`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`client show vending wallet coin balance`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`client show vending wallet coin balance`, 4);

                console.log(`client show vending wallet coin balance`, 5);

                const FindVendingWalletLAABWallet = await this.FindVendingWalletLAABWallet();
                if (FindVendingWalletLAABWallet != IENMessage.success) throw new Error(FindVendingWalletLAABWallet);

                console.log(`client show vending wallet coin balance`, 6);

                const ShowMyCoinWalletBalance = await this.ShowMyCoinWalletBalance();
                if (ShowMyCoinWalletBalance != IENMessage.success) throw new Error(ShowMyCoinWalletBalance);

                console.log(`client show vending wallet coin balance`, 7);

                console.log(`client show vending wallet coin balance`, 8);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.machineId = params.machineId;
    }

    private ValidateParams(): string {
        if (!(this.machineId)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { machineClientId: this.machineId, walletType: IVendingWalletType.vendingWallet } });
                if (run == null) return resolve(IENMessage.notFoundYourVendingWallet);
                this.ownerUuid = run.ownerUuid;
                this.suuid = translateUToSU(run.uuid);
                this.coinListId = run.coinListId;
                this.coinCode = run.coinCode;
                this.coinName = run.coinName;
                this.passkeys = run.passkeys;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
    
    private FindVendingWalletLAABWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                // const suuid = translateUToSU(this.uuid);

                const params = {
                    sender: this.suuid,

                    // access by passkey
                    phonenumber: this.suuid,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_FindMyWallet, params);
                if (run.data.status != 1) return resolve(run.data.message);
                this.name = this.coinListId + '_' + run.data.info.name + '__' + this.coinCode;
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private ShowMyCoinWalletBalance(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: this.name,

                    // access by passkey
                    phonenumber: this.suuid,
                    passkeys: this.passkeys
                }

                const run = await axios.post(LAAB_ShowMyCoinWalletBalance, params);
                if (run.data.status != 1) return resolve(IENMessage.notFoundYourMerchantCoin);

                writeMachineBalance(this.machineId, run.data.info.balance);

                this.response = {
                    balance: run.data.info.balance,
                    uuid: this.suuid,
                    name: this.name,
                    coinName: this.coinName,
                    message: IENMessage.success
                };

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

}