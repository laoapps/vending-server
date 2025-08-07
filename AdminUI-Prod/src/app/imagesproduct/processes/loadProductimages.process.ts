import axios from "axios";
import { IApp } from "src/app/models/app.model";
import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { AppcachingserviceService } from "src/app/services/appcachingservice.service";

export class LoadProductImagesProcess {

    private workload: any = {} as any;

    // services
    private apiService: ApiService;
    private cashingService: AppcachingserviceService;

    // parameters
    private ownerUuid: string;
    private filemanagerURL: string;
    private status: string;

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
        return new Promise<any>(async (resolve, reject) => {
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

                const LoadList = await this.LoadList();
                if (LoadList != IENMessage.success) throw new Error(LoadList);

                console.log(`init product list`, 5);

                const LoadStorage = await this.LoadStorage();
                if (LoadStorage != IENMessage.success) throw new Error(LoadStorage);

                const LoadStorageImage = await this.LoadStorageImage();
                if (LoadStorageImage != IENMessage.success) throw new Error(LoadStorageImage);

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
        this.lists = [];

        this.ownerUuid = params.ownerUuid;
        this.filemanagerURL = params.filemanagerURL;
        this.status = params.status ? params.status : '';
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.filemanagerURL)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }


    private LoadList(): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {

                // this.apiService.listProduct(this.status).subscribe(r => {
                // use this method 
                this.apiService.listProduct('yes').subscribe(r => {
                    const response: any = r;
                    if (response.status != 1) return resolve(IENMessage.loadListFail);
                    if (response.status == 1 && response.data.length == 0) return resolve(IENMessage.notFoundAnyDataList);
                    this.lists = response.data;
                    this.lists.find(field => field.imageurl = '');
                    let list = this.lists.map(item => { return { id: item.id, image: item.image } });
                    list = list.sort((a, b) => a.id - b.id);
                    console.log(`product lists`, list);
                    resolve(IENMessage.success);
                }, error => resolve(error.message));

            } catch (error) {
                resolve(error.message);
            }
        });
    }


    private LoadStorage(): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
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
        return new Promise<any>(async (resolve, reject) => {
            try {

                this.lists.filter(list => {
                    this.storage.find((cash, cash_index) => {
                        if (list.image == cash.name) {
                            list.imageurl = cash.name;
                            list.image = cash.file;
                        }
                    });
                });

                const data = this.lists.filter(item => item.image != undefined && item.image != undefined && item.image.substring(0, 4) == 'data');
                const nodata = this.lists.filter(item => item.image != undefined && item.image.substring(0, 4) != 'data');

                if (nodata != undefined && nodata.length > 0) {
                    for (let i = 0; i < nodata.length; i++) {

                        if (nodata[i].image != "") {
                            console.log(`receive image new`);

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

                            nodata[i].imageurl = this.lists[i].image;
                            nodata[i].image = file;
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