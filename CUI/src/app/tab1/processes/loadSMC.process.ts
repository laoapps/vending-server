import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class LoadSMCProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private machineId: string;
    private page: number;
    private limit: number;

    private rows: Array<any> = [];
    private count: number = 0;

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

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`load smc`, 2);

                this.InitParams(params);

                console.log(`load smc`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`load smc`, 4);
                
                const LoadSMC = await this.LoadSMC();
                if (LoadSMC != IENMessage.success) throw new Error(LoadSMC);

                console.log(`load smc`, 5);

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
        this.page = params.page;
        this.limit = params.limit;
    }

    private ValidateParams(): string {
        if (!(this.machineId && this.page && this.limit)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private LoadSMC(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    machineId: this.machineId,
                    page: this.page,
                    limit: this.limit
                }
                
                this.vendingAPIService.loadSMC(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
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
        }

        return response;
    }
}