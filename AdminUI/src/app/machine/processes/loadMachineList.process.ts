import axios from "axios";
import { IApp } from "src/app/models/app.model";
import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { AppcachingserviceService } from "src/app/services/appcachingservice.service";

export class LoadMachineListProcess {

    private workload: any = {} as any;

    // services
    private apiService: ApiService;
    private cashingService: AppcachingserviceService;
    
    // parameters
    private ownerUuid: string;
    private filemanagerURL: string;

    // properties
    private lists: Array<any> = [];
    private storage: Array<{ name: string, file: string }> = [];

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
                


                console.log(`init machine list`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`init machine list`, 2);

                this.InitParams(params);
  
                console.log(`init machine list`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`init machine list`, 4);

                const LoadList = await this.LoadList();
                if (LoadList != IENMessage.success) throw new Error(LoadList);

                console.log(`init machine list`, 5);

                const LoadStorage = await this.LoadStorage();
                if (LoadStorage != IENMessage.success) throw new Error(LoadStorage);

                const LoadStorageImage = await this.LoadStorageImage();
                if (LoadStorageImage != IENMessage.success) throw new Error(LoadStorageImage);

                console.log(`init machine list`, 9);
                
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
        this.lists = [];
        console.log(`params`, params);

        this.ownerUuid = params.ownerUuid;
        this.filemanagerURL = params.filemanagerURL;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.filemanagerURL)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }


    private LoadList(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                this.apiService.listMachine().subscribe(r => {
                    const response: any = r;
                    console.log(`response`, response);
                    if (response.status != 1) return resolve(IENMessage.loadListFail);
                    if (response.status == 1 && response.data.length == 0) return resolve(IENMessage.notFoundAnyDataList);
                    this.lists = response.data;
                    this.lists.find(field => field.photourl = '');
                    console.log(`machine lists`, this.lists);
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private LoadStorage(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                let run = await this.cashingService.get(IApp.cashing);
                if (run == undefined || run == null) {
                    this.storage = [];
                    await this.cashingService.set(IApp.cashing, []);
                    return resolve(IENMessage.success);
                }
                const parse = JSON.parse(run);
                this.storage = parse.v;
                resolve(IENMessage.success);
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private LoadStorageImage(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                this.lists.filter(list => {
                    this.storage.find((cash, cash_index) => {
                        if (list.photo == cash.name) {
                            list.photoUrl = cash.name;
                            list.photo = cash.file;
                        }
                    });
                });

                const data = this.lists.filter(item => item.photo != undefined && item.photo != undefined && item.photo.substring(0,4) == 'data');
                const nodata = this.lists.filter(item => item.photo != undefined && item.photo.substring(0,4) != 'data');
                console.log(`node data`, nodata);
                if (nodata != undefined && nodata.length > 0)
                {
                    for(let i = 0; i < nodata.length; i++) {
                        console.log(`receive image new`);

                        if (nodata[i].photo != "") {
                            const url = `${this.filemanagerURL}${nodata[i].photo}`;
                            const run = await axios({
                                method: 'GET',
                                url: url,
                                responseType: 'blob'
                            });
                            let file = await this.apiService.convertBlobToBase64(run.data);
        
                            const obj = {
                                name: nodata[i].photo,
                                file: file
                            }
        
                            nodata[i].photoUrl = this.lists[i].photo;
                            nodata[i].photo = file;
                            this.storage.push(obj);
                        }

                    }
                    data.push(...nodata);
                }

                this.lists = data;
                await this.cashingService.set(IApp.cashing, this.storage);

                resolve(IENMessage.success);
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }
    private Commit(): any {
        const readonly = this.lists.filter(item => item.readonly == true)[0]?.readonly;
        const response = {
            data: [{
                readonly: readonly ? readonly : false,
                lists: this.lists
            }],
            message: IENMessage.success
        }

        return response;
    }

}