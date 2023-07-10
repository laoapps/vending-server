import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import * as cryptojs from 'crypto-js';

export class CreateSMCProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private cash: number;
    private phonenumber: string;
    private description: string;

    private detail: any = {} as any;
    private bill: any = {} as any;

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
                


                console.log(`create smc`, 1);

                // this.workload = this.apiService.load.create({ message: 'loading...' });
                // (await this.workload).present();

                console.log(`create smc`, 2);

                this.InitParams(params);

                console.log(`create smc`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`create smc`, 4);
                
                const CashValidation = await this.CashValidation();
                if (CashValidation != IENMessage.success) throw new Error(CashValidation);

                console.log(`create smc`, 5);

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
        this.cash = params.cash;
        this.phonenumber = params.cash;
        this.description = 'VENDING CASH OUT TO SMART CONTRACT';
    }

    private ValidateParams(): string {
        if (!(this.cash && this.phonenumber)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private CashValidation(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    cash: this.cash,
                    phonenumber: this.phonenumber,
                    description: this.description,
                    token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex)
                }
                
                this.vendingAPIService.createSMC(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response create smc`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.detail = response.info.detail;
                    this.bill = response.info.bill;
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
                detail: this.detail,
                bill: this.bill
            }],
            message: IENMessage.success
        }

        return response;
    }
}