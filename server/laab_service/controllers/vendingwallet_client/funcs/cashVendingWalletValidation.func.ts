import { Transaction, json } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_CoinTransfer, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";
import { stringify } from "uuid";
import { writeMachineBalance } from "../../../../services/service";

export class CashVendingWalletValidationFunc {

    private machineId:string;

    private sender: string;
    private ownerUuid: string;
    private coinListId: string;
    private coinCode: string;
    private name: string;
    private balance: number;

    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`cash validation`, 1);

                this.InitParams(params);

                console.log(`cash validation`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`cash validation`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`cash validation`, 4);

                const FindVendingLimiter = await this.FindVendingLimiter();
                if (FindVendingLimiter != IENMessage.success) throw new Error(FindVendingLimiter);

                console.log(`cash validation`, 5);

                const FindVendingLimiterLAABWallet = await this.FindVendingLimiterLAABWallet();
                if (FindVendingLimiterLAABWallet != IENMessage.success) throw new Error(FindVendingLimiterLAABWallet);

                console.log(`cash validation`, 6);

                const ShowMyCoinWalletBalance = await this.ShowMyCoinWalletBalance();
                if (ShowMyCoinWalletBalance != IENMessage.success) throw new Error(ShowMyCoinWalletBalance);

                console.log(`cash validation`, 7);

                console.log(`cash validation`, 8);

                resolve(this.response);
                
            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        console.log(`params`, params);
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
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.ownerUuid = run.ownerUuid;
                this.sender = translateUToSU(run.uuid);
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingLimiter(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: IVendingWalletType.vendingLimiter } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.uuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);
                this.coinListId = run.coinListId;
                this.coinCode = run.coinCode;
                this.passkeys = run.passkeys;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
    
    private FindVendingLimiterLAABWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                // const suuid = translateUToSU(this.uuid);

                const params = {
                    sender: this.sender,

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
        //forward center // messenging center
    //     const callBackPartner=[{
    //         ids:[], // specefic receiver

    //         callbackurl:'', // laoapps.com:9006/zdm8/callbackfromlaab
    //         params:{},
    //         topic:'',// vending // title
    //         provider:'',//laab, waiwa, hangmi.... ** sender
    //         creator:'' // vending-service // ** receiver
    //     },
    //     {
    //         ids:[], // 

    //         callbackurl:'',
    //         params:{},
    //         topic:'',// vending
    //         provider:'',//laab, waiwa, hangmi....
    //         creator:'' // vending-service
    //     }
    // ]
    // 1.callback receiver
    // 2.register callback
    // 3. ping to check callbacks array return with checksum compare hash
    ////////interval ==> ping


    // callback sender
    // 1.send data to cbct

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
                console.log(`ShowMyCoinWalletBalance`, run.data);
                if (run.data.status != 1) return resolve(IENMessage.notFoundYourMerchantCoin);

                this.balance = Number(run.data.info.balance);
                // if (this.balance <= 100000) return resolve(IENMessage.cashValidationFail);
                console.log(`balance`, this.balance);
                // writeMachineBalance(this.machineId, String(this.balance));

                // let acceptcash: number = 0;
                // if (this.balance >= 200000) {
                //     acceptcash = 100000;
                // } else if (this.balance >= 150000 && this.balance < 200000) {
                //     acceptcash = 50000;
                // } else if (this.balance >= 120000 && this.balance < 150000) {
                //     acceptcash = 20000;
                // } else if (this.balance >= 100000 && this.balance < 120000) {
                //     acceptcash = 10000;
                // } else if (this.balance >= 105000 && this.balance < 100000) {
                //     acceptcash = 5000;
                // } else {
                //     acceptcash = 0;
                // }

                this.response = {
                    balance: this.balance,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}