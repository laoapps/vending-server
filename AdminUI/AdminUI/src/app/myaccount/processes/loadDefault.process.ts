import { Subscription } from "rxjs";
import { IENMessage, IVendingRoles } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class LoadDefaultProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private ownerUuid: string;

    private myMerchant: boolean = false;
    private myMerchantUUID: string;
    private myMerchantCoin: boolean = false;
    private myMerchantCoinName: string;
    private myMerchantCoinBalance: number;

    private myVendingLimiter: boolean = false;
    private myVendingLimiterUUID: string;
    private myVendingLimiterCoinName: string;
    private myVendingLimiterCoin: boolean = false;
    private myVendingLimiterCoinBalance: number;

    run_subscribe: Subscription;

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
                


                console.log(`init my account`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`init my account`, 2);

                this.InitParams(params);

                console.log(`init my account`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`init my account`, 4);

                const FindMerchant = await this.FindMerchant();
                if (FindMerchant != IENMessage.success) throw new Error(FindMerchant);

                console.log(`init my account`, 5);

                const CreateMerchant = await this.CreateMerchant();
                if (CreateMerchant != IENMessage.success) throw new Error(CreateMerchant);

                console.log(`init my account`, 6);

                console.log(`init my account`, 7);

                const FindMerchantCoin = await this.FindMerchantCoin();
                if (FindMerchantCoin != IENMessage.success) throw new Error(FindMerchantCoin);

                console.log(`init my account`, 8);

                const createMerchantCoin = await this.createMerchantCoin();
                if (createMerchantCoin != IENMessage.success) throw new Error(createMerchantCoin);
               
                console.log(`init my account`, 9);

                const FindVendingLimiter = await this.FindVendingLimiter();
                if (FindVendingLimiter != IENMessage.success) throw new Error(FindVendingLimiter);

                console.log(`init my account`, 10);

                const CreateVendingLimiter = await this.CreateVendingLimiter();
                if (CreateVendingLimiter != IENMessage.success) throw new Error(CreateVendingLimiter);

                console.log(`init my account`, 11);

                const FindVendingLimiterCoin = await this.FindVendingLimiterCoin();
                if (FindVendingLimiterCoin != IENMessage.success) throw new Error(FindVendingLimiterCoin);

                console.log(`init my account`, 12);

                const CreateVendingLimiterCoin = await this.CreateVendingLimiterCoin();
                if (CreateVendingLimiterCoin != IENMessage.success) throw new Error(CreateVendingLimiterCoin);
                
                console.log(`init my account`, 13);
                
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
        this.ownerUuid = params.ownerUuid;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }

    private FindMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.apiService.merchantUUID != undefined && Object.entries(this.apiService.merchantUUID).length > 0) {
                    this.myMerchantUUID = this.apiService.merchantUUID;
                    this.myMerchant = true;
                    return resolve(IENMessage.success);
                }

                const params = {
                    ownerUuid: this.ownerUuid
                }
                this.vendingAPIService.findMerchant(params).subscribe(r => {
                    const response: any = r;
                    if (response.status == 1) {
                        this.myMerchant = true;
                        this.myMerchantUUID = response.info.uuid;
                        this.apiService.merchantUUID = response.info.uuid;
                        this.apiService.ownerCoinListId = response.info.coinListId;
                        this.apiService.ownerCoinCode = response.info.coinCode;
                        this.apiService.ownerCoinName = response.info.coinName;
                    }
                    else if (response.status != 1 && response.message != IENMessage.notFoundYourMerchant)
                    {
                        return resolve(response.message);
                    }
                    else if (response.status != 1 && response.message == IENMessage.notFoundYourMerchant) 
                    {
                        this.myMerchant = false;
                    }
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateMerchant(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                
                if (this.myMerchant == true) return resolve(IENMessage.success);
                
                let params: any = {
                    ownerUuid: this.ownerUuid,
                    username: this.ownerUuid,
                    platform: 'vending'
                }
                this.vendingAPIService.createMerchant(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.myMerchant = true;
                    this.myMerchantUUID = response.info.uuid;
                    this.apiService.merchantUUID = response.info.uuid;
                    this.apiService.ownerCoinListId = response.info.coinListId;
                    this.apiService.ownerCoinCode = response.info.coinCode;
                    this.apiService.ownerCoinName = response.info.coinName;
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindMerchantCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.apiService.merchantCoinName != undefined && Object.entries(this.apiService.merchantCoinName).length > 0) {
                    this.myMerchantCoinName = this.apiService.merchantCoinName;
                    this.myMerchantCoin = true;
                    return resolve(IENMessage.success);
                }

                const params = {
                    ownerUuid :this.ownerUuid
                }
                this.vendingAPIService.findMerchantCoin(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response find merchant coin`, response);
                    if (response.status == 1) {
                        this.myMerchantCoin = true;
                        this.myMerchantCoinName = response.info.name;
                        this.apiService.merchantCoinName = response.info.name;
                    }
                    else if (response.status != 1 && response.message != IENMessage.notFoundYourMerchantCoin) {
                        return resolve(response.message);
                    }
                    else if (response.status != 1 && response.message == IENMessage.notFoundYourMerchantCoin) {
                        this.myMerchantCoin = false;
                    }
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private createMerchantCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                if (this.myMerchantCoin == true) {
                    const params = {
                        ownerUuid: this.ownerUuid,
                        name: this.myMerchantCoinName
                    }
                    this.vendingAPIService.showMerchantCoinBalance(params).subscribe(r => {
                        const response: any = r;
                        if (response.status != 1) return resolve(response.message);
                        this.myMerchantCoinBalance = response.info.balance;
                        this.apiService.merchanteCoinBalance = response.info.balance;
                        resolve(IENMessage.success);
                    }, error => resolve(error.message));
                } else {
                    let params: any = {
                        ownerUuid: this.ownerUuid
                    }
                    this.vendingAPIService.createMerchantCoin(params).subscribe(r => {
                        const response: any = r;
                        if (response.status != 1) return resolve(response.message);
                        this.myMerchantCoin = true;
                        this.myMerchantCoinName = response.info.name;
                        this.apiService.merchantCoinName = response.info.name;
                        params = {
                            ownerUuid: this.ownerUuid,
                            name: this.myMerchantCoinName
                        }
                        this.vendingAPIService.showMerchantCoinBalance(params).subscribe(r => {
                            const response: any = r;
                            console.log(`response`, response);
                            if (response.status != 1) return resolve(response.message);
                            this.myMerchantCoinBalance = response.info.balance;
                            this.apiService.merchanteCoinBalance = response.info.balance;
                            resolve(IENMessage.success);
                        }, error => resolve(error.message));
                    }, error => resolve(error.message));
                }

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingLimiter(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.apiService.vendingLimiterUUID != undefined && Object.entries(this.apiService.vendingLimiterUUID).length > 0) {
                    this.myVendingLimiterUUID = this.apiService.vendingLimiterUUID;
                    this.myVendingLimiter = true;
                    return resolve(IENMessage.success);
                }

                const params = {
                    ownerUuid: this.ownerUuid
                }
                this.vendingAPIService.findVendingLimiter(params).subscribe(r => {
                    const response: any = r;
                    if (response.status == 1) {
                        this.myVendingLimiter = true;
                        this.myVendingLimiterUUID = response.info.uuid;
                        this.apiService.vendingLimiterUUID = response.info.uuid;
                    }
                    else if (response.status != 1 && response.message != IENMessage.notFoundYourVendingLimiter)
                    {
                        return resolve(response.message);
                    }
                    else if (response.status != 1 && response.message == IENMessage.notFoundYourVendingLimiter) 
                    {
                        this.myVendingLimiter = false;
                    }
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }


    private CreateVendingLimiter(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                if (this.myVendingLimiter == true) return resolve(IENMessage.success);
                
                let params: any = {
                    ownerUuid: this.ownerUuid,
                    username: this.ownerUuid,
                    platform: 'vending'
                }
                this.vendingAPIService.createVendingLimiter(params).subscribe(r => {
                    const response: any = r;
                    if (response.status != 1) return resolve(response.message);
                    this.myVendingLimiter = true;
                    this.myVendingLimiterUUID = response.info.uuid;
                    this.apiService.vendingLimiterUUID = response.info.uuid;
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingLimiterCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.apiService.vendingLimiterCoinName != undefined && Object.entries(this.apiService.vendingLimiterCoinName).length > 0) {
                    this.myVendingLimiterCoinName = this.apiService.vendingLimiterCoinName;
                    this.myVendingLimiterCoin = true;
                    return resolve(IENMessage.success);
                }

                const params = {
                    ownerUuid :this.ownerUuid
                }
                this.vendingAPIService.findVendingLimiterCoin(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response FindVendingLimiterCoin`, response);
                    if (response.status == 1) {
                        this.myVendingLimiterCoin = true;
                        this.myVendingLimiterCoinName = response.info.name;
                        this.apiService.vendingLimiterCoinName = response.info.name;
                    }
                    else if (response.status != 1 && response.message != IENMessage.notFoundYourVendingLimiterCoin) {
                        return resolve(response.message);
                    }
                    else if (response.status != 1 && response.message == IENMessage.notFoundYourVendingLimiterCoin) {
                        this.myVendingLimiterCoin = false;
                    }
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateVendingLimiterCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                if (this.myVendingLimiterCoin == true) {
                    const params = {
                        ownerUuid: this.ownerUuid,
                        name: this.myVendingLimiterCoinName
                    }
                    this.vendingAPIService.showVendingLimiterCoinBalance(params).subscribe(r => {
                        const response: any = r;
                        console.log(`respose`, response);
                        if (response.status != 1) return resolve(response.message);
                        this.myVendingLimiterCoinBalance = response.info.balance;
                        this.apiService.vendingLimiterCoinBalance = response.info.balance;
                        resolve(IENMessage.success);
                    }, error => resolve(error.message));
                } else {
                    let params: any = {
                        ownerUuid: this.ownerUuid
                    }
                    this.vendingAPIService.createVendingLimiterCoin(params).subscribe(r => {
                        const response: any = r;
                        console.log(`respose`, response);
                        if (response.status != 1) return resolve(response.message);
                        this.myVendingLimiterCoin = true;
                        this.myVendingLimiterCoinName = response.info.name;
                        this.apiService.vendingLimiterCoinName = response.info.name;
                        params = {
                            ownerUuid: this.ownerUuid,
                            name: this.myVendingLimiterCoinName
                        }
                        this.vendingAPIService.showVendingLimiterCoinBalance(params).subscribe(r => {
                            const response: any = r;
                            if (response.status != 1) return resolve(response.message);
                            this.myVendingLimiterCoinBalance = response.info.balance;
                            this.apiService.vendingLimiterCoinBalance = response.info.balance;
                            resolve(IENMessage.success);
                        }, error => resolve(error.message));
                    }, error => resolve(error.message));
                }

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    
    
    private Commit(): any {
        const response = {
            data: [{
                merchantCoinBalance: this.myMerchantCoinBalance,
                vendingLimiterCoinBalance: this.myVendingLimiterCoinBalance
            }],
            message: IENMessage.success
        }

        return response;
    }
}