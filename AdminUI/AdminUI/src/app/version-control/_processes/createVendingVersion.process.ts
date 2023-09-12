import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { ControlVendingVersionAPIService } from "src/app/services/control-vending-version-api.service";
import { FilemanagerApiService } from "src/app/services/filemanager-api.service";
import * as uuid from "uuid";

export class CreateVendingVersionProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private controlVendingVersionAPIService: ControlVendingVersionAPIService;
    private filemanagerAPIService: FilemanagerApiService;

    private file: File;
    private version: string;
    private description: string;

    private url: string;
    private formData: FormData;
    private token: string;
    private id: number;

    constructor(
        apiService: ApiService,
        controlVendingVersionAPIService: ControlVendingVersionAPIService,
        filemanagerAPIService: FilemanagerApiService
    ) {
        this.apiService = apiService;
        this.controlVendingVersionAPIService = controlVendingVersionAPIService;
        this.filemanagerAPIService = filemanagerAPIService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);
                
                const UpdateFile = await this.UpdateFile();
                if (UpdateFile != IENMessage.success) throw new Error(UpdateFile);

                const CreateVendingVersion = await this.CreateVendingVersion();
                if (CreateVendingVersion != IENMessage.success) throw new Error(CreateVendingVersion);

                (await this.workload).dismiss();
                resolve(this.Commit());

            } catch (error) {
                (await this.workload).dismiss();
                resolve(error.message);   
            }
        });
    }

    private InitParams(params: any): void {
        this.formData = new FormData();
        this.formData?.delete('docs');
        this.formData?.delete('uuid');

        this.file = params.file;
        this.version = params.version;
        this.description = params.description;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.file && this.version && this.token)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }


    private UpdateFile(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                this.url = uuid.v4();
                this.formData.set('docs', this.file, this.file.name);
                this.formData.set('uuid', this.url);
                
                this.filemanagerAPIService.writeFile(this.formData).subscribe(r_writeFile => {
                    if (r_writeFile.status != 1) {
                      this.filemanagerAPIService.cancelWriteFile({ uuid: this.url }).subscribe(r_cancelWriteFile => {
                        if (r_cancelWriteFile.status != 1) return resolve(resolve(IENMessage.cancelAndWriteFileFail));
                        return resolve(IENMessage.writeFileFailAndCancelwriteFileSuccess);
                      }, error => resolve(IENMessage.writeFileError));
                    }
                    resolve(IENMessage.success);
                  }, error => resolve(IENMessage.writeFileError));

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateVendingVersion(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                const params = {
                    url: this.url,
                    version: this.version,
                    description: this.description,
                    token: this.token
                }

                this.controlVendingVersionAPIService.createVendingVersion(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1 && response.message != IENMessage.notFoundAnyDataList) return resolve(response.message);
                    this.id = response.info.id;
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
                id: this.id
            }],
            message: IENMessage.success
        }

        return response;
    }
}
