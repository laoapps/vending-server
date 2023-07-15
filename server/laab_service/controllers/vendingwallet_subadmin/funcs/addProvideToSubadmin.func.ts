import { Op, Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, epinshortcodeEntity, machineClientIDEntity, subadminEntity, vendingWallet } from "../../../../entities";

export class AddProvideToSubadmin {

    private transaction: Transaction;
    private id: string;
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

                const FindMachineAndEmei = await this.FindMachineAndEmei();
                if (FindMachineAndEmei != IENMessage.success) throw new Error(FindMachineAndEmei);

                console.log(`create epin`, 4);

                const FindDuplicate = await this.FindDuplicate();
                if (FindDuplicate != IENMessage.success) throw new Error(FindDuplicate);

                console.log(`create epin`, 5);

                console.log(`create epin`, 6);

                const AddNewProvide = await this.AddNewProvide();
                if (AddNewProvide != IENMessage.success) throw new Error(AddNewProvide);

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
                        ownerUuid: this.ownerUuid,
                        id: this.id
                    }
                }

                const run = await subadminEntity.findOne(condition);
                if (run == null) return resolve(IENMessage.invalidData);

                if (run.ownerUuid != this.ownerUuid || run.phonenumber != this.phonenumber) return resolve(IENMessage.dataUnmatch);
                this.connection = run;
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindMachineAndEmei(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const condition: any = {
                    where: {
                        ownerUuid: this.ownerUuid,
                        machineId: this.machineId,
                    }
                }

                const run = await machineClientIDEntity.findOne(condition);
                if (run == null) return resolve(IENMessage.notFoundMachine);

                const find = run.data.filter(item => item.imei == this.imei);
                if (find == undefined) return resolve(IENMessage.incorrectImei);
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindDuplicate(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const duplicate = this.connection.provides.filter(item => item.machineId == this.machineId && item.imei == this.imei);
                if (duplicate != undefined && Object.entries(duplicate).length > 0) return resolve(IENMessage.thisSubAdminHasAlreadyProvidedThisMachine);

                const condition: any = {
                    where: {
                        ownerUuid: this.ownerUuid,
                        phonenumber: {[Op.ne]: this.phonenumber},
                        provides: {
                           machineId: this.machineId,
                           imei: this.imei
                        }
                    }
                }

                const run = await subadminEntity.findOne(condition);
                if (run != null) return resolve(IENMessage.otherSubadminHasAlreadyProvidedThisMachine);
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private AddNewProvide(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                let previousList: Array<{ machineId: string, imei: string }> = this.connection.provides;
                previousList.unshift({ machineId: this.machineId, imei: this.imei });
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