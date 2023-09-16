import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { ControlVendingVersionAPIService } from "src/app/services/control-vending-version-api.service";
import { FilemanagerApiService } from "src/app/services/filemanager-api.service";
import * as uuid from "uuid";

export class SetUpdateVendingVersionProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private controlVendingVersionAPIService: ControlVendingVersionAPIService;

    private uuid: string;
    private machines: Array<string> = [];

    private token: string;

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
                
                const SetUpdateVersion = await this.SetUpdateVersion();
                if (SetUpdateVersion != IENMessage.success) throw new Error(SetUpdateVersion);

                (await this.workload).dismiss();
                resolve(this.Commit());

            } catch (error) {
                (await this.workload).dismiss();
                resolve(error.message);   
            }
        });
    }

    private InitParams(params: any): void {
        this.uuid = params.uuid;
        this.machines = params.machines;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.uuid && this.token)) return IENMessage.parametersEmpty;
        if (this.machines != undefined && Object.entries(this.machines).length == 0) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }


    private SetUpdateVersion(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    uuid: this.uuid,
                    machines: this.machines,
                    token: this.token
                }
                
                this.controlVendingVersionAPIService.setUpdateVersion(params).subscribe(run => {
                    const response: any = run;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(IENMessage.writeFileFail);
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
