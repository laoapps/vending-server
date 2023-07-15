import { Transaction } from "sequelize";
import axios from "axios";
import { dbConnection, vendingWallet, subadminEntity } from "../../../../entities";
import { IVendingWalletType } from "../../../models/base.model";
import { IENMessage, translateUToSU, LAAB_FindMyCoinWallet } from "../../../../services/laab.service";


export class CreateSubAdminFunc {

    private transaction: Transaction;
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

                console.log(`create epin`, 1);

                this.InitParams(params);

                console.log(`create epin`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create epin`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`create epin`, 4);

                const FindDuplicate = await this.FindDuplicate();
                if (FindDuplicate != IENMessage.success) throw new Error(FindDuplicate);

                console.log(`create epin`, 5);

                const FindSubAdminCoinWallet = await this.FindSubAdminCoinWallet();
                if (FindSubAdminCoinWallet != IENMessage.success) throw new Error(FindSubAdminCoinWallet);

                console.log(`create epin`, 6);

                const CreateSubadmin = await this.CreateSubadmin();
                if (CreateSubadmin != IENMessage.success) throw new Error(CreateSubadmin);

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
        this.ownerUuid = params.ownerUuid;
        this.phonenumber = params.phonenumber;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.phonenumber)) return IENMessage.parametersEmpty;
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

    private FindDuplicate(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const condition: any = {
                    where: {
                        ownerUuid: this.ownerUuid,
                        phonenumber: this.phonenumber
                    }
                }

                const run = await subadminEntity.findOne(condition);
                if (run != null) return resolve(IENMessage.subadminHasAlreadyCreateByThisOwnerVending);
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindSubAdminCoinWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    sender: `+85620${this.phonenumber}`,
                    coin_list_id: this.coinListId,
                    coin_code: this.coinCode,

                    // access by passkey
                    phonenumber: this.sender,
                    passkeys: this.passkeys
                }
                console.log(`params`, params);
                const run = await axios.post(LAAB_FindMyCoinWallet, params);
                console.log(`run`, run.data);
                if (run.data.status != 1) return resolve(IENMessage.subadminHasNotLAABAccount);

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateSubadmin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    ownerUuid: this.ownerUuid,
                    phonenumber: this.phonenumber,
                    provides: []
                }

                const run = await subadminEntity.create(params, { transaction: this.transaction });
                if (!run) return resolve(IENMessage.commitFail);

                this.response = {
                    commit_id: run.id,
                    message: IENMessage.success
                }
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }


}