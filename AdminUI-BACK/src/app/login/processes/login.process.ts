import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { LaabApiService } from "src/app/services/laab-api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class LoginProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    private phonenumber: string;
    private password: string;
    
    private token: string;
    private name: string;
    private owneruuid: string;
    private passkeys: string;

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
                
                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`login process`, 1);

                this.InitParams(params);

                console.log(`login process`, 2);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`login process`, 3);

                const FindLaabAccount = await this.FindLaabAccount();
                if (FindLaabAccount != IENMessage.success) throw new Error(FindLaabAccount);

                console.log(`login process`, 4);

                (await this.workload).dismiss();
                resolve(this.Commit());

                // console.log(`login process`, 5);

            } catch (error) {

                (await this.workload).dismiss();
                resolve(error.message);
            }
        });
    }

    private InitParams(params: any): void {
        this.phonenumber = params.phonenumber;
        this.password = params.password;
    }

    private ValidateParams(): string {
        if (!(this.phonenumber && this.password)) return IENMessage.phonenumberAndPasswordIsRequired;
        return IENMessage.success;
    }

    private FindLaabAccount(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    phonenumber: this.phonenumber,
                    password: this.password
                }
                this.vendingAPIService.login(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.token = response.info.token;
                    this.owneruuid = response.info.ownerUuid;
                    this.name = response.info.name;
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
                owneruuid: this.owneruuid,
                name: this.name,
                token: this.token
            }],
            message: IENMessage.success
        }

        return response;
    }
}