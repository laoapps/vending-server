import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import * as cryptojs from 'crypto-js';

export class ResetCashingProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    
    private machineId: string;
    private token: string;


    constructor(
        apiService: ApiService
    ) {
        this.apiService = apiService
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                


                console.log(`refresh machine`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`refresh machine`, 2);

                this.InitParams(params);

                console.log(`refresh machine`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`refresh machine`, 4);
                
                const refreshMachine = await this.RefreshMachine();
                if (refreshMachine != IENMessage.success) throw new Error(refreshMachine);

                console.log(`refresh machine`, 5);

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
        this.machineId = params.machineId;
        this.token = localStorage.getItem('lva_token');

    }

    private ValidateParams(): string {
        if (!(this.machineId && this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private RefreshMachine(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    machineId: this.machineId,
                    token: this.token
                }
                
                this.apiService.resetCashing(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response refresh machine`, response);
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