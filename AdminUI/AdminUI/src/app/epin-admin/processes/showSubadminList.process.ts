import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { LaabApiService } from "src/app/services/laab-api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class ShowSubadminListProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIServgice: VendingAPIService;

    private counter: boolean;
    private page: number;
    private limit: number;

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
                
                console.log(`show epin short code list`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`show epin short code list`, 2);

                this.InitParams(params);

                console.log(`show epin short code list`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`show epin short code list`, 4);

                const ShowReport = await this.ShowReport();
                if (ShowReport != IENMessage.success) throw new Error(ShowReport);

                console.log(`show epin short code list`, 5);

                (await this.workload).dismiss();
                resolve(this.Commit());

            } catch (error) {

                (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }

    private InitParams(params: any): void {
        this.counter = params.counter;
        this.page = params.page;
        this.limit = params.limit;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.page && this.limit && this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private ShowReport(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    counter: this.counter,
                    page: this.page,
                    limit: this.limit,
                    token: this.token
                }

                this.vendingAPIServgice.showEPINShortCodeList(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response show epin short code`, response);
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