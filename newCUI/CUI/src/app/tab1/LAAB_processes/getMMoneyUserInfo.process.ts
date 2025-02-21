import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";
import * as cryptojs from 'crypto-js';

export class GetMMoneyUserInfoProccess {

    private workload: any = {} as any;

    private apiService: ApiService;
    
    private phonenumber: string;

    // props
    private name: string;
    private surname: string;

    constructor(
        apiService: ApiService,
    ) {
        this.apiService = apiService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                


                console.log(`paid validation`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`paid validation`, 2);

                this.InitParams(params);

                console.log(`paid validation`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`paid validation`, 4);
                
                const GetMMoneyUserInfo = await this.GetMMoneyUserInfo();
                if (GetMMoneyUserInfo != IENMessage.success) throw new Error(GetMMoneyUserInfo);

                console.log(`paid validation`, 5);

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
        this.phonenumber = params.phonenumber;
    }

    private ValidateParams(): string {
        if (!(this.phonenumber)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private GetMMoneyUserInfo(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                this.apiService.getMMoneyUserInfo(this.phonenumber).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status == 1 && response.data.responseCode != '0000' || response.status != 1) return resolve(IENMessage.notFoundYourMMoneyAccount);
                    this.name = response.data.name;
                    this.surname = response.data.surname;
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
                name: this.name,
                surname: this.surname
            }],
            message: IENMessage.success
        }

        return response;
    }
}