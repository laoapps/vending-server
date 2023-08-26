import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, IForwordKeys, LAAB_CoinTransfer, LAAB_FORWARD_ShowWalletLAABCoinBalance, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { vendingWallet } from "../../../../entities";
import { readMachineBalance, redisClient, writeMachineBalance, writeMerchantLimiterBalance } from "../../../../services/service";
import { CashVendingWalletValidationFunc } from "./cashVendingWalletValidation.func";

export class CashinValidationFunc {

    private machineId:string;
    private cash: number;
    private description: string;

    private sender: string;
    private receiver: string;
    private ownerUuid: string;
    private coinListId: string;
    private coinCode: string;
    private name: string;
    private balance: number;

    private uuid: string;
    private suuid: string;
    private passkeys: string;
    private response: any = {} as any;

    private transferFail: boolean = false;
    private responseTransferFail: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`cash in validation`, 1);

                this.InitParams(params);

                console.log(`cash in validation`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`cash in validation`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`cash in validation`, 4);

                const FindVendingLimiter = await this.FindVendingLimiter();
                if (FindVendingLimiter != IENMessage.success) throw new Error(FindVendingLimiter);

                console.log(`cash in validation`, 5);

                const FindVendingLimiterLAABWallet = await this.FindVendingLimiterLAABWallet();
                if (FindVendingLimiterLAABWallet != IENMessage.success) throw new Error(FindVendingLimiterLAABWallet);

                console.log(`cash in validation`, 6);

                const ShowMyCoinWalletBalance = await this.ShowMyCoinWalletBalance();
                if (ShowMyCoinWalletBalance != IENMessage.success) throw new Error(ShowMyCoinWalletBalance);

                console.log(`cash in validation`, 7);

                const TransferCoin = await this.TransferCoin();
                if (TransferCoin != IENMessage.success) throw new Error(TransferCoin);

                console.log(`cash in validation`, 8);

                resolve(this.response);
                
            } catch (error) {

                if (this.transferFail == true)
                {
                    resolve(this.responseTransferFail);
                }
                else 
                {
                    resolve(error.message);
                }
            }
        });
    }

    private InitParams(params: any) {
        console.log(`params`, params);
        this.machineId = params.machineId;
        this.cash = params.cash;
        this.description = params.description;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.cash && this.description)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { machineClientId: this.machineId, walletType: IVendingWalletType.vendingWallet } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.ownerUuid = run.ownerUuid;
                this.receiver = translateUToSU(run.uuid);
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
                this.sender = translateUToSU(run.uuid);
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

                // const params = {
                //     sender: this.name,

                //     // access by passkey
                //     phonenumber: this.suuid,
                //     passkeys: this.passkeys
                // }
                const params = {
                    sender: this.name,

                    // access by passkey
                    forwardname: IForwordKeys.name,
                    forwardkey: IForwordKeys.value
                }


                // const run = await axios.post(LAAB_ShowMyCoinWalletBalance, params);
                const run = await axios.post(LAAB_FORWARD_ShowWalletLAABCoinBalance, params);
                if (run.data.status != 1) return resolve(IENMessage.notFoundYourMerchantCoin);

                this.balance = Number(run.data.info.balance);

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private TransferCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    coin_list_id: this.coinListId,
                    coin_code: this.coinCode,
                    sender: this.sender,
                    receiver: this.receiver,
                    amount: this.cash,
                    description: this.description,
                    limitBlock: 10,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }
                const run = await axios.post(LAAB_CoinTransfer, params);
                console.log(`response`, run.data);
                if (run.data.status != 1) {
                    this.transferFail = true;
                    this.responseTransferFail = {
                        transferFail: this.transferFail,
                        message: run.data.message
                    }
                    return resolve(run.data.message);
                }

                const h ={
                    hash:run.data.info.hash,
                    info:run.data.info.info
                } 
                const bill = {
                    sender: run.data.info.sender,
                    receiver: run.data.info.receiver,
                    coinname: run.data.info.coinName,
                    amount: run.data.info.amount,
                    datetime: run.data.info.datetime,
                    description: this.description,
                    qr: JSON.stringify(h)
                }

                const lastBalance: number = Number(this.balance) - Number(this.cash);

                const vendingBalance = await readMachineBalance(this.machineId);
                if (vendingBalance != undefined && vendingBalance != null) {
                    const balance = Number(vendingBalance) + this.cash;
                    writeMachineBalance(this.machineId, String(balance));
                } else {
                    const run = await new CashVendingWalletValidationFunc().Init({ machineId: this.machineId });
                    if (run.message != IENMessage.success) return resolve(run);
                    writeMachineBalance(this.machineId, String(run.balance));
                }
                
                writeMerchantLimiterBalance(this.ownerUuid, lastBalance.toString());


                this.response = {
                    bill: bill,
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}