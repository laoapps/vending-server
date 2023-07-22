import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import * as cryptojs from 'crypto-js';

export class CounterCashout_CashProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private phonenumber: string;
    private destination: string;
    private coinname: string;
    private name: string;
    private token: string;

    private EPIN: string;

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
                
                const CounterCashout_cash = await this.CounterCashout_cash();
                if (CounterCashout_cash != IENMessage.success) throw new Error(CounterCashout_cash);

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
        this.destination = params.destination;
        this.coinname = params.coinname;
        this.name = params.name;
        this.token = localStorage.getItem('lva_token');

    }

    private ValidateParams(): string {
        if (!(this.phonenumber && this.destination && this.coinname && this.name && this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private CounterCashout_cash(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    phonenumber: this.phonenumber,
                    destination: this.destination,
                    coinname: this.coinname,
                    name: this.name,
                    token: this.token
                }
                
                this.vendingAPIService.counterCashout_cash(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response counter cashout cash`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.EPIN = response.info.EPIN;
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
                EPIN: this.EPIN
            }],
            message: IENMessage.success
        }

        return response;
    }
}