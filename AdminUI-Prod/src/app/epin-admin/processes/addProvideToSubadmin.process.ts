import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { LaabApiService } from "src/app/services/laab-api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class AddProvideToSubadminProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIServgice: VendingAPIService;

    private id: number;
    private phonenumber: string;
    private machineId: string;
    private imei: string;

    private token: string;

    constructor(
        apiService: ApiService,
        vendingAPIServgice: VendingAPIService
    ) {
        this.apiService = apiService;
        this.vendingAPIServgice = vendingAPIServgice;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
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

                const CreateSubadmin = await this.CreateSubadmin();
                if (CreateSubadmin != IENMessage.success) throw new Error(CreateSubadmin);

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
        this.id = params.id;
        this.phonenumber = params.phonenumber;
        this.machineId = params.machineId;
        this.imei = params.imei;
        this.token = localStorage.getItem('lva_token');
    }

    private ValidateParams(): string {
        if (!(this.id && this.phonenumber && this.machineId && this.imei && this.token)) return IENMessage.parametersEmpty;

        return IENMessage.success;
    }

    private CreateSubadmin(): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                const params = {
                    id: this.id,
                    phonenumber: this.phonenumber,
                    machineId: this.machineId,
                    imei: this.imei,
                    token: this.token
                }

                this.vendingAPIServgice.addProvideToSubadmin(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response create sub admin`, response);
                    if (response.status != 1 && response.message != IENMessage.notFoundAnyDataList) return resolve(response.message);
                    this.id = response.info.commit_id;
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