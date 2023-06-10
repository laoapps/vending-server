import { Subscription } from "rxjs";
import { IENMessage, IVendingRoles } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { VendingAPIService } from "src/app/services/vending-api.service";

export class LoadDefaultProcess {

    private workload: any = {} as any;

    private apiService: ApiService;
    private vendingAPIService: VendingAPIService;
    
    private ownerUuid: string;
    private machineId: string;

    private myMerchant: boolean = false;
    private myMerchantUUID: string;
    private myMerchantCoin: boolean = false;
    private myMerchantCoinName: string;
    private myMerchantCoinBalance: number;

    private coinListId: string;
    private coinCode: string;
    private coinName: string;

    private myVendingWallet: boolean = false;
    private myVendingWalletUUID: string;
    private myVendingWalletCoinName: string;
    private myVendingWalletCoin: boolean = false;
    private myVendingWalletCoinBalance: number;

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

                const FindVendingWallet = await this.FindVendingWallet();
                if (FindVendingWallet != IENMessage.success) throw new Error(FindVendingWallet);

                console.log(`init my account`, 10);

                const CreateVendingWallet = await this.CreateVendingWallet();
                if (CreateVendingWallet != IENMessage.success) throw new Error(CreateVendingWallet);

                console.log(`init my account`, 11);

                const FindVendingWalletCoin = await this.FindVendingWalletCoin();
                if (FindVendingWalletCoin != IENMessage.success) throw new Error(FindVendingWalletCoin);

                console.log(`init my account`, 12);

                const CreateVendingWalletCoin = await this.CreateVendingWalletCoin();
                if (CreateVendingWalletCoin != IENMessage.success) throw new Error(CreateVendingWalletCoin);
                
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
        this.machineId = params.machineId;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.machineId)) return IENMessage.parametersEmpty;
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
                    ownerUuid: this.ownerUuid,
                    machineId: this.machineId
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
                    machineId: this.machineId,
                    username: this.ownerUuid,
                    platform: 'vending'
                }
                this.vendingAPIService.createMerchant(params).subscribe(r => {
                    const response: any = r;
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
                    ownerUuid :this.ownerUuid,
                    machineId: this.machineId,
                    coinCode: this.coinCode,
                    coinListId: this.coinListId
                }
                this.vendingAPIService.findMerchantCoin(params).subscribe(r => {
                    const response: any = r;
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
                        machineId: this.machineId,
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
                        ownerUuid: this.ownerUuid,
                        machineId: this.machineId,
                        coinListId: this.coinListId,
                        coinCode: this.coinCode
                    }
                    this.vendingAPIService.createMerchantCoin(params).subscribe(r => {
                        const response: any = r;
                        if (response.status != 1) return resolve(response.message);
                        this.myMerchantCoin = true;
                        this.myMerchantCoinName = response.info.name;
                        this.apiService.merchantCoinName = response.info.name;
                        params = {
                            ownerUuid: this.ownerUuid,
                            machineId: this.machineId,
                            name: this.myMerchantCoinName
                        }
                        this.vendingAPIService.showMerchantCoinBalance(params).subscribe(r => {
                            const response: any = r;
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

    private FindVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.apiService.vendingWalletUUID != undefined && Object.entries(this.apiService.vendingWalletUUID).length == 0) {
                    const data = { machineId: this.machineId, uuid: '' }
                    this.apiService.vendingWalletUUID.push(data);
                } else {

                    const item = this.apiService.vendingWalletUUID.filter(item => item.machineId == this.machineId);
                    if (item != undefined && Object.entries(item).length == 0) {
                        const data = { machineId: this.machineId, uuid: '' }
                        this.apiService.vendingWalletUUID.push(data);
                    } else if (item != undefined && Object.entries(item).length > 0 && item[0].uuid != '') {
                        this.myVendingWalletUUID = item[0].uuid;
                        this.myVendingWallet = true;
                        return resolve(IENMessage.success);
                    }

                }

                const params = {
                    ownerUuid: this.ownerUuid,
                    machineId: this.machineId,
                }
                this.vendingAPIService.findVendingWallet(params).subscribe(r => {
                    const response: any = r;
                    if (response.status == 1) {
                        this.myVendingWallet = true;

                        if (this.apiService.vendingWalletCoinName != undefined) {
                            for(let i = 0; i < this.apiService.vendingWalletUUID.length; i++) {
                                const machineId = this.apiService.vendingWalletUUID[i].machineId;
                                const uuid = this.apiService.vendingWalletUUID[i].uuid;
                                if (machineId == this.machineId && uuid == '') {
                                    this.apiService.vendingWalletUUID[i].uuid = response.info.uuid;
                                    this.myVendingWalletUUID = response.info.uuid;
                                    return resolve(IENMessage.success);
                                }
                            }
                        }
                        

                    }
                    else if (response.status != 1 && response.message != IENMessage.notFoundYourVendingWallet)
                    {
                        return resolve(response.message);
                    }
                    else if (response.status != 1 && response.message == IENMessage.notFoundYourVendingWallet) 
                    {
                        this.myVendingWallet = false;
                    }
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateVendingWallet(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                if (this.myVendingWallet == true) return resolve(IENMessage.success);
                
                let params: any = {
                    ownerUuid: this.ownerUuid,
                    machineId: this.machineId,
                    username: this.ownerUuid,
                    platform: 'vending'
                }
                this.vendingAPIService.createVendingWallet(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);

                    if (response.status != 1) return resolve(response.message);
                    this.myVendingWallet = true;

                    if (this.apiService.vendingWalletCoinName != undefined) {
                        for(let i = 0; i < this.apiService.vendingWalletUUID.length; i++) {
                            const machineId = this.apiService.vendingWalletUUID[i].machineId;
                            const uuid = this.apiService.vendingWalletUUID[i].uuid;
                            if (machineId == this.machineId && uuid == '') {
                                this.apiService.vendingWalletUUID[i].uuid = response.info.uuid;
                                this.myVendingWalletUUID = response.info.uuid;
                                return resolve(IENMessage.success);
                            }
                        } 
                    }


                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindVendingWalletCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.apiService.vendingWalletCoinName != undefined && Object.entries(this.apiService.vendingWalletCoinName).length == 0) {
                    let data = { machineId: this.machineId, uuid: '', balance: null }
                    this.apiService.vendingWalletCoinName.push(data);
                } else {

                    const item = this.apiService.vendingWalletCoinName.filter(item => item.machineId == this.machineId);
                    if (item != undefined && Object.entries(item).length == 0) {
                        let data = { machineId: this.machineId, uuid: '', balance: null }
                        this.apiService.vendingWalletCoinName.push(data);
                    } else if (item != undefined && Object.entries(item).length > 0 && item[0].uuid != '') {
                        this.myVendingWalletCoinName = item[0].uuid;
                        this.myVendingWalletCoinBalance = item[0].balance;
                        this.myVendingWalletCoin = true;
                        return resolve(IENMessage.success);
                    }

                }

                const params = {
                    ownerUuid :this.ownerUuid,
                    machineId: this.machineId,
                    coinCode: this.coinCode,
                    coinListId: this.coinListId
                }
                this.vendingAPIService.findVendingWalletCoin(params).subscribe(r => {
                    const response: any = r;
                    if (response.status == 1) {
                        this.myVendingWalletCoin = true;

                        if (this.apiService.vendingWalletCoinName != undefined) {
                            for(let i = 0; i < this.apiService.vendingWalletCoinName.length; i++) {
                                const machineId = this.apiService.vendingWalletCoinName[i].machineId;
                                const uuid = this.apiService.vendingWalletCoinName[i].uuid;
                                if (machineId == this.machineId && uuid == '') {
                                    this.apiService.vendingWalletCoinName[i].uuid = response.info.name;
                                    this.myVendingWalletCoinName = response.info.name;
                                    return resolve(IENMessage.success);
                                }
                            } 
                        }


                    }
                    else if (response.status != 1 && response.message != IENMessage.notFoundYourVendingWalletCoin) {
                        return resolve(response.message);
                    }
                    else if (response.status != 1 && response.message == IENMessage.notFoundYourVendingWalletCoin) {
                        this.myVendingWalletCoin = false;
                    }
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                

            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private CreateVendingWalletCoin(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                console.log(`myVendingWalletCoin`, this.myVendingWalletCoin);
                if (this.myVendingWalletCoin == true) {
                    console.log(`create vending wallet coin 1`);
                    const params = {
                        ownerUuid: this.ownerUuid,
                        machineId: this.machineId,
                        name: this.myVendingWalletCoinName
                    }
                    this.vendingAPIService.showVendingWalletCoinBalance(params).subscribe(r => {
                        const response: any = r;
                        if (response.status != 1) return resolve(response.message);

                        if (this.apiService.vendingWalletCoinName != undefined) {
                            for(let i = 0; i < this.apiService.vendingWalletCoinName.length; i++) {
                                const machineId = this.apiService.vendingWalletCoinName[i].machineId;
                                const uuid = this.apiService.vendingWalletCoinName[i].uuid;
                                if (machineId == this.machineId && uuid != '') {
                                    console.log(`here`);
                                    this.apiService.vendingWalletCoinName[i].balance = response.info.balance;
                                    this.myVendingWalletCoinBalance = response.info.balance;
                                    return resolve(IENMessage.success);
                                }
                            }
                        }


                    }, error => resolve(error.message));
                } else {
                    console.log(`create vending wallet coin 2`);

                    let params: any = {
                        ownerUuid: this.ownerUuid,
                        machineId: this.machineId,
                        coinListId: this.coinListId,
                        coinCode: this.coinCode
                    }
                    this.vendingAPIService.createVendingWalletCoin(params).subscribe(r => {
                        const response: any = r;
                        if (response.status != 1) return resolve(response.message);
                        this.myVendingWalletCoin = true;
                        this.myVendingWalletCoinName = response.info.name;

                        params = {
                            ownerUuid: this.ownerUuid,
                            machineId: this.machineId,
                            name: this.myVendingWalletCoinName
                        }
                        this.vendingAPIService.showVendingWalletCoinBalance(params).subscribe(r => {
                            const response: any = r;
                            if (response.status != 1) return resolve(response.message);
                            this.myVendingWalletCoinBalance = response.info.balance;

                            if (this.apiService.vendingWalletCoinName != undefined) {
                                for(let i = 0; i < this.apiService.vendingWalletCoinName.length; i++) {
                                    const machineId = this.apiService.vendingWalletCoinName[i].machineId;
                                    const uuid = this.apiService.vendingWalletCoinName[i].uuid;
                                    if (machineId == this.machineId && uuid == '') {
                                        this.apiService.vendingWalletCoinName[i].uuid = this.myVendingWalletCoinName;
                                        this.apiService.vendingWalletCoinName[i].balance = this.myVendingWalletCoinBalance;
                                        return resolve(IENMessage.success);
                                    }
                                }
                            }
                            
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
                vendingWalletUUID: this.myVendingWalletUUID,
                vendingWalletCoinName: this.myVendingWalletCoinName,
                vendingWalletCoinBalance: this.myVendingWalletCoinBalance
            }],
            message: IENMessage.success
        }

        return response;
    }
}