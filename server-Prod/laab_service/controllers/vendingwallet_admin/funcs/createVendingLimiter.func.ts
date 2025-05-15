import { Transaction } from "sequelize";
import axios from "axios";
import { IENMessage, LAAB_GeneratePasskeys, LAAB_Register2, jwtEncode, translateUToSU } from "../../../../services/laab.service";
import { IVendingWalletType } from "../../../models/base.model";
import { dbConnection, vendingWallet } from "../../../../entities";

export class CreateVendingLimiterFunc {

    private transaction: Transaction;
    private ownerUuid:string;
    private walletType: string;
    private machineClientId:string;
    private passkeys:string;
    private username:string;
    private platform:string;

    private coinListId: string;
    private coinCode: string;
    private coinName: string;

    private vendinguuid: string;
    private suuid: string;
    private laabuuid: string;
    private response:any = {} as any;
    constructor(){}

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            this.transaction = await dbConnection.transaction();
            try {

                console.log(`create merchant`, 1);

                this.InitParams(params);

                console.log(`create merchant`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create merchant`, 3);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                const FindVendingLimiter = await this.FindVendingLimiter();
                if (FindVendingLimiter != IENMessage.success) throw new Error(FindVendingLimiter);

                console.log(`create merchant`, 4);

                const CreateVendingLimiter = await this.CreateVendingLimiter();
                if (CreateVendingLimiter != IENMessage.success) throw new Error(CreateVendingLimiter);

                console.log(`create merchant`, 5);

                const RegisterLAABVendingLimiter = await this.RegisterLAABVendingLimiter();
                if (RegisterLAABVendingLimiter != IENMessage.success) throw new Error(RegisterLAABVendingLimiter);

                console.log(`create merchant`, 6);

                const GeneratePasskeys = await this.GeneratePasskeys();
                if (GeneratePasskeys != IENMessage.success) throw new Error(GeneratePasskeys);

                console.log(`create merchant`, 7);

                const UpdateMerchant = await this.UpdateMerchant();
                if (UpdateMerchant != IENMessage.success) throw new Error(UpdateMerchant);

                console.log(`create merchant`, 8);

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
        this.walletType = IVendingWalletType.vendingLimiter;
        this.machineClientId = '';
        this.passkeys = '';
        this.username = params.username;
        this.platform = params.platform;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.username && this.platform)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: IVendingWalletType.merchant } });
                if (run == null) throw new Error(IENMessage.merchantHasNotCreatedYet);
                this.coinListId = run.coinListId;
                this.coinCode = run.coinCode;
                this.coinName = run.coinName;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingLimiter(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                let run: any = await vendingWallet.findOne({ where: { ownerUuid: this.ownerUuid, walletType: this.walletType } });
                if (run != null) throw new Error(IENMessage.vendingLimiterHasAlreadyExisted);

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateVendingLimiter(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    ownerUuid: this.ownerUuid,
                    walletType: this.walletType,
                    machineClientId: this.machineClientId,
                    passkeys: this.passkeys,
                    username: this.username,
                    platform: this.platform,
                    coinListId: this.coinListId,
                    coinCode: this.coinCode,
                    coinName: this.coinName
                }


                const run = await vendingWallet.create(params, { transaction: this.transaction });
                if (!run) throw new Error(IENMessage.commitFail);
                this.vendinguuid = run.uuid;
                this.suuid = translateUToSU(run.uuid);

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private RegisterLAABVendingLimiter(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    name: this.suuid,
                    phoneNumber: this.suuid,
                    username: this.suuid,
                    limitBlock: 10
                }

                const run = await axios.post(LAAB_Register2, params);
                if (run.data.status != 1) return resolve(run.data.message);
                this.laabuuid = run.data.info.uuid;
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private GeneratePasskeys(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                // const suuid = translateUToSU(this.uuid);

                const jwtData = {
                    uuid: this.laabuuid
                }
                const params = {
                    token: jwtEncode(jwtData)
                }

                const run = await axios.post(LAAB_GeneratePasskeys, params);
                console.log(`after gen passkeys`, run.data);
                if (run.data.status != 1) return resolve(run.data.message);
                this.passkeys = run.data.info.passkeys;

                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private UpdateMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
               
                const run = await vendingWallet.update({ passkeys: this.passkeys }, { where: { uuid: this.vendinguuid }, transaction: this.transaction });
                if (!run) return resolve(IENMessage.updatePasskeysFail);

                this.response = {
                    uuid: this.suuid,
                    message: IENMessage.success
                }
                resolve(IENMessage.success);

            } catch (error) {
                resolve(error.message);
            }
        });
    }
}