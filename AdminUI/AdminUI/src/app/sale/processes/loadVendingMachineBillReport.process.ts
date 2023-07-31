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
    private lists: Array<any> = [];

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

        this.beginDate = params.beginDate;
        this.revertDate = params.revertDate;
        this.token = localStorage.getItem('lva_token');

        console.log(`->`, this.beginDate, `->`, this.revertDate, `->`, this.token)
    }

    private ValidateParams(): string {
        if (!(this.beginDate && this.revertDate && this.token)) return IENMessage.parametersEmpty;

        this.currentdate = new Date(new Date().getFullYear() + '/' + Number(new Date().getMonth() + 1) + '/' + new Date().getDate()).getTime();

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
                    this.lists = response.data;
                    console.log(`lists`, this.lists);
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
                lists: this.lists
            }],
            message: IENMessage.success
        }

        return response;
    }

}