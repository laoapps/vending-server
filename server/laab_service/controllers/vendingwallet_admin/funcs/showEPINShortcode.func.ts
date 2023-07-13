import { Op, Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, epinshortcodeEntity, vendingWallet } from "../../../../entities";

export class ShowEPINShortCodeFunc {

    private ownerUuid: string;
    private page: number;
    private limit: number;
    private counter: boolean;

    private offset: number;
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

                console.log(`find epin short code`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

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
        this.page = params.page;
        this.limit = params.limit;
        this.counter = params.counter ? params.counter : false;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.page && this.limit)) return IENMessage.parametersEmpty;
        
        this.offset = Number(this.page - 1) * Number(this.limit);
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: IVendingWalletType.merchant } });
                if (run == null) return resolve(IENMessage.notFoundYourMerchant);
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindEPINShortCode(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                let condition: any = {} as any;
                if (this.counter == true)
                {
                    condition = {
                        where: {
                            ownerUuid: this.ownerUuid,
                            counter: {
                                hash: {[Op.ne]: ''},
                                info: {[Op.ne]: ''}
                            }
                        },
                        limit: this.limit,
                        offset: this.offset,
                        order: [[ 'id', 'DESC' ]]
                    }
                }
                else 
                {
                    condition = {
                        where: {
                            ownerUuid: this.ownerUuid,
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
                }
                const run = await epinshortcodeEntity.findAndCountAll(condition);
                console.log(`admin show epin short code`, run.count, run.rows);
               
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