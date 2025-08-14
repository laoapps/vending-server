import { Transaction } from "sequelize";
import axios from "axios";
import { dbConnection, vendingWallet, subadminEntity } from "../../../../entities";
import { IVendingWalletType } from "../../../models/base.model";
import { IENMessage, translateUToSU, LAAB_FindMyCoinWallet } from "../../../../services/laab.service";


export class DeleteSubAdminFunc {

    private transaction: Transaction;
    private id: string;
    private ownerUuid: string;
    private phonenumber: string;

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

                console.log(`delete sub admin`, 1);

                this.InitParams(params);

                console.log(`delete sub admin`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`delete sub admin`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`delete sub admin`, 4);

                const FindData = await this.FindData();
                if (FindData != IENMessage.success) throw new Error(FindData);

                console.log(`delete sub admin`, 5);

                const DeleteSubadmin = await this.DeleteSubadmin();
                if (DeleteSubadmin != IENMessage.success) throw new Error(DeleteSubadmin);

                console.log(`delete sub admin`, 6);

                console.log(`delete sub admin`, 7);

                console.log(`delete sub admin`, 8);

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
    }

    private ValidateParams(): string {
        if (!(this.id && this.ownerUuid && this.phonenumber)) return IENMessage.parametersEmpty;
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
                        id: this.id,
                        ownerUuid: this.ownerUuid,
                        phonenumber: this.phonenumber
                    }
                }

                const run = await subadminEntity.findOne(condition);
                if (run == null) return resolve(IENMessage.invalidData);
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private DeleteSubadmin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const condition = {
                    where: {
                        id: this.id,
                        ownerUuid: this.ownerUuid,
                        phonenumber: this.phonenumber
                    },
                    transaction: this.transaction
                }

                const run = await subadminEntity.destroy(condition);
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