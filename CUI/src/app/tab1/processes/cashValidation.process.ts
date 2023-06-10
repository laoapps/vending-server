import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class CashValidationProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private machineId: string;

    private acceptcash: number;

    constructor(
        apiService: ApiService,
        vendingAPIService: VendingAPIService
    ) {
        this.apiService = apiService;
        this.vendingAPIService = vendingAPIService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                


                console.log(`cash validation`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`cash validation`, 2);

                this.InitParams(params);

                console.log(`cash validation`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`cash validation`, 4);
                
                const CashValidation = await this.CashValidation();
                if (CashValidation != IENMessage.success) throw new Error(CashValidation);

                console.log(`cash validation`, 5);

                (await this.workload).dismiss();
                resolve(this.Commit());

                // console.log(`validate merchant account`, 6);

            } catch (error) {

                (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }


    private InitParams(params: any): void {
        this.machineId = params.machineId;
    }

    private ValidateParams(): string {
        if (!(this.machineId)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private CashValidation(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    machineId: this.machineId
                }

                this.vendingAPIService.cashValidation(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.acceptcash = response.info.acceptcash;
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
                acceptcash: this.acceptcash
            }],
            message: IENMessage.success
        }

        return response;
    }
}