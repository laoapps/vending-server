import { Component, Input, OnInit } from '@angular/core';
import { EMACHINE_COMMAND, IBillProcess, IBillProcessLocal, ISerialService } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { ModalController } from '@ionic/angular';
import { Toast } from '@capacitor/toast';

@Component({
  selector: 'app-remainingbilllocal',
  templateUrl: './remainingbilllocal.page.html',
  styleUrls: ['./remainingbilllocal.page.scss'],
})
export class RemainingbilllocalPage implements OnInit {


  canclick: boolean = false;
  errorClick: number = 0;

  timer: any = {} as any;
  counter: number = localStorage.getItem('product_fall') ? Number(localStorage.getItem('product_fall')) : 0;
  counterLimit: number = localStorage.getItem('product_fall_limit') ? Number(localStorage.getItem('product_fall_limit')) : 10;

  @Input() r = new Array<IBillProcessLocal>();
  @Input() serial: ISerialService;
  url = this.apiService.url;
  lists: Array<any> = [];


  constructor(public apiService: ApiService, private modal: ModalController) {

  }


  async loadBillLocal() {
    try {
      const data = await this.apiService.IndexeLocaldDB.getBillProcesses();
      console.log('data loadBillLocal', data);
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
    this.retryProcessBillNew(transactionID, position);
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




  async retryProcessBillNew(transactionID: string, position: number, human?: boolean) {
    console.log('transactionID', transactionID, 'position', position);
    this.apiService.showLoading('waiting...', 5000);

    console.log(`rrrrr`, this.r);
    console.log(`-->`, this.canclick);

    if (human == true) {
      this.clearTimer();
    }

    try {
      if (this.serial) {
        const dropSensor = Number(localStorage.getItem('dropSensor') + '' || '1') || 1;

        const param = { slot: position, dropSensor: dropSensor };

        this.serial.command(EMACHINE_COMMAND.shippingcontrol, param, 1).then(async (r) => {
          console.log('shippingcontrol', r);


          this.apiService.soundThankYou()
          // this.apiService.toast.create({ message: r.message, duration: 3000 }).then(r => {
          //   r.present();
          // });
          try {
            this.apiService.IndexeLocaldDB.deleteBillProcess(Number(transactionID));
            await this.loadBillLocal();
            this.apiService.reconfirmStockNew([{ transactionID: transactionID, position: position }]);
            this.apiService.loadDeliveryingBillsLocal().then(async reload_ticket => {
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

            });
          } catch (error) {
            console.log(`error eiei`, error.message);
            this.cancelTimer();
            await this.apiService.soundSystemError();
          }



        }).catch(async (error) => {
          console.log('error shippingcontrol', error);
        });

      } else {
        console.log('serial not init');
        Toast.show({ text: 'serial not init for drop' })
        await this.apiService.myTab1.connect();
      }

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


  reloadDelivery(human: boolean) {
    this.apiService.loadDeliveryingBillsLocal().then(async reload_ticket => {
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
  // getStock(position: number) {
  //   return this.r.map(v => v.stock)[0].find(v => v.position == position)?.stock;
  // }
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
