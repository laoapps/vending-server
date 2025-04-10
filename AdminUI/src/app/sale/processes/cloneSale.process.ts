import axios from "axios";
import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { AppcachingserviceService } from "src/app/services/appcachingservice.service";

export class CloneSaleProcess {

    private workload: any = {} as any;

    // services
    private apiService: ApiService;
    private cashingService: AppcachingserviceService;
    
    // parameters
    private ownerUuid: string;
    private machineId: string;
    private cloneMachineId: string;
    private filemanagerURL: string;

    // properties
    private lists: Array<any> = [];
    private cashList: Array<{ name: string, file: string }> = [];
    private firsttime: boolean = false;

    constructor(
        apiService: ApiService,
        cashingService: AppcachingserviceService,
    ) {
        this.apiService = apiService;
        this.cashingService = cashingService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                


                console.log(`init product list`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`init product list`, 2);

                this.InitParams(params);
  
                console.log(`init product list`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`init product list`, 4);

                const CloneSale = await this.CloneSale();
                if (CloneSale != IENMessage.success) throw new Error(CloneSale);

                console.log(`init product list`, 5);

                const FindCashingServiceList = await this.FindCashingServiceList();
                if (FindCashingServiceList != IENMessage.success) throw new Error(FindCashingServiceList);
                
                console.log(`init product list`, 6);

                this.ValidateClientLoad();

                console.log(`init product list`, 7);

                const HttpReceiveImageAndSaveOnCashingService = await this.HttpReceiveImageAndSaveOnCashingService();
                if (HttpReceiveImageAndSaveOnCashingService != IENMessage.success) throw new Error(HttpReceiveImageAndSaveOnCashingService);

                console.log(`init product list`, 8);

                const ReceiveImageAndSaveNewChangeOnCashingService = await this.ReceiveImageAndSaveNewChangeOnCashingService();
                if (ReceiveImageAndSaveNewChangeOnCashingService != IENMessage.success) throw new Error(ReceiveImageAndSaveNewChangeOnCashingService);

                console.log(`init product list`, 9);
                
                (await this.workload).dismiss();
                resolve(this.Commit());


            } catch (error) {
                console.log(`error`, error.message);
                (await this.workload).dismiss();
                resolve(error.message);     
            }
        });
    }

    private InitParams(params: any): void {
        this.ownerUuid = params.ownerUuid;
        this.machineId = params.machineId;
        this.cloneMachineId = params.cloneMachineId;
        this.filemanagerURL = params.filemanagerURL;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.machineId && this.cloneMachineId && this.filemanagerURL)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }


    private CloneSale(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    machineId: this.machineId,
                    cloneMachineId: this.cloneMachineId
                }

                this.apiService.cloneSale(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response status`, response.status);
                    console.log(`response data`, response.data);
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.lists = response.data; 
                    console.log(`lists`, this.lists);
                    resolve(IENMessage.success);
                }, error => resolve(error.message));

                
            } catch (error) {
                resolve(error.message);
            }
        });
    }
    private cloneMahinceCUI(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    machineId: this.machineId,
                    cloneMachineId: this.cloneMachineId
                }

                this.apiService.cloneMahinceCUI(params).subscribe(r => {
                    const response: any = r;
                    console.log(`response status`, response.status);
                    console.log(`response data`, response.data);
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(response.message);
                    this.lists = response.data; 
                    console.log(`lists`, this.lists);
                    resolve(IENMessage.success);
                }, error => resolve(error.message));

                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindCashingServiceList(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                let run = await this.cashingService.get(this.ownerUuid);
                if (run == undefined || run == null) {
                    this.cashList = [];
                    await this.cashingService.set(this.ownerUuid, []);
                    return resolve(IENMessage.success);
                }
                const parse = JSON.parse(run);
                this.cashList = parse.v;
                console.log(`cash list`, this.cashList);

                resolve(IENMessage.success);
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private ValidateClientLoad() {
        if ( this.cashList != undefined && Object.entries(this.cashList).length == 0){
            this.firsttime = true;
        }
    }

    private HttpReceiveImageAndSaveOnCashingService(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
            
                if (this.firsttime == false) return resolve(IENMessage.success);
    
                let lists: Array<{ name: string, file: string}> = [];
                for(let i = 0; i < this.lists.length; i++) {
                    const name = this.lists[i].stock.image;
    
                    if (name != '' && name.substring(0,4) != 'data') {
                    
                        const url = `${this.filemanagerURL}${name}`;
                        const run = await axios({
                            method: 'GET',
                            url: url,
                            responseType: 'blob'
                        });
                        let file = await this.apiService.convertBlobToBase64(run.data);
        
                        const obj = {
                            name: name,
                            file: file
                        }
        
                        const same = lists.filter(item => item.name == name);
                        if (same != undefined && Object.entries(same).length == 0) {
                            lists.push(obj);
                        }
                        this.lists[i].stock.imageurl = this.lists[i].image;
                        this.lists[i].stock.image = file;
    
                    }
                    if (i == this.lists.length-1) {
                        console.log(`first time save`, this.ownerUuid, this.lists, lists);
                        await this.cashingService.set(this.ownerUuid, lists);
                    }
                }
    
                resolve(IENMessage.success);
    
            } catch (error) {
                resolve(error.message)
            }
        });
    }

    private ReceiveImageAndSaveNewChangeOnCashingService(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.firsttime == true) return resolve(IENMessage.success);

                this.lists.filter(list => {
                    this.cashList.find((cash, cash_index) => {
                        if (list.stock.image == cash.name) {
                            list.stock.imageurl = cash.name;
                            list.stock.image = cash.file;
                        }
                    });
                });

                const data = this.lists.filter(item => item.stock.image.substring(0,4) == 'data');
                const nodata = this.lists.filter(item => item.stock.image.substring(0,4) != 'data');

                if (nodata != undefined && nodata.length > 0)
                {
                    for(let i = 0; i < nodata.length; i++) {
                        console.log(`get new`, i+1);

                        const url = `${this.filemanagerURL}${nodata[i].image}`;
                        const run = await axios({
                            method: 'GET',
                            url: url,
                            responseType: 'blob'
                        });
                        let file = await this.apiService.convertBlobToBase64(run.data);

                        const obj = {
                            name: nodata[i].image,
                            file: file
                        }
    
                        nodata[i].stock.imageurl = nodata[i].image;
                        nodata[i].stock.image = file;
                        this.cashList.push(obj);
                    }
                    data.push(...nodata);
                }

                this.lists = data;
                await this.cashingService.set(this.ownerUuid, this.cashList);

                resolve(IENMessage.success);
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private Commit(): any {
        console.log(`commit list`, this.lists);
        const response = {
            data: [{
                lists: this.lists
            }],
            message: IENMessage.success
        }

        return response;
    }

}