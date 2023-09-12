import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { ControlVendingVersionAPIService } from "src/app/services/control-vending-version-api.service";

export class UpdateVendingVersionDescriptionProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private controlVendingVersionAPIService: ControlVendingVersionAPIService;

    private id: number;
    private description: string;

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
        this.id = params.id;
        this.description = params.description;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.id && this.description && this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private ShowReport(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    id: this.id,
                    description: this.description,
                    token: this.token
                }

                this.controlVendingVersionAPIService.updateVendingVersionDescription(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response show control vending version`, response);
                    if (response.status != 1 && response.message != IENMessage.notFoundAnyDataList) return resolve(response.message);
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
                // rows: this.rows,
                // count: this.count
            }],
            message: IENMessage.success
        }

        return response;
    }
}
