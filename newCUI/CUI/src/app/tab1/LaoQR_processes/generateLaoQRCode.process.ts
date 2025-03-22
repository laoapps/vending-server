import { IENMessage } from "src/app/models/base.model";
import { IGenerateLAOQRCode } from "src/app/models/laoqr.model";
import { ApiService } from "src/app/services/api.service";
import { IVendingMachineBill } from "src/app/services/syste.model";

export class GenerateLaoQRCodeProcess {
    private workload: any = {} as any;

    private orders: Array<any> = [];
    private amount: number;
    private machineId: string;

    // services
    private apiService: ApiService;

    // props
    private laoQRCode: IVendingMachineBill;

    constructor(
        apiService: ApiService
    ) {
        this.apiService = apiService;
    }

    public Init(params: IGenerateLAOQRCode): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            this.workload = this.apiService.load.create({ message: 'loading...' });
            (await this.workload).present();

            this.InitParams(params);

            const ValidateParams = this.ValidateParams();
            if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

            const GenerateQRCode = await this.GenerateQRCode();
            (await this.workload).dismiss();

            console.log(`zzzz LaoQR`, GenerateQRCode);
            if (GenerateQRCode != IENMessage.success) {
                // this.apiService.toast.create({ message: GenerateQRCode, duration: 3000 }).then(toast => toast.present());
                // throw new Error(GenerateQRCode);
                resolve(null);
            }

            resolve(this.Commit());

        });
    }


    private InitParams(params: IGenerateLAOQRCode): void {
        this.orders = params.orders;
        this.amount = params.amount;
        this.machineId = params.machineId;
    }

    private ValidateParams(): string {
        if (!(this.amount && this.machineId)) return IENMessage.parametersEmpty;
        if (this.orders != undefined && Object.entries(this.orders).length == 0) return IENMessage.parametersEmpty;

        const amount = this.orders.reduce((a, b) => a + b.stock.price * b.stock.qtty, 0);
        if (this.amount != amount) return IENMessage.invalidAmount;
        return IENMessage.success;
    }

    private GenerateQRCode(): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                this.apiService.buyLaoQR(this.orders, this.amount, this.machineId).subscribe(r => {
                    const response: any = r;
                    console.log(`response generate LaoQR`, response);
                    if (response.status != 1) {
                        resolve(null);
                    }
                    this.laoQRCode = response.data as IVendingMachineBill;
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
            } catch (error) {
                resolve(error.message);
            }
        });
    }


    public async CheckLaoQRPaid(): Promise<{ status: number, message: any }> {
        return new Promise<{ status: number, message: any }>(async (resolve, reject) => {
            try {
                this.apiService.checkPaidBill().subscribe(r => {

                    const response: any = r;
                    console.log('response check LaoQR', response);

                    if (response.status != 1) return resolve({ status: 0, message: IENMessage.findLaoQRPaidFail });
                    this.laoQRCode = response.data as IVendingMachineBill;
                    resolve({ status: 1, message: response });
                }, error => resolve({ status: 0, message: error.message }));
            } catch (error) {
                resolve({ status: 0, message: error.message });
            }
        });
    }

    private Commit(): any {

        const response = {
            data: [{
                mmoneyQRCode: this.laoQRCode
            }],
            message: IENMessage.success
        }

        return response;
    }
}