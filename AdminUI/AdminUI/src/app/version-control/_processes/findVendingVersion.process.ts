import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { ControlVendingVersionAPIService } from "src/app/services/control-vending-version-api.service";

export class FindVendingVersionProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private controlVendingVersionAPIService: ControlVendingVersionAPIService;

    private isActive: boolean;
    private page: number;
    private limit: number;
    private search: string;

    private rows: Array<any> = [];
    private count: number;
    private token: string;

    constructor(
        apiService: ApiService,
        controlVendingVersionAPIService: ControlVendingVersionAPIService,
    ) {
        this.apiService = apiService;
        this.controlVendingVersionAPIService = controlVendingVersionAPIService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);
                
                const ShowReport = await this.ShowReport();
                if (ShowReport != IENMessage.success) throw new Error(ShowReport);

                (await this.workload).dismiss();
                resolve(this.Commit());

            } catch (error) {
                (await this.workload).dismiss();
                resolve(error.message);   
            }
        });
    }

    private InitParams(params: any): void {
        this.search = params.search;
        this.isActive = params.isActive;
        this.page = params.page;
        this.limit = params.limit;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.search &&  this.page && this.limit && this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private ShowReport(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    search: this.search,
                    isActive: this.isActive,
                    page: this.page,
                    limit: this.limit,
                    token: this.token
                }

                this.controlVendingVersionAPIService.findVendingVersion(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response show control vending version`, response);
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
