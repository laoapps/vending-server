import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { LaabApiService } from "src/app/services/laab-api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class TextHashVerifyProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIServgice: VendingAPIService;
    
    private ownerUuid: string;
    private sender: string;
    private hashM: string;
    private info: string;

    private result: any = {} as any;

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
                
                console.log(`merchant coin transfer`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`merchant coin transfer`, 2);

                this.InitParams(params);

                console.log(`merchant coin transfer`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`merchant coin transfer`, 4);

                const Verify = await this.Verify();
                if (Verify != IENMessage.success) throw new Error(Verify);

                console.log(`merchant coin transfer`, 5);

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
        this.hashM = params.hashM;
        this.info = params.info;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.sender && this.hashM && this.info)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private Verify(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    ownerUuid: this.ownerUuid,
                    sender: this.sender,
                    hashM: this.hashM,
                    info: this.info
                }

                this.vendingAPIServgice.textHashVerify(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.result = response.info.result;
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
                result: this.result
            }],
            message: IENMessage.success
        }

        return response;
    }
}