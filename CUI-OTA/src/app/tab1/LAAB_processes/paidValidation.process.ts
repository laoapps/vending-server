import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import * as cryptojs from 'crypto-js';

export class PaidValidationProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private cash: number;
    private description: string;
    private paidLAAB: any = {} as any;

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
                


                console.log(`paid validation`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`paid validation`, 2);

                this.InitParams(params);

                console.log(`paid validation`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`paid validation`, 4);
                
                const PaidValidation = await this.PaidValidation();
                if (PaidValidation != IENMessage.success) throw new Error(PaidValidation);

                console.log(`paid validation`, 5);

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
        this.cash = params.cash;
        this.description = params.description;
        this.paidLAAB = params.paidLAAB;
    }

    private ValidateParams(): string {
        if (!(this.cash && this.description && this.paidLAAB)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private PaidValidation(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    cash: this.cash,
                    description: this.description,
                    paidLAAB: this.paidLAAB,
                    token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex)
                }

                this.vendingAPIService.paidValidation(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
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
            }],
            message: IENMessage.success
        }

        return response;
    }
}