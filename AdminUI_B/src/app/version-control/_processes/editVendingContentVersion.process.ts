import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { ControlVendingVersionAPIService } from "src/app/services/control-vending-version-api.service";
import { FilemanagerApiService } from "src/app/services/filemanager-api.service";
import * as uuid from "uuid";

export class EditVendingContentVersionProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private controlVendingVersionAPIService: ControlVendingVersionAPIService;

    private id: number;
    private title: string;
    private subtitle: string;
    private readme: Array<{
        section: Array<string>,
        description: Array<string>,
        hightlight: Array<string>
    }> = [];
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

                const EditVendingContentVersion = await this.EditVendingContentVersion();
                if (EditVendingContentVersion != IENMessage.success) throw new Error(EditVendingContentVersion);

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
        this.title = params.dataPack.title;
        this.subtitle = params.dataPack.subtitle;
        this.readme = params.readme;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.id && this.title && this.subtitle && this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private EditVendingContentVersion(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    id: this.id,
                    title: this.title,
                    subtitle: this.subtitle,
                    readme: this.readme,
                    token: this.token
                }

                this.controlVendingVersionAPIService.editVendingContentVersion(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
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
            data: [{}],
            message: IENMessage.success
        }

        return response;
    }
}
