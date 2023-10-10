import axios from "axios";
import { IENMessage } from "src/app/models/base.model";
import { ApiService } from "src/app/services/api.service";
import { AppcachingserviceService } from "src/app/services/appcachingservice.service";

export class LoadVendingMachineStockReportProcess {

    private workload: any = {} as any;

    // services
    private apiService: ApiService;
    
    // parameters
    private machineId: string;
    private fromDate: string;
    private toDate: string;
    private token: string;

    // properties
    private currentdate: number;
    private parsefromDate: number;
    private parseToDate: number;
    private count: number;
    private lists: Array<any> = [];
    private stacks: Array<any> = [];
    private qttys: Array<any> = [];

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

                this.CheckRefill();
                
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

        this.fromDate = params.fromDate;
        this.toDate = params.toDate;
        this.machineId = params.machineId;
        this.token = localStorage.getItem('lva_token');

    }

    private ValidateParams(): string {
        if (!(this.fromDate && this.toDate && this.token && this.machineId)) return IENMessage.parametersEmpty;
        
        const year = new Date().getFullYear();
        const month =  Number(new Date().getMonth() + 1) < 10 ? '0' + Number(new Date().getMonth() + 1) : Number(new Date().getMonth() + 1);
        const day = Number(new Date().getDate()) < 10 ? '0' + new Date().getDate() : new Date().getDate();
        const time = year + '-' + month + '-' + day;

        this.currentdate = new Date(time).getTime();
        this.parsefromDate = new Date(this.fromDate).getTime();
        this.parseToDate = new Date(this.toDate).getTime();

        if (this.parsefromDate == this.parseToDate) {
            if (this.parsefromDate > this.currentdate) return IENMessage.invalidFromDate;
        } else {
            if (this.parsefromDate > this.parseToDate) return IENMessage.invalidFromDate;
            if (this.parseToDate > this.currentdate) return IENMessage.invalidateToDate;
        }

        return IENMessage.success;
    }


    private LoadList(): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            try {

                const params = {
                    fromDate: this.fromDate,
                    toDate: this.toDate,
                    machineId: this.machineId,
                    token: this.token
                }

                this.apiService.loadVendingMachineStockReport(params).subscribe(r => {
                    const response: any = r;
                    if (response.status != 1) return resolve(IENMessage.loadListFail);
                    console.log(`data`, response.data);
                    this.lists = response.data.rows;
                    this.count = response.data.count;

                    resolve(IENMessage.success);
                }, error => resolve(error.message));
                
            } catch (error) {
                resolve(error.message);
            }
        });
    }

    private FetchOrder(): void {
        let times: Array<any> = this.lists.map(item => item.createdAt);
        const data: Array<any> = this.lists.map(item => item.data);

        let reports: Array<any> = [];
        for(let i = 0; i < data.length; i++) {
            for(let j = 0; j < data[i].length; j++) {
                // if (times[i].substring(0, 10) == date) {
                //   reports.push({ time: times[i], position: data[i][j].position, name: data[i][j].stock.name, price: data[i][j].stock.price, qtty: data[i][j].stock.qtty });
                // }
                reports.push({ time: times[i], position: data[i][j].position, name: data[i][j].stock.name, price: data[i][j].stock.price, qtty: data[i][j].stock.qtty, refill: false });
            }
            
        }
        console.log(`report`, reports);
        reports = reports.sort((a,b) => b.time-a.time);
        const unique = reports.filter((item, index) => {
        return reports.findIndex(obj => obj.position == item.position) == index;
        });
        const duplicate = reports.filter((item, index) => {
        return reports.findIndex(obj => obj.position == item.position) != index;
        });

        
        unique.filter((u_item, u_index) => {
            duplicate.filter((dup_item, dup_index) => {
                if (u_item.position == dup_item.position) {
                    const find = this.stacks.filter(find_item => find_item.position == dup_item.position);
                    if (find != undefined && Object.entries(find).length == 0) {
                        const model = {
                            name: u_item.name,
                            position: u_item.position,
                            detail: [u_item, dup_item]
                        }
                        this.stacks.push(model);
                    } else {
                        this.stacks.find((stack_item, stack_index) => {
                            if (stack_item.position == dup_item.position) {
                                
                                stack_item.detail.push(dup_item);
                                if (dup_item.qtty > stack_item.detail.qtty) stack_item.push(dup_index);
                            }
                        });
                    }
                }
            });
        });
        // for(let i = 0; i < this.stacks.length; i++) {
        //     this.stacks[i].detail.sort((a,b) => {
        //         return new Date(a.time).getTime()-new Date(b.time).getTime()
        //     });
        // }
        console.log(`-->`, this.stacks);
    }

    private CheckRefill() {
        for(let i = 0; i < this.stacks.length; i++) {
            for(let j = 0; j < this.stacks[i].detail.length; j++) {
              if (this.stacks[i].detail[j-1] == undefined && this.stacks[i].detail[j].qtty > this.stacks[i].detail[j+1].qtty) {
                console.log(`here 1`, this.stacks[i].detail[j]);

                this.stacks[i].detail[j].refill = true;
              }
      
              else if 
              (
                
                this.stacks[i].detail[j-1] != undefined && 
                this.stacks[i].detail[j+1] != undefined && 
      
                this.stacks[i].detail[j-1].qtty != this.stacks[i].detail[j].qtty &&
                this.stacks[i].detail[j-1].qtty < this.stacks[i].detail[j].qtty &&
                this.stacks[i].detail[j].qtty <= this.stacks[i].detail[j+1].qtty
                ||
                this.stacks[i].detail[j-1] != undefined && 
                this.stacks[i].detail[j+1] != undefined && 
      
                this.stacks[i].detail[j-1].qtty != this.stacks[i].detail[j].qtty &&
                this.stacks[i].detail[j-1].qtty < this.stacks[i].detail[j].qtty &&
                this.stacks[i].detail[j].qtty >= this.stacks[i].detail[j+1].qtty
              ) 
              {
                console.log(`here 2`, this.stacks[i].detail[j]);

                this.stacks[i].detail[j].refill = true;
              }
      
              else if 
              (
                this.stacks[i].detail[j-1] != undefined && 
                this.stacks[i].detail[j+1] == undefined && 
      
                this.stacks[i].detail[j-1].qtty != this.stacks[i].detail[j].qtty &&
                this.stacks[i].detail[j-1].qtty < this.stacks[i].detail[j].qtty
                ||
                this.stacks[i].detail[j-1] != undefined && 
                this.stacks[i].detail[j+1] == undefined && 
      
                this.stacks[i].detail[j-1].qtty != this.stacks[i].detail[j].qtty &&
                this.stacks[i].detail[j-1].qtty < this.stacks[i].detail[j].qtty
              ) 
              {
                console.log(`here 3`, this.stacks[i].detail[j]);

                this.stacks[i].detail[j].refill = true;
              }
      
            }
          }
    }

    private Commit(): any {

        const response = {
            data: [{
                count: this.count,
                stacks: this.stacks,
                lists: this.lists
            }],
            message: IENMessage.success
        }

        return response;
    }

}