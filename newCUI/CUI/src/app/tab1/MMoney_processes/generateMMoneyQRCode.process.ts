import { IENMessage } from "src/app/models/base.model";
import { IGenerateQRCode } from "src/app/models/mmoney.model";
import { ApiService } from "src/app/services/api.service";
import { IVendingMachineBill } from "src/app/services/syste.model";

export class GenerateMMoneyQRCodeProcess {

    private workload: any = {} as any;

    private orders: Array<any> = [];
    private amount: number;
    private machineId: string;

    // services
    private apiService: ApiService;

    // props
    private mmoneyQRCode: IVendingMachineBill;

    constructor(
        apiService: ApiService
    ) {
        this.apiService = apiService;
    }

    public Init(params: IGenerateQRCode): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                this.InitParams(params);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                const GenerateQRCode = await this.GenerateQRCode();
                console.log(`zzzz`, GenerateQRCode);
                // if (GenerateQRCode != IENMessage.success) throw new Error(GenerateQRCode);
                (await this.workload).dismiss();

                if (GenerateQRCode != IENMessage.success) {
                    // this.apiService.toast.create({ message: GenerateQRCode, duration: 3000 }).then(toast => toast.present());
                    // this.apiService.alert.create({ message: 'ສ້າງ QR Code ບໍ່ສຳເຫຼັດ ກະລຸນາເລືອກ Lao QR ແທນ ຫຼືລອງອີກຄັ້ງໃນພາຍຫຼັງ', buttons: ['OK'] }).then(alert => alert.present());
                    // throw new Error(GenerateQRCode);
                    resolve(null);
                }

                resolve(this.Commit());

            } catch (error) {
                (await this.workload).dismiss();
                resolve(error.message);
            }
        });
    }

    private InitParams(params: IGenerateQRCode): void {
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

                this.apiService.buyMMoney(this.orders, this.amount, this.machineId).subscribe(r => {
                    const response: any = r;
                    console.log(`response generate MMoney`, response);
                    if (response.status != 1) {
                        // return resolve(IENMessage.generateMMoneyQRCodeFail);
                        resolve(null);
                    }
                    this.mmoneyQRCode = response.data as IVendingMachineBill;
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
                mmoneyQRCode: this.mmoneyQRCode
            }],
            message: IENMessage.success
        }

        return response;
    }
}