import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import * as cryptojs from 'crypto-js';

export class LoadVendingWalletCoinBalanceProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private vendingWalletCoinBalance: number;

    constructor(
        apiService: ApiService,
        vendingAPIService: VendingAPIService
    ) {
        this.apiService = apiService;
        this.vendingAPIService = vendingAPIService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                


                console.log(`show vending wallet coin balance`, 1);

                // this.workload = this.apiService.load.create({ message: 'loading...' });
                // (await this.workload).present();

                console.log(`show vending wallet coin balance`, 2);

                this.InitParams(params);

                console.log(`show vending wallet coin balance`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`show vending wallet coin balance`, 4);
                
                const LoadVendingWalletCoinBalance = await this.LoadVendingWalletCoinBalance();
                if (LoadVendingWalletCoinBalance != IENMessage.success) throw new Error(LoadVendingWalletCoinBalance);

                console.log(`show vending wallet coin balance`, 5);

                // (await this.workload).dismiss();
                resolve(this.Commit());

                // console.log(`validate merchant account`, 6);

            } catch (error) {

                // (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }


    private InitParams(params: any): void {
    }

    private ValidateParams(): string {
        return IENMessage.success;
    }

    private LoadVendingWalletCoinBalance(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                console.log(this.apiService.machineId.machineId, this.apiService.machineId.otp);
                const params = {
                    token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex)
                }

                this.vendingAPIService.showVendingWalletCoinBalance(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.vendingWalletCoinBalance = response.info.balance;
                    this.apiService.coinName = response.info.coinName;
                    this.apiService.name = response.info.name;
                    this.apiService.laabuuid = response.info.uuid;
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private Commit(): any {
        const response = {
            data: [{
                vendingWalletCoinBalance: this.vendingWalletCoinBalance
            }],
            message: IENMessage.success
        }

        return response;
    }
}