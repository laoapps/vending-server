import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { LaabApiService } from "src/app/services/laab-api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class VendingLimiterCoinTransferProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIServgice: VendingAPIService;
    
    private ownerUuid: string;
    private sender: string;
    private amount: number;
    private receiver: string;
    private description: string;
    private coinListId: string;
    private coinCode: string;
    private limitBlock: number;

    private myBill: any = {} as any;

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
                
                console.log(`init my account`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`init my account`, 2);

                this.InitParams(params);

                console.log(`init my account`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`init my account`, 4);

                const Transfer = await this.Transfer();
                if (Transfer != IENMessage.success) throw new Error(Transfer);

                console.log(`init my account`, 5);

                (await this.workload).dismiss();
                resolve(this.Commit());

            } catch (error) {

                (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }

    private InitParams(params: any): void {
        console.log(`params`, params);
        this.ownerUuid = params.ownerUuid;
        this.sender = params.sender;
        this.receiver = params.receiver;
        this.amount = params.amount;
        this.description = params.description;
        this.coinListId = params.coinListId;
        this.coinCode = params.coinCode;
        this.limitBlock = params.limitBlock;
    }

    private ValidateParams(): string {
        console.log(
            `--->`,
            !(this.ownerUuid && this.sender && this.receiver && this.amount && this.description && this.coinListId && this.coinCode && this.limitBlock)
        );
        if (!(this.ownerUuid && this.sender && this.receiver && this.amount && this.description && this.coinListId && this.coinCode && this.limitBlock)) {
            console.log(`here`);
            return IENMessage.parametersEmpty;
        }
        if (this.sender == this.receiver) return IENMessage.youCanNotTransferToYourown;
        return IENMessage.success;
    }

    private Transfer(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    ownerUuid: this.ownerUuid,
                    coinListId: this.coinListId,
                    coinCode: this.coinCode,
                    sender: this.sender,
                    receiver: this.receiver,
                    amount: this.amount,
                    description: this.description,
                    limitBlock: this.limitBlock,
                }
                this.vendingAPIServgice.vendingLimiterCoinTransfer(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.myBill = response.info.bill;

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
                myBill: this.myBill
            }],
            message: IENMessage.success
        }

        return response;
    }
}