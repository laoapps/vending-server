import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EMACHINE_COMMAND, IBillProcess, ISerialService } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { Tab1Page } from '../tab1/tab1.page';
import { IENMessage } from '../models/base.model';
import { Toast } from '@capacitor/toast';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-remainingbills',
  templateUrl: './remainingbills.page.html',
  styleUrls: ['./remainingbills.page.scss'],
})
export class RemainingbillsPage implements OnInit, OnDestroy {

  canclick: boolean = false;
  errorClick: number = 0;

  timer: any = {} as any;
  counter: number = localStorage.getItem('product_fall') ? Number(localStorage.getItem('product_fall')) : 0;
  counterLimit: number = localStorage.getItem('product_fall_limit') ? Number(localStorage.getItem('product_fall_limit')) : 10;
  private readonly RETRY_TIMEOUT_MS = 2000;
  private deliveryBills: DeliveryBills[] = []; // Replace `this.r` with typed property
  private readonly SUPPORTED_DEVICES = ['VMC', 'ZDM8', 'MT102', 'adh814'];
  @Input() r = new Array<IBillProcess>();
  @Input() serial: ISerialService;
  url = this.apiService.url;
  lists: Array<any> = [];
  constructor(public apiService: ApiService, private modal: ModalController) {

  }


  async loadBillLocal() {
    try {
      const data = await this.apiService.IndexedDB.getBillProcesses();
      console.log('data loadBillLocal', data);
      if (data.length > 0) {
        this.apiService.isDropStock = true;
      } else {
        this.apiService.isDropStock = false;
      }
      this.r = data;

    } catch (error) {
      console.log('Error loadBillLocal', error);
    }
  }

  async ngOnInit() {
    try {
      await this.loadBillLocal();
      this.loadAutoFall();
      console.log('R', this.r);
      console.log(`here`);
      await this.apiService.soundPleaseSelect();
    } catch (error) {
      this.loadAutoFall();
    }


  }

  loadAutoFall() {
    console.log(`counter`, this.counter, `counterLimit`, this.counterLimit);
    if (this.r != undefined && Object.entries(this.r).length > 0) {
      if (this.counter > this.counterLimit || this.counter < this.counterLimit) {
        this.counter = this.counterLimit;
        this.canclick = true;
      }
      console.log(`init can click`, this.canclick);
      localStorage.setItem('product_fall', this.counter.toString());

      this.timer = setInterval(() => {
        this.counter--;
        localStorage.setItem('product_fall', this.counter.toString());
        if (this.counter == 0) {
          if (this.r != undefined && Object.entries(this.r).length == 1) {
            this.canclick = true;
            this.autoRetryProcessBill();
            clearInterval(this.timer);
          }
          else {
            this.canclick = true;
            this.autoRetryProcessBill();
            this.counter = this.counterLimit;
          }
        }
        else if (this.counter > 3 && this.counter < this.counterLimit) {
          this.canclick = true;
          console.log(`can click der`, this.canclick);
        }
        else {
          this.canclick = false;
          console.log(`can not click der`, this.canclick);
        }
        console.log(this.counter);
      }, 1000);

    }
  }
  async autoRetryProcessBill() {
    const transactionID: string = String(this.r[this.r.length - 1].transactionID);
    const position = this.r[this.r.length - 1].position;

    const ownerUuid = this.r[this.r.length - 1].ownerUuid
    const transID = this.r[this.r.length - 1].bill.transactionID;

    console.log(`autoRetryProcessBill transactionID`, transactionID, `position`, position, `ownerUuid`, ownerUuid, `trandID`, transID);


    this.retryProcessBillNew({ transactionID, position, ownerUuid, transID: transID + '' });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
  findImage(id: number) {
    return ApiService.vendingOnSale.find(vy => vy.stock.id == id)?.stock?.image;
  }
  findPrice(id: number) {
    return ApiService.vendingOnSale.find(vy => vy.stock.id == id)?.stock?.price;
  }
  // local



  processing: boolean = false;

  async retryProcessBillNew(params: BillProcessParams): Promise<void> {
    const { transactionID, position, ownerUuid, transID, human = false } = params;

    if (this.processing) {
      console.warn('Process already running');
      return;
    }

    this.processing = true;

    try {
      if (human) {
        this.clearTimer();
      }

      if (!this.serial) {
        throw new Error('Serial device not initialized');
      }

      if (!this.SUPPORTED_DEVICES.includes(localStorage.getItem('device') || 'VMC')) {
        throw new Error('Unsupported device protocol');
      }
      await this.handleBillDeletion(transactionID);
      await this.handleSerialCommand(transactionID, position, transID);
      await this.handleRetryAndUpdate(transactionID, position, ownerUuid, transID, human);
      await this.reconfirmStock([{ transactionID, position }]);
    } catch (error) {
      await this.handleError(error, transactionID, position, ownerUuid, transID);
    } finally {
      this.processing = false;
    }
  }

  private async handleSerialCommand(transactionID: string, position: number, transID: string): Promise<void> {
    const param = { slot: position, dropSensor: 1 };
    try {
      await this.serial!.command(EMACHINE_COMMAND.shippingcontrol, param, 1);
      await this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Clicked slot ${position}, dropped transactionID ${transactionID}, transID ${transID}`,
      });
    } catch (error) {
      await this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Error in shippingcontrol: ${JSON.stringify(error)}`,
      });
      throw error;
    }
  }

  private async handleBillDeletion(transactionID: string): Promise<void> {
    try {
      await this.apiService.IndexedDB.deleteBillProcess(Number(transactionID));
      await this.loadBillLocal();
    } catch (error) {
      await this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Error deleting bill process: ${JSON.stringify(error)}`,
      });
      throw error;
    }
  }

  private async handleRetryAndUpdate(
    transactionID: string,
    position: number,
    ownerUuid: string,
    transID: string,
    human: boolean
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.RETRY_TIMEOUT_MS));
    try {
      const response = await this.apiService.retryProcessBillNew(transactionID, position, ownerUuid, transID);
      console.log('Retry result:', response.data);

      const deliveryBills = await this.apiService.loadDeliveryingBillsNew();
      this.deliveryBills = deliveryBills;

      if (deliveryBills.length === 0) {
        localStorage.setItem('product_fall', '0');
        this.clearTimer();
        this.modal.dismiss();
        return;
      }

      if (human) {
        this.loadAutoFall();
      }

      await this.apiService.soundThankYou();
    } catch (error) {
      await this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Error retrying bill process: ${JSON.stringify(error)}`,
      });
      throw error;
    }
  }

  private async handleError(
    error: unknown,
    transactionID: string,
    position: number,
    ownerUuid: string,
    transID: string
  ): Promise<void> {
    await this.apiService.IndexedLogDB.addBillProcess({
      errorData: `Error in retryProcessBillNew: ${JSON.stringify(error)}`,
    });

    if (error instanceof Error && error.message === 'Serial device not initialized') {
      await this.apiService.soundSystemError();
      await this.apiService.reloadPage();
      await App.exitApp();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, this.RETRY_TIMEOUT_MS));
    await this.retryProcessBillNew({ transactionID, position, ownerUuid, transID });
  }

  private async reconfirmStock(bills: { transactionID: string; position: number }[]): Promise<void> {
    try {
      await this.apiService.reconfirmStockNew(bills);
    } catch (error) {
      await this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Error reconfirming stock: ${JSON.stringify(error)}`,
      });
    }
  }

  async retryProcessBill(transactionID: string, position: number, human?: boolean) {

    console.log(`rrrrr`, this.r);
    console.log(`-->`, this.canclick);
    // this.apiService.IndexedDB.deleteBillProcess(Number(transactionID));

    if (this.canclick == true) {
      // this.apiService.showLoading(null, 30000);
      const isRemote = localStorage.getItem('remoteProcess');
      if (!isRemote) {
        this.apiService.retryProcessBill(transactionID, position).then(async rx => {
          const r = rx.data;
          console.log(`vending on sale`, ApiService.vendingOnSale);
          console.log('retryProcessBill', r);
          if (r.status) {
            this.apiService.soundThankYou()
            this.apiService.toast.create({ message: r.message, duration: 3000 }).then(r => {
              r.present();
            });
            let count: number = 0;
            console.log(`lleng`, this.r);
            if (this.r != undefined && Object.entries(this.r).length > 1) {
              count = this.r.length - 1;
            } else {
              count = 0;
            }

            const i = this.r.findIndex(v => v.position == position);
            this.r.splice(i, 1);

            if (count == 0) {
              this.apiService, this.modal.dismiss();
            }
            // this.apiService.modal.dismiss();
            // this.apiService.myTab1.reshowBills(count);
          } else {
            await this.apiService.soundSystemError();
          }
          this.apiService.simpleMessage(r.message);
          setTimeout(() => {
            // this.apiService.dismissLoading();
          }, 3000)
        })
      }
      else {
        if (human == true) {
          this.clearTimer();
        }

        try {
          this.apiService.retryProcessBill(transactionID, position).then(async rx => {
            const r = rx.data;
            // this.apiService.dismissLoading();
            console.log(`vending on sale`, ApiService.vendingOnSale);
            console.log('retryProcessBill', r);
            if (r.status) {
              this.apiService.soundThankYou()
              this.apiService.toast.create({ message: r.message, duration: 3000 }).then(r => {
                r.present();
              });
              try {

                this.apiService.loadDeliveryingBillsNew().then(async reload_ticket => {

                  // if (reload_ticket.status != 1) {
                  //   this.cancelTimer();
                  //   await this.apiService.soundSystemError();
                  //   return;
                  // }

                  this.r = reload_ticket;
                  console.log(`=====>here der`, this.r);

                  if (this.r != undefined && Object.entries(this.r).length == 0) {
                    localStorage.setItem('product_fall', '0');
                    this.clearTimer();
                    this.apiService, this.modal.dismiss();
                    return;
                  }

                  if (human == true) {
                    this.loadAutoFall();
                  }

                });
              } catch (error) {
                console.log(`error eiei`, error.message);
                this.cancelTimer();
                await this.apiService.soundSystemError();
              }

            } else {
              this.counter = 0;
              this.canclick = true;
              localStorage.setItem('product_fall', '0');
              this.clearTimer();
              this.r = [];
              this.reloadDelivery(true);
              await this.apiService.soundSystemError();
            }


            this.apiService.simpleMessage(r.message);

            setTimeout(() => {
              // this.apiService.dismissLoading();
            }, 3000)

          });
        } catch (error) {
          setTimeout(() => {
            // this.apiService.dismissLoading();
          }, 3000)
          this.clearTimer();
          this.r = [];
          this.reloadDelivery(true);
          await this.apiService.soundSystemError();
        }
      }



      // if (this.counter == this.counterLimit) {
      //   this.timer = setInterval(() => {
      //     this.counter--;
      //     localStorage.setItem('product_fall', this.counter.toString());
      //     if (this.counter <= 0) {
      //       clearInterval(this.timer);
      //       this.canclick = true;
      //       localStorage.setItem('product_fall', '0');
      //     }
      //   }, 1000);
      // }



      // if (this.counter == 0) {

      //   localStorage.setItem('product_fall', this.counterLimit.toString());
      //   this.counter = this.counterLimit;


      //   this.canclick = false;


      //   if (this.counter >= 4) {
      //     this.apiService.retryProcessBill(transactionID,position).subscribe(async r=>{
      //       // this.apiService.dismissLoading();
      //       console.log(`vending on sale`, ApiService.vendingOnSale);
      //       console.log('retryProcessBill',r);
      //       if(r.status){
      //         this.apiService.soundThankYou()
      //         this.apiService.toast.create({message:r.message,duration:3000}).then(r=>{
      //           r.present();
      //         });

      //         this.apiService.loadDeliveryingBills().subscribe(async reload_ticket => {
      //           if (reload_ticket.status != 1) {
      //             this.cancelTimer();
      //             await this.apiService.soundSystemError();
      //             return;
      //           }

      //           this.r = reload_ticket.data;
      //           console.log(`here der`, this.r);

      //           if (this.r != undefined && Object.entries(this.r).length == 0) {
      //             localStorage.setItem('product_fall', '0');
      //             this.clearTimer();
      //             this.apiService,this.modal.dismiss();
      //             return;
      //           }

      //         }, async error => {
      //           this.cancelTimer();
      //           await this.apiService.soundSystemError();
      //         });

      //       } else{
      //         this.counter = 0;
      //         this.canclick = true;
      //         localStorage.setItem('product_fall', '0');
      //         this.clearTimer();
      //         await this.apiService.soundSystemError();
      //       }


      //       this.apiService.simpleMessage(r.message);

      //       setTimeout(()=>{
      //         this.apiService.dismissLoading();
      //       },3000)

      //     }, async error => {
      //       setTimeout(()=>{
      //         this.apiService.dismissLoading();
      //       },3000)
      //       this.clearTimer();
      //       await this.apiService.soundSystemError();
      //     }); 
      //   }
      //   else 
      //   {
      //     this.canclick = false;
      //   }

      // }
    }
  }
  // remote
  // retryProcessBill(transactionID:string,position:number){
  //   if (this.canclick == true) {
  //     this.apiService.showLoading('',30000);
  //     this.apiService.retryProcessBill(transactionID,position).subscribe(async r=>{
  //       console.log(`vending on sale`, ApiService.vendingOnSale);
  //       console.log('retryProcessBill',r);
  //       if(r.status){
  //         this.apiService.soundThankYou()
  //         this.apiService.toast.create({message:r.message,duration:3000}).then(r=>{
  //           r.present();
  //         });
  //         let count: number = 0;
  //         console.log(`lleng`, this.r);
  //         if (this.r != undefined && Object.entries(this.r).length > 1) {
  //           count = this.r.length - 1;
  //         } else {
  //           count = 0;
  //         }
  //         const i=this.r.findIndex(v=>v.position==position);
  //         this.r.splice(i,1);

  //         if (this.r != undefined && this.r.length == 0) {
  //           this.apiService,this.modal.dismiss();
  //         }
  //         // this.apiService.modal.dismiss();
  //         // this.apiService.myTab1.reshowBills(count);
  //       } else{
  //         await this.apiService.soundSystemError();
  //       }
  //       this.apiService.simpleMessage(r.message);
  //       setTimeout(()=>{
  //         this.apiService.dismissLoading();
  //       },3000)

  //     }); 
  //   }
  // }

  // reloadDelivery(human: boolean) {
  //   this.apiService.loadDeliveryingBillsNew().subscribe(async reload_ticket => {

  //     if (reload_ticket.status != 1) {
  //       this.cancelTimer();
  //       await this.apiService.soundSystemError();
  //       return;
  //     }

  //     this.r = reload_ticket.data;
  //     console.log(`=====>here der`, this.r);

  //     if (this.r != undefined && Object.entries(this.r).length == 0) {
  //       localStorage.setItem('product_fall', '0');
  //       this.clearTimer();
  //       this.apiService, this.modal.dismiss();
  //       return;
  //     }

  //     if (human == true) {
  //       this.loadAutoFall();
  //     }

  //   }, async error => {
  //     this.cancelTimer();

  //     await this.apiService.soundSystemError();
  //   });
  // }

  reloadDelivery(human: boolean) {
    this.apiService.loadDeliveryingBillsNew().then(async reload_ticket => {
      // if (reload_ticket.status != 1) {
      //   this.cancelTimer();
      //   await this.apiService.soundSystemError();
      //   return;
      // }

      this.r = reload_ticket;
      console.log(`=====>here der`, this.r);

      if (this.r != undefined && Object.entries(this.r).length == 0) {
        localStorage.setItem('product_fall', '0');
        this.clearTimer();
        this.apiService, this.modal.dismiss();
        return;
      }

      if (human == true) {
        this.loadAutoFall();
      }
    }).catch(async error => {
      this.cancelTimer();

      await this.apiService.soundSystemError();
    });
  }

  getPrice() {
    return this.r.find(item => item)
  }
  getStock(position: number) {
    return this.r.map(v => v.bill.vendingsales)[0].find(v => v.position == position)?.stock;
  }
  closeToolTip() {
    (document.querySelector('.tooltip-background') as HTMLDivElement).classList.remove('active');
    (document.querySelector('.hand-click') as HTMLDivElement).classList.remove('active');

    if (this.counter > 3 && this.counter < this.counterLimit) {
      this.canclick = true;
    }
  }

  close() {
    if (this.r != undefined && Object.entries(this.r).length > 0) return;
    this.clearTimer();
    this.apiService.modal.dismiss();
  }
  clearTimer() {
    clearInterval(this.timer);
  }
  cancelTimer() {
    this.counter = 0;
    this.canclick = true;
    localStorage.setItem('product_fall', '0');
    this.clearTimer();
  }
  reload() {
    // this.apiService.reloadPage();
  }

}
interface BillProcessParams {
  transactionID: string;
  position: number;
  ownerUuid: string;
  transID: string; // Renamed from trandID for clarity
  human?: boolean;
}

interface DeliveryBills {
  // Define structure of delivery bills
  [key: string]: any; // Replace with specific type
}
