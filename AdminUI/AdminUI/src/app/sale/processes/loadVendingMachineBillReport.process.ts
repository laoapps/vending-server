import axios from "axios";
import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { AppcachingserviceService } from "src/app/services/appcachingservice.service";

export class LoadVendingMachineSaleBillReportProcess {

    private workload: any = {} as any;

    // services
    private apiService: ApiService;
    
    // parameters
    private beginDate: string;
    private revertDate: string;
    private token: string;

    // properties
    private currentdate: number;
    private parseBeginDate: number;
    private parseRevertDate: number;
    private count: number;
    private lists: Array<any> = [];
    private saleDetailList: Array<any> = [];
    private saleSumerizeList: Array<any> = [];
    private uniqueorder: Array<any> = [];
    private duplicateorder: Array<any> = [];

    constructor(
        apiService: ApiService
    ) {
        this.apiService = apiService;
    }

    public Init(params: any): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {
                


                console.log(`load vending machine bill report`, 1);

                this.workload = this.apiService.load.create({ message: 'loading...' });
                (await this.workload).present();

                console.log(`load vending machine bill report`, 2);

                this.InitParams(params);
  
                console.log(`load vending machine bill report`, 3);

                const ValidateParams = this.ValidateParams();
                if (ValidateParams != IENMessage.success) throw new Error(ValidateParams);

                console.log(`load vending machine bill report`, 4);

                const LoadList = await this.LoadList();
                if (LoadList != IENMessage.success) throw new Error(LoadList);

                console.log(`load vending machine bill report`, 5);

                this.FetchOrder();
                
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
        this.saleDetailList = [];
        this.saleSumerizeList = [];
        this.uniqueorder = [];
        this.duplicateorder = [];

        this.beginDate = params.beginDate;
        this.revertDate = params.revertDate;
        this.token = localStorage.getItem('lva_token');

    }

    private ValidateParams(): string {
        if (!(this.beginDate && this.revertDate && this.token)) return IENMessage.parametersEmpty;
        
        // this.beginDate = this.beginDate.replace('/', '-');
        const year = new Date().getFullYear();
        const month =  Number(new Date().getMonth() + 1) > 9 ?  Number(new Date().getMonth() + 1) : '0' +  Number(new Date().getMonth() + 1);
        const day = new Date().getDate();
        const time = year + '-' + month + '-' + day;

        this.currentdate = new Date(time).getTime();
        this.parseBeginDate = new Date(this.beginDate).getTime();
        this.parseRevertDate = new Date(this.revertDate).getTime();

        if (this.parseBeginDate > this.currentdate) return IENMessage.invalidBeginDate;
        if (this.parseBeginDate < this.parseRevertDate) return IENMessage.invalidateRevertDate;
        
        return IENMessage.success;
    }


    private LoadList(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    beginDate: this.beginDate,
                    revertDate: this.revertDate,
                    token: this.token
                }

                this.apiService.loadVendingMachineSaleBillReport(params).subscribe(r => {
                    const response: any = r;
                    if (response.status != 1) return resolve(IENMessage.loadListFail);
                    console.log(`data`, response.data);
                    this.lists = response.data.rows;
                    this.count = response.data.count;

                    const list = JSON.parse(JSON.stringify(this.lists));
                    const stock = list.map(obj => obj.vendingsales.map(item => { return { time: item.updatedAt, stock: item.stock } }));
                    console.log(`stock`, stock);
                    stock.find(item => {
                        this.saleDetailList.push(...item);
                    });
                    console.log(`merge`, this.saleDetailList);

                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FetchOrder(): void {
        let allsale: Array<any> = [];
        let cloneSaleDetailList: Array<any> = JSON.parse(JSON.stringify(this.saleDetailList));
        allsale = cloneSaleDetailList.map(item => item.stock);
        console.log(`allsale`, allsale);

        this.uniqueorder = allsale.filter((obj, index) => 
            allsale.findIndex(item => item.id == obj.id) == index
        );
        this.duplicateorder = allsale.filter((obj, index) => 
            allsale.findIndex(item => item.id == obj.id) != index
        );

        if (this.duplicateorder != undefined && Object.entries(this.duplicateorder).length > 0) {
            for(let i = 0; i < this.uniqueorder.length; i++) {
                this.uniqueorder[i].total = 0;

                for(let j = 0; j < this.duplicateorder.length; j++) {
                    if (this.uniqueorder[i].id == this.duplicateorder[j].id) {
                        this.uniqueorder[i].qtty += this.duplicateorder[j].qtty;
                    }
                }
                this.uniqueorder[i].total = this.uniqueorder[i].qtty * this.uniqueorder[i].price;
            }
        }

        this.saleSumerizeList = this.uniqueorder;
        console.log(`sumerize`, this.saleSumerizeList);
    }


    private Commit(): any {
        const response = {
            data: [{
                count: this.count,
                lists: this.lists,
                saleDetailList: this.saleDetailList,
                saleSumerizeList: this.saleSumerizeList
            }],
            message: IENMessage.success
        }

        return response;
    }

}