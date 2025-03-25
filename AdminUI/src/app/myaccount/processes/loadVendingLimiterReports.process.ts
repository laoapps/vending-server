import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { LaabApiService } from "src/app/services/laab-api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class LoadVendingLimiterReportsProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIServgice: VendingAPIService;
    
    private ownerUuid: string;
    private sender: string;
    private page: number;
    private limit: number;
    private statement: string;

    private rows: Array<any> = [];
    private count: number;
    private token: string;

    constructor(
        apiService: ApiService,
        vendingAPIServgice: VendingAPIService
    ) {
        this.apiService = apiService;
        this.vendingAPIServgice = vendingAPIServgice;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                console.log(`load vending limiter report`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`load vending limiter report`, 2);

                this.InitParams(params);

                console.log(`load vending limiter report`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`load vending limiter report`, 4);

                const ShowReport = await this.ShowReport();
                if (ShowReport != IENMessage.success) throw new Error(ShowReport);

                console.log(`load vending limiter report`, 5);

                (await this.workload).dismiss();
                resolve(this.Commit());

            } catch (error) {

                (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }

    private InitParams(params: any): void {
        this.ownerUuid = params.ownerUuid;
        this.sender = params.sender;
        this.page = params.page;
        this.limit = params.limit;
        this.statement = params.statement;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.sender && this.page && this.limit && this.statement)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private ShowReport(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    ownerUuid: this.ownerUuid,
                    sender: this.sender,
                    page: this.page,
                    limit: this.limit,
                    statement: this.statement,
                    token: this.token
                }

                this.vendingAPIServgice.showVendingLimiterReport(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1 && response.message != IENMessage.notFoundAnyDataList) return resolve(response.message);
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
                count: this.count
            }],
            message: IENMessage.success
        }

        return response;
    }
}