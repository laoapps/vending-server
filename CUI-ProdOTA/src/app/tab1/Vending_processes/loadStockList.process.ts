import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { AppcachingserviceService } from "src/app/services/appcachingservice.service";
import axios from "axios";
import { CustomloadingPage } from "src/app/customloading/customloading.page";

export class LoadStockListProcess {

    private workload: any = {} as any;

    // services
    private apiService: ApiService;
    private cashingService: AppcachingserviceService;
    
    // parameters
    private ownerUuid: string;
    private filemanagerURL: string;

    // properties
    private lists: Array<any> = [];
    private images: Array<any> = [];
    private imageObject: any = {} as any;
    private cashList: Array<{ name: string, file: string }> = [];
    private firsttime: boolean = false;

    private text: string;
    constructor(
        apiService: ApiService,
        cashingService: AppcachingserviceService,
    ) {
        this.apiService = apiService;
        this.cashingService = cashingService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            let message={message:'Loading stock list....'};
            try {
                
                (await this.apiService.showModal(CustomloadingPage,{message})).present();

                console.log(`init stock list`, 1);

                // this.workload = this.apiService.load.create({ message: 'loading...' });
                // (await this.workload).present();

                console.log(`init stock list`, 2);
                message.message='Init params....';
                this.InitParams(params);
  
                console.log(`init stock list`, 3);
                message.message='validate params....';
                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`init stock list`, 4);
                message.message='Load product list....';
                const LoadProductList = await this.LoadProductList(message);
                if (LoadProductList != IENMessage.success) throw new Error(LoadProductList);

                console.log(`init stock list`, 5);
                message.message='find caching service list....' + 5;
                const FindCashingServiceList = await this.FindCashingServiceList(message);
                if (FindCashingServiceList != IENMessage.success) throw new Error(FindCashingServiceList);
                
                console.log(`init stock list`, 6);
                message.message='Validate client load....' + 6;
                this.ValidateClientLoad();

                console.log(`init stock list`, 7);
                message.message='load images....';
                const HttpReceiveImageAndSaveOnCashingService = await this.HttpReceiveImageAndSaveOnCashingService(message);
                this.text = HttpReceiveImageAndSaveOnCashingService;

                if (HttpReceiveImageAndSaveOnCashingService != IENMessage.success) throw new Error(HttpReceiveImageAndSaveOnCashingService);

                console.log(`init stock list`, 8);
                message.message='caching image....';
                const ReceiveImageAndSaveNewChangeOnCashingService = await this.ReceiveImageAndSaveNewChangeOnCashingService(message);
                if (ReceiveImageAndSaveNewChangeOnCashingService != IENMessage.success) throw new Error(ReceiveImageAndSaveNewChangeOnCashingService);

                console.log(`init stock list`, 9);
                message.message='caching images....';
                setTimeout(() => {
                     // (await this.workload).dismiss();
                this.apiService.dismissModal();
                resolve(this.Commit());
                
                }, 1000);
               


            } catch (error) {
                message.message='Init params....'+error.message;
                this.apiService.alertError(`error cash ${this.text} ${message.message}`);
                this.apiService.IndexedLogDB.addBillProcess({errorData:`Error cash :${JSON.stringify(error)}`});
                setTimeout(() => {
                    this.apiService.dismissModal();
                    console.log(`error`, error.message);
                    // (await this.workload).dismiss();
                    resolve(error.message);
                }, 3000);
            }
        });
    }

    private InitParams(params: any): void {
        this.lists = [];
        this.firsttime = false;

        this.ownerUuid = params.ownerUuid;
        this.filemanagerURL = params.filemanagerURL;
    }

    private ValidateParams(): string {
        if (!(this.ownerUuid && this.filemanagerURL)) return IENMessage.parametersEmpty;
        return IENMessage.success;
    }


    private LoadProductList(message:any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                this.apiService.loadVendingSale().then(rx => {


                    const response: any = rx.data;
                    if (response.status != 1) return resolve(IENMessage.loadVendingSaleListFail);
                    if (response.status == 1 && response.data.length == 0) return resolve(IENMessage.vendingSaleListEmpty);
                    console.log('LoadProductList response',response.data);
                    this.lists = response.data;
                    this.images = this.lists.map(item => { return { name: item.stock.image, file: item.stock.image } });
                    this.lists.find(field => field.stock.imageurl = '');
                    message.message='found sale '+this.lists.length;
                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FindCashingServiceList(message:any): Promise<any> {
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
                message.message='caching list '+this.cashList.length
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

    private HttpReceiveImageAndSaveOnCashingService(message:any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
            
                if (this.firsttime == false) return resolve(IENMessage.success);
    
                let images: Array<{ name: string, file: string}> = [];
                for(let i = 0; i < this.images.length; i++) {
                    const name = this.images[i].name;
                    message.message=' loading image '+name +' -- '+i+'/'+this.images.length;
                    if (name != '' &&  name?.substring(0,4) != 'data') {
                    
                        // const url = `${this.filemanagerURL}download/${name}`;
                        const url = `${this.filemanagerURL}downloadphoto?url=${name}&w=80&h=100`;

                        const run = await axios({
                            method: 'POST',
                            url: url,
                            responseType: 'blob'
                        });
                        let file = await this.apiService.convertBlobToBase64(run.data);
        
                        const obj = {
                            name: name,
                            file: file
                        }
        
                        const same = images.filter(item => item.name == name);
                        if (same != undefined && Object.entries(same).length == 0) {
                            images.push(obj);
                        }

                        // this.lists[i].stock.imageurl = this.lists[i].stock.image;
                        // this.lists[i].stock.image = file;
                       
                    }
                    if (i == this.images.length-1) {
                        this.images = images;
                        await this.cashingService.set(this.ownerUuid, images);
                    }
                }
    
                resolve(IENMessage.success);
    
            } catch (error) {
                resolve(error.message)
            }
        });
    }

    private ReceiveImageAndSaveNewChangeOnCashingService(message:any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                if (this.firsttime == true) return resolve(IENMessage.success);

                this.images.forEach((list,i) => {
                    this.cashList.find((cash, cash_index) => {
                        if (list.name == cash.name) {
                            list.file = cash.file;
                            // list.stock.imageurl = cash.name;
                            // list.stock.image = cash.file;
                        }
                    });
                    message.message='caching '+i+' name:'+list.image
                });

                const data = this.images.filter(item => item?.file?.substring(0,4) == 'data');
                const nodata = this.images.filter(item => item?.file?.substring(0,4) != 'data');

                if (nodata != undefined && nodata.length > 0)
                {
                    for(let i = 0; i < nodata.length; i++) {
                        // const url = `${this.filemanagerURL}download/${nodata[i].name}`;
                        const url = `${this.filemanagerURL}downloadphoto?url=${nodata[i].name}&w=50&h=124`;
                        const run = await axios({
                            method: 'POST',
                            url: url,
                            responseType: 'blob'
                        });
                        const file = await this.apiService.convertBlobToBase64(run.data);
    
                        const obj = {
                            name: nodata[i].name,
                            file: file
                        }
    
                        // nodata[i].stock.imageurl = nodata[i].stock.image;
                        // nodata[i].stock.image = file;
                        this.cashList.push(obj);
                    }
                    data.push(...nodata);
                }

                this.images = data;
                await this.cashingService.set(this.ownerUuid, this.cashList);

                resolve(IENMessage.success);
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private Commit(): any {
        
        this.images.forEach(list=>{
            Object.keys(list).forEach(k =>{
                if(k=='name')
                this.imageObject[list.name] = list.file;
            });
        });

        const response = {
            data: [{
                lists: this.lists,
                images: this.images,
                imageObject: this.imageObject,
                cashList: this.cashList
            }],
            message: IENMessage.success
        }

        return response;
    }

}

// fixed

// import { IENMessage } from "src/app/models/base.model";
// import { ApiService } from "src/app/services/api.service";
// import { AppcachingserviceService } from "src/app/services/appcachingservice.service";
// import axios from "axios";
// import { CustomloadingPage } from "src/app/customloading/customloading.page";

// export class LoadStockListProcess {

//     private workload: any = {} as any;

//     // services
//     private apiService: ApiService;
//     private cashingService: AppcachingserviceService;
    
//     // parameters
//     private ownerUuid: string;
//     private filemanagerURL: string;

//     // properties
//     private lists: Array<any> = [];
//     private cashList: Array<{ name: string, file: string }> = [];
//     private firsttime: boolean = false;

//     constructor(
//         apiService: ApiService,
//         cashingService: AppcachingserviceService,
//     ) {
//         this.apiService = apiService;
//         this.cashingService = cashingService;
//     }

//     public Init(params: any): Promise<any> {
//         return new Promise<any> (async (resolve, reject) => {
//             try {
                
//                 console.log(`init stock list`, 1);

//                 // this.workload = this.apiService.load.create({ message: 'loading...' });
//                 // (await this.workload).present();

//                 console.log(`init stock list`, 2);
//                 this.InitParams(params);
  
//                 console.log(`init stock list`, 3);
//                 const ValidateParams = this.ValidateParams();
//                 if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

//                 console.log(`init stock list`, 4);
//                 const LoadProductList = await this.LoadProductList();
//                 if (LoadProductList != IENMessage.success) throw new Error(LoadProductList);

//                 console.log(`init stock list`, 5);
//                 const FindCashingServiceList = await this.FindCashingServiceList();
//                 if (FindCashingServiceList != IENMessage.success) throw new Error(FindCashingServiceList);
                
//                 console.log(`init stock list`, 6);
//                 this.ValidateClientLoad();

//                 console.log(`init stock list`, 7);
//                 const HttpReceiveImageAndSaveOnCashingService = await this.HttpReceiveImageAndSaveOnCashingService();
//                 if (HttpReceiveImageAndSaveOnCashingService != IENMessage.success) throw new Error(HttpReceiveImageAndSaveOnCashingService);

//                 console.log(`init stock list`, 8);
//                 const ReceiveImageAndSaveNewChangeOnCashingService = await this.ReceiveImageAndSaveNewChangeOnCashingService();
//                 if (ReceiveImageAndSaveNewChangeOnCashingService != IENMessage.success) throw new Error(ReceiveImageAndSaveNewChangeOnCashingService);

//                 console.log(`init stock list`, 9);

//                 resolve(this.Commit());

               


//             } catch (error) {
//                 resolve(error.message);                    
//             }
//         });
//     }

//     private InitParams(params: any): void {
//         this.lists = [];
//         this.firsttime = false;

//         this.ownerUuid = params.ownerUuid;
//         this.filemanagerURL = params.filemanagerURL;
//     }

//     private ValidateParams(): string {
//         if (!(this.ownerUuid && this.filemanagerURL)) return IENMessage.parametersEmpty;
//         return IENMessage.success;
//     }


//     private LoadProductList(): Promise<any> {
//         return new Promise<any> (async (resolve, reject) => {
//             try {

//                 this.apiService.loadVendingSale().subscribe(r => {
//                     const response: any = r;
//                     console.log(`response`, response);
//                     if (response.status != 1) return resolve(IENMessage.loadVendingSaleListFail);
//                     if (response.status == 1 && response.data.length == 0) return resolve(IENMessage.vendingSaleListEmpty);
//                     this.lists = response.data;
//                     this.lists.find(field => field.stock.imageurl = '');

//                     // let list = this.lists.map(item => { return { id: item.id, image: item.image } });
//                     // list = list.sort((a,b) => a.id-b.id);
//                     console.log(`lists`, this.lists);
//                     resolve(IENMessage.success);
//                 }, error => resolve(error.message));
                
//             } catch (error) {
//                 resolve(error.message);
//             }
//         });
//     }

//     private FindCashingServiceList(): Promise<any> {
//         return new Promise<any> (async (resolve, reject) => {
//             try {

//                 let run = await this.cashingService.get(this.ownerUuid);
//                 if (run == undefined || run == null) {
//                     this.cashList = [];
//                     await this.cashingService.set(this.ownerUuid, []);
//                     return resolve(IENMessage.success);
//                 }
//                 const parse = JSON.parse(run);
//                 this.cashList = parse.v;
//                 console.log(`cash list`, this.cashList);
//                 resolve(IENMessage.success);
                
//             } catch (error) {
//                 resolve(error.message);
//             }
//         });
//     }

//     private ValidateClientLoad() {
//         if ( this.cashList != undefined && Object.entries(this.cashList).length == 0){
//             this.firsttime = true;
//         }
//         console.log(`first time load`, this.firsttime);
//     }

//     private HttpReceiveImageAndSaveOnCashingService(): Promise<any> {
//         return new Promise<any> (async (resolve, reject) => {
//             try {
            
//                 if (this.firsttime == false) return resolve(IENMessage.success);
    
//                 let lists: Array<{ name: string, file: string}> = [];
//                 for(let i = 0; i < this.lists.length; i++) {
//                     const name = this.lists[i].stock.image;
//                     if (name != '' && name.substring(0,4) != 'data') {
                    
//                         const url = `${this.filemanagerURL}${name}`;
//                         const run = await axios({
//                             method: 'GET',
//                             url: url,
//                             responseType: 'blob'
//                         });
//                         let file = await this.apiService.convertBlobToBase64(run.data);
        
//                         const obj = {
//                             name: name,
//                             file: file,

//                         }
        
//                         const same = lists.filter(item => item.name == name);
//                         if (same != undefined && Object.entries(same).length == 0) {
//                             lists.push(obj);
//                         }
//                         this.lists[i].stock.imageurl = this.lists[i].stock.image;
//                         this.lists[i].stock.image = file;
                       
//                     }
//                     if (i == this.lists.length-1) {
//                         console.log(`first time save`, this.ownerUuid, this.lists, lists);
//                         await this.cashingService.set(this.ownerUuid, lists);
//                     }
//                 }
    
//                 resolve(IENMessage.success);
    
//             } catch (error) {
//                 resolve(error.message)
//             }
//         });
//     }

//     private ReceiveImageAndSaveNewChangeOnCashingService(): Promise<any> {
//         return new Promise<any> (async (resolve, reject) => {
//             try {

//                 if (this.firsttime == true) return resolve(IENMessage.success);

//                 this.lists.forEach((list,i) => {
//                     this.cashList.find((cash, cash_index) => {
//                         if (list.stock.image == cash.name) {
//                             list.stock.imageurl = cash.name;
//                             list.stock.image = cash.file;
//                         }
//                     });
//                 });

//                 const data = this.lists.filter(item => item.stock.image.substring(0,4) == 'data');
//                 const nodata = this.lists.filter(item => item.stock.image.substring(0,4) != 'data');

//                 if (nodata != undefined && nodata.length > 0)
//                 {
//                     for(let i = 0; i < nodata.length; i++) {
//                         const url = `${this.filemanagerURL}${nodata[i].stock.image}`;
//                         const run = await axios({
//                             method: 'GET',
//                             url: url,
//                             responseType: 'blob'
//                         });
//                         const file = await this.apiService.convertBlobToBase64(run.data);
    
//                         const obj = {
//                             name: nodata[i].stock.image,
//                             file: file
//                         }
    
//                         nodata[i].stock.imageurl = nodata[i].stock.image;
//                         nodata[i].stock.image = file;
//                         this.cashList.push(obj);
//                     }
//                     data.push(...nodata);
//                 }

//                 this.lists = data;
//                 await this.cashingService.set(this.ownerUuid, this.cashList);

//                 resolve(IENMessage.success);
                
//             } catch (error) {
//                 resolve(error.message);
//             }
//         });
//     }

//     private Commit(): any {
//         console.log(`commit list`, this.lists);
//         const response = {
//             data: [{
//                 lists: this.lists,
//                 cashList: this.cashList
//             }],
//             message: IENMessage.success
//         }

//         return response;
//     }

// }