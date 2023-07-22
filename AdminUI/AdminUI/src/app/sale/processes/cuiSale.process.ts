import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { LaabApiService } from "src/app/services/laab-api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import cryptojs from "cryptojs";

export class CUISaleProcess {

    private workload: any = {} as any;

    private apiService: ApiService;

    private machineId: string;

    private lists: Array<any> = [];


    constructor(
        apiService: ApiService
    ) {
        this.apiService = apiService
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                console.log(`show cui sale list`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`show cui sale list`, 2);

                this.InitParams(params);

                console.log(`show cui sale list`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`show cui sale list`, 4);

                const ShowReport = await this.ShowReport();
                if (ShowReport != IENMessage.success) throw new Error(ShowReport);

                console.log(`show cui sale list`, 5);

                (await this.workload).dismiss();
                resolve(this.Commit());

            } catch (error) {

                (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }

    private InitParams(params: any): void {
        this.machineId = params.machineId;
    }

    private ValidateParams(): string {
        if (!(this.machineId)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private ShowReport(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    machineId: this.machineId
                }

                this.apiService.readMachineSale(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response cui sale`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.lists = response;
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
                lists: this.lists
            }],
            message: IENMessage.success
        }

        return response;
    }
}