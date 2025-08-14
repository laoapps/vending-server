import { Op, Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, epinshortcodeEntity, subadminEntity, vendingWallet } from "../../../../entities";

export class RemoveProvideFromSubadminFunc {

    private transaction: Transaction;
    private id: number;
    private ownerUuid: string;
    private phonenumber: string;
    private machineId: string;
    private imei: string;

    private coinListId: string;
    private coinCode: string;

    private sender: string;
    private connection: any = {} as any;
    private coinName: string;
    private passkeys: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            this.transaction = await dbConnection.transaction();
            try {

                console.log(`create epin`, 1);

                this.InitParams(params);

                console.log(`create epin`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create epin`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                const FindData = await this.FindData();
                if (FindData != IENMessage.success) throw new Error(FindData);

                console.log(`create epin`, 4);

                console.log(`create epin`, 5);

                console.log(`create epin`, 6);

                const RemoveProvide = await this.RemoveProvide();
                if (RemoveProvide != IENMessage.success) throw new Error(RemoveProvide);

                console.log(`create epin`, 7);

                console.log(`create epin`, 8);

                await this.transaction.commit();
                resolve(this.response);

            } catch (error) {

                await this.transaction.rollback();
                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.id = params.id;
        this.ownerUuid = params.ownerUuid;
        this.phonenumber = params.phonenumber;
        this.machineId = params.machineId;
        this.imei = params.imei;
    }

    private ValidateParams(): string {
        if (!(this.id && this.ownerUuid && this.phonenumber && this.machineId && this.imei)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: IVendingWalletType.merchant } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                this.sender = translateUToSU(run.uuid);
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

    private FindData(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const condition: any = {
                    where: {
                        id: this.id
                    }
                }

                const run = await subadminEntity.findOne(condition);
                if (run == null) return resolve(IENMessage.invalidData);

                if (run.ownerUuid != this.ownerUuid || run.data.phonenumber != this.phonenumber) return resolve(IENMessage.dataUnmatch);
                this.connection = run;

                const find = this.connection.provides.filter(item => item.machineId == this.machineId && item.imei == this.imei);
                if (find != undefined && Object.entries(find).length == 0) return resolve(IENMessage.notFoundMachineForRemove);
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private RemoveProvide(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                let previousList: Array<{ machineId: string, imei: string }> = JSON.parse(JSON.stringify(this.connection.provides));
                previousList = previousList.filter(item => item.machineId != this.machineId && item.imei != this.imei);
                this.connection.provides = previousList;

                const run = await this.connection.save({ transaction: this.transaction });
                if (!run) return resolve(IENMessage.commitFail);

                this.response = {
                    message: IENMessage.success
                }

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }


}