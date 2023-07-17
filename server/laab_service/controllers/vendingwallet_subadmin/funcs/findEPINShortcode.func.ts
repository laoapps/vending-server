import { Op, Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, epinshortcodeEntity, subadminEntity, vendingWallet } from "../../../../entities";

export class FindEPINShortCodeFunc {

    private ownerUuid: string; // sub admin token uuid
    private phonenumber: string;
    private page: number;
    private limit: number;

    private adminOwnerUuid: string;
    private offset: number;
    private sender: string;
    private response: any = {} as any;

    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(`find epin short code`, 1);

                this.InitParams(params);

                console.log(`find epin short code`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const FindSubadmin = await this.FindSubadmin();
                if (FindSubadmin != IENMessage.success) throw new Error(FindSubadmin);

                console.log(`find epin short code`, 3);

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`find epin short code`, 4);

                const FindEPINShortCode = await this.FindEPINShortCode();
                if (FindEPINShortCode != IENMessage.success) throw new Error(FindEPINShortCode);

                console.log(`find epin short code`, 5);

                resolve(this.response);

            } catch (error) {

                resolve(error.message);
            }
        });
    }

    private InitParams(params: any) {
        this.ownerUuid = params.ownerUuid;
        this.phonenumber = params.phonenumber; // search keyword
        this.page = params.page;
        this.limit = params.limit;

    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.phonenumber && this.page && this.limit)) return IENMessage.parametersEmpty;
        this.offset = Number(this.page - 1) * Number(this.limit);
        return IENMessage.success;
    }

    private FindSubadmin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const condition: any = {
                    where: {
                        isActive: true,
                        phonenumber: this.ownerUuid
                    }
                }
                const run = await subadminEntity.findOne(condition);
                if (run == null) return resolve(IENMessage.notFoundSubadmin);
                this.adminOwnerUuid = run.ownerUuid;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.adminOwnerUuid, walletType: IVendingWalletType.vendingWallet } });
                if (run == null) return resolve(IENMessage.notFoundYourVendingWallet);
                
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindEPINShortCode(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const condition: any = {
                    where: {
                        ownerUuid: this.adminOwnerUuid,
                        phonenumber: this.ownerUuid,
                        counter: {
                            cash: {
                                hash: '',
                                info: ''
                            }
                        }
                    },
                    limit: this.limit,
                    offset: this.offset,
                    order: [[ 'id', 'DESC' ]]
                }
                const run = await epinshortcodeEntity.findAndCountAll(condition);
               
                this.response = {
                    rows: run.rows,
                    count: run.count,
                    page: this.page,
                    limit: this.limit,
                    message: IENMessage.success
                }
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    

}