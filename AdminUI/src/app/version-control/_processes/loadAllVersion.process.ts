import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { ControlVendingVersionAPIService } from "src/app/services/control-vending-version-api.service";
import { FilemanagerApiService } from "src/app/services/filemanager-api.service";
import * as uuid from "uuid";

export class LoadAllVersionProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private controlVendingVersionAPIService: ControlVendingVersionAPIService;

    private token: string;
    private rows: Array<any> = [];
    private count: number;

    constructor(
        apiService: ApiService,
        controlVendingVersionAPIService: ControlVendingVersionAPIService
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
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }


    private ShowReport(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    token: this.token
                }
                this.controlVendingVersionAPIService.loadAllVersion(params).subscribe(run => {
                    const response: any = run;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(IENMessage.writeFileFail);
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
