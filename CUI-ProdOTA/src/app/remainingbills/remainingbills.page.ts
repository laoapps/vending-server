import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EMACHINE_COMMAND, IBillProcess, ISerialService } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { Tab1Page } from '../tab1/tab1.page';
import { IENMessage } from '../models/base.model';
import { Toast } from '@capacitor/toast';

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
    await this.loadBillLocal();
    console.log('R', this.r);
    console.log(`here`);
    await this.apiService.soundPleaseSelect();


    this.loadAutoFall();
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
    const trandID = this.r[this.r.length - 1].bill.transactionID;

    console.log(`autoRetryProcessBill transactionID`, transactionID, `position`, position, `ownerUuid`, ownerUuid, `trandID`, trandID);


    this.retryProcessBillNew(transactionID, position, ownerUuid, trandID + '');
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




  async retryProcessBillNew(transactionID: string, position: number, ownerUuid: string, trandID: string, human?: boolean) {
    console.log('transactionID', transactionID, 'position', position, 'ownerUuid', ownerUuid, 'trandID', trandID);

    console.log(`rrrrr`, this.r);
    console.log(`-->`, this.canclick);
    this.apiService.showLoading('waiting...', 5000);

    if (human == true) {
      this.clearTimer();
    }

    try {
      if (this.serial) {
        const dropSensor = Number(localStorage.getItem('dropSensor') + '' || '1') || 1;
        const param = { slot: position, dropSensor };
        const device = localStorage.getItem('device') || 'VMC';
        if (device == 'VMC' || device == 'ZDM8' || device == 'MT102' || device == 'adh814') {
          this.apiService.IndexedDB.deleteBillProcess(Number(transactionID)).then(async () => {
            await this.loadBillLocal();

            this.serial.command(EMACHINE_COMMAND.shippingcontrol, param, 1).then(async (r) => {
              console.log('shippingcontrol');

            }).catch(async (error) => {
              console.log('error shippingcontrol', error);
              this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error shippingcontrol :${JSON.stringify(error)}` });
            });

            this.apiService.reconfirmStockNew([{ transactionID: transactionID, position: position }]);

            setTimeout(() => {
              this.apiService.retryProcessBillNew(transactionID, position, ownerUuid, trandID).subscribe(async r => {
                // this.apiService.dismissLoading();
                console.log(`vending on sale`, ApiService.vendingOnSale);
                console.log('retryProcessBill', r);

              }, (error) => {
                this.apiService.IndexedLogDB.addBillProcess({ errorData: `error retryProcessBillNew :${JSON.stringify(error)}` });
              });
            }, 2000);

            this.apiService.soundThankYou();

            this.apiService.loadDeliveryingBillsNew().then(async reload_ticket => {
              console.log('reload_ticket', reload_ticket);

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
            })
          }).catch((error) => {
            console.log('Error deleteBillProcess', error);
            this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error deleteBillProcess :${JSON.stringify(error)}` });
            this.loadBillLocal();
          });

        } else {
          this.apiService.IndexedLogDB.addBillProcess({ errorData: 'Protocol has not been implemented yet!!!!' });
          Toast.show({ text: 'Protocol has not been implemented yet!!!!', duration: 'long' });
        }
      } else {
        console.log('serial not init');
        this.apiService.IndexedLogDB.addBillProcess({ errorData: `serial not init` });
        Toast.show({ text: 'serial not init for drop' })
        // await this.apiService.myTab1.connect();
        // this.apiService.reloadPage();
      }

    } catch (error) {
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error retryProcessBillNew :${JSON.stringify(error)}` });
      setTimeout(() => {
        this.apiService.dismissLoading();
      }, 3000)
      this.clearTimer();
      this.r = [];
      this.reloadDelivery(true);
      await this.apiService.soundSystemError();
    }

    // if (this.canclick == true) {
    //   this.apiService.showLoading('', 3000);


    //   this.apiService.reconfirmStockNew([{ transactionID: transactionID, position: position }]);


    //   this.apiService.retryProcessBillNew(transactionID, position, ownerUuid, trandID).subscribe(async r => {
    //     console.log(`vending on sale`, ApiService.vendingOnSale);
    //     console.log('retryProcessBill', r);
    //     if (r.status) {
    //       this.apiService.soundThankYou()
    //       this.apiService.toast.create({ message: r.message, duration: 3000 }).then(r => {
    //         r.present();
    //       });
    //       let count: number = 0;
    //       console.log(`lleng`, this.r);
    //       if (this.r != undefined && Object.entries(this.r).length > 1) {
    //         count = this.r.length - 1;
    //       } else {
    //         count = 0;
    //       }

    //       const i = this.r.findIndex(v => v.position == position);
    //       this.r.splice(i, 1);
    //       this.apiService.IndexedDB.deleteBillProcess(Number(transactionID));


    //       if (count == 0) {
    //         this.apiService, this.modal.dismiss();
    //       }
    //     } else {
    //       await this.apiService.soundSystemError();
    //     }
    //     this.apiService.simpleMessage(r.message);
    //     setTimeout(() => {
    //       this.apiService.dismissLoading();
    //     }, 3000)
    //   })
    // }
  }

  async retryProcessBill(transactionID: string, position: number, human?: boolean) {

    console.log(`rrrrr`, this.r);
    console.log(`-->`, this.canclick);
    // this.apiService.IndexedDB.deleteBillProcess(Number(transactionID));

    if (this.canclick == true) {
      this.apiService.showLoading('', 30000);
      const isRemote = localStorage.getItem('remoteProcess');
      if (!isRemote) {
        this.apiService.retryProcessBill(transactionID, position).subscribe(async r => {
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
            this.apiService.dismissLoading();
          }, 3000)
        })
      }
      else {
        if (human == true) {
          this.clearTimer();
        }

        try {
          this.apiService.retryProcessBill(transactionID, position).subscribe(async r => {
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
              this.apiService.dismissLoading();
            }, 3000)

          });
        } catch (error) {
          setTimeout(() => {
            this.apiService.dismissLoading();
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
    this.apiService.reloadPage();
  }

}
