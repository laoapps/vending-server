import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import * as cryptojs from 'crypto-js';

export class MMoneyCashOutValidationProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private phonenumber: string;
    private cash: number;
    private result: any = {} as any;y

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
                


                console.log(`cash validation`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`cash validation`, 2);

                this.InitParams(params);

                console.log(`cash validation`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`cash validation`, 4);
                
                const CashValidation = await this.CashValidation();
                if (CashValidation != IENMessage.success) throw new Error(CashValidation);

                console.log(`cash validation`, 5);

                (await this.workload).dismiss();
                resolve(this.Commit());

                // console.log(`validate merchant account`, 6);

            } catch (error) {

                (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }


    private InitParams(params: any): void {
        this.phonenumber = params.phonenumber;
        this.cash = params.cash;
    }

    private ValidateParams(): string {
        if (!(this.phonenumber && this.cash)) return IENMessage.parametersEmpty;
        if (this.phonenumber.length < 10 || this.phonenumber.length > 10) return IENMessage.invalidPhonenumber;

        return IENMessage.success;
    }

    private CashValidation(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    data: {
                        phonenumber: this.phonenumber,
                        cashInValue: this.cash,
                    },
                    token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex)
                }

                this.vendingAPIService.mmoneyCashValidation(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response mmoney cash out der`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.result = response.info;
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
                result: this.result
            }],
            message: IENMessage.success
        }

        return response;
    }
}