import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import * as cryptojs from 'crypto-js';

export class LoadSMCProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;

    private page: number;
    private limit: number;

    private rows: Array<any> = [];
    private count = 0;

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



                console.log(`load smc`, 1);

                // this.workload = this.apiService.load.create({ message: 'loading...' });
                // (await this.workload).present();

                console.log(`load smc`, 2);

                this.InitParams(params);

                console.log(`load smc`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) {throw new Error(ValidateParams);}

                console.log(`load smc`, 4);

                const LoadSMC = await this.LoadSMC();
                if (LoadSMC != IENMessage.success) {throw new Error(LoadSMC);}

                console.log(`load smc`, 5);

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
        this.page = params.page;
        this.limit = params.limit;
    }

    private ValidateParams(): string {
        if (!(this.page && this.limit)) {return IENMessage.parametersEmpty;}
        return IENMessage.success;
    }

    private LoadSMC(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    page: this.page,
                    limit: this.limit,
                    token: cryptojs.SHA256(this.apiService.machineId.machineId + this.apiService.machineId.otp).toString(cryptojs.enc.Hex)
                };

                this.vendingAPIService.loadSMC(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) {return resolve(response.message);}
                    this.rows = response.info.rows;
                    this.count = response.info.count;
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
                rows: this.rows,
                count: this.count,
                page: this.page,
                limit: this.limit
            }],
            message: IENMessage.success
        };

        return response;
    }
}
