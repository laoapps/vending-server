import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as cryptojs from 'crypto-js';

export class CreateEPINProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;

    private phonenumber: string;
    private detail: any = {} as any;


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



                console.log(`create epin`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`create epin`, 2);

                this.InitParams(params);

                console.log(`create epin`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) {throw new Error(ValidateParams);}

                console.log(`create epin`, 4);

                const CashValidation = await this.CashValidation();
                if (CashValidation != IENMessage.success) {throw new Error(CashValidation);}

                console.log(`create epin`, 5);

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
        this.detail = params.detail;
    }

    private ValidateParams(): string {
        if (!(this.phonenumber && this.detail)) {return IENMessage.parametersEmpty;}
        return IENMessage.success;
    }

    private CashValidation(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    phonenumber: this.phonenumber,
                    detail: this.detail,
                    token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex)
                };

                this.vendingAPIService.createEPIN(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response create epin`, response);
                    if (response.status != 1) {return resolve(response.message);}
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
        };

        return response;
    }
}
