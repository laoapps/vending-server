import { Op, Transaction } from "sequelize";
import axios from "axios";
import { EPIN_Generate, IENMessage, LAAB_CoinTransfer, LAAB_CreateCouponCoinWalletSMC, LAAB_FindMyCoinWallet, LAAB_FindMyWallet, LAAB_GenerateVendingOTP, LAAB_Register2, LAAB_ShowMyCoinWalletBalance, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, epinshortcodeEntity, vendingWallet } from "../../../../entities";

export class FindEPINShortCodeFunc {

    private machineId:string;
    private phonenumber: string;
    private time: string;
    private page: number;
    private limit: number;

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
        this.machineId = params.machineId;
        this.phonenumber = params.phonenumber;
        // this.time = params.time;
        this.page = params.page;
        this.limit = params.limit;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.phonenumber && this.page && this.limit)) return IENMessage.parametersEmpty;
        this.offset = Number(this.page - 1) * Number(this.limit);
        return IENMessage.success;
    }

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { machineClientId: this.machineId, walletType: IVendingWalletType.vendingWallet } });
                if (run == null) return resolve(IENMessage.notFoundYourVendingWallet);
                this.sender = translateUToSU(run.uuid);
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindEPINShortCode(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                // let condition: any = {} as any;
                // if (this.time)
                // {
                //     condition = {
                //         where: {
                //             phonenumber: this.phonenumber,
                //             createdAt: {[Op.like]: `%${this.time}%`+''},
                //         },
                //         limit: this.limit,
                //         offset: this.offset,
                //         order: [[ 'id', 'DESC' ]]
                //     }
                // }
                // else 
                // {
                //     condition = {
                //         where: {
                //             phonenumber: this.phonenumber
                //         },
                //         limit: this.limit,
                //         offset: this.offset,
                //         order: [[ 'id', 'DESC' ]]
                //     }
                // }
               
                const run = await epinshortcodeEntity.findAndCountAll({ where: { phonenumber: this.phonenumber }, limit: this.limit, offset: this.offset, order: [[ 'id', 'DESC' ]] });
                console.log(`response query`, run.rows);
                if (run == null) return resolve(IENMessage.notFoundEPINShortCode);
               
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