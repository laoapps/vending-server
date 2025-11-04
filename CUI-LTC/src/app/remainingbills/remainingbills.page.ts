import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EMACHINE_COMMAND, IBillProcess, IDropPositionData, ISerialService } from '../services/syste.model';
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


  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  videos: string[] = [
    '../../assets/videos/promotion.mp4'
  ];

  banner = '../../assets/topup/bannertopup.jpeg';
  _style = {
    'background-image': 'url(' + this.banner + ')',
    'background-size': 'contain', // or '50%', 'auto 80%', etc.
    'background-position': 'center',
    // 'filter': 'blur(5px)'
    // 'background-repeat': 'no-repeat' // Add this to prevent tiling
  }

  currentIndex = 0;

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
      // console.log('R', this.r);
      // console.log(`here`);
      await this.apiService.soundPleaseSelect();
    } catch (error) {
      this.loadAutoFall();
    }

  }


  ngAfterViewInit() {
    const player = this.videoPlayer?.nativeElement;

    // set first video
    player.src = this.videos[this.currentIndex];
    player.play();

    // when one video ends, play the next
    player.onended = () => {
      this.currentIndex = (this.currentIndex + 1) % this.videos.length;
      player.src = this.videos[this.currentIndex];
      player.play();
    };
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

    // console.log(`autoRetryProcessBill transactionID`, transactionID, `position`, position, `ownerUuid`, ownerUuid, `trandID`, transID);


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



  // processing: boolean = false;

  async retryProcessBillNew(params: BillProcessParams): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let err = null;
      const { transactionID, position, ownerUuid, transID, human = false } = params;
      let reloadTimer: NodeJS.Timeout | null = null;
      try {
        // if (this.processing) {
        //   console.warn('Process already running');
        //   throw new Error('Process already running');
        // }
        // this.processing = true;
        reloadTimer = setTimeout(() => {
          this.apiService.reloadPage();
        }, 20000);
        if (human) {
          this.clearTimer();
        }

        if (!this.serial) {

          return reject(new Error('Serial device not initialized'));
        }

        if (!this.SUPPORTED_DEVICES.includes(localStorage.getItem('device') || 'VMC')) {

          return reject(new Error('Unsupported device protocol'));
        }
        const dropPositionData: IDropPositionData = {
          ownerUuid: ownerUuid,
          transactionID: transID,
          position: position
        };

        await this.handleBillDeletion(transactionID);
        Toast.show({ text: 'handleBillDeletion', duration: 'short' })
        await this.handleSerialCommand(transactionID, position, transID);
        Toast.show({ text: 'handleSerialCommand', duration: 'short' })
        this.reconfirmStockAndDrop([{ transactionID, position }], dropPositionData);
        Toast.show({ text: 'reconfirmStockAndDrop', duration: 'short' })
        this.handleRetryAndUpdate(human);
        Toast.show({ text: 'handleRetryAndUpdate', duration: 'short' })

      } catch (error) {
        err = await this.handleError(error, transactionID, position, ownerUuid, transID);
        // this.processing = false;

      } finally {
        // this.processing = false;
        if (reloadTimer) {
          clearTimeout(reloadTimer);
        }

        if (err) {
          Toast.show({ text: 'Error: ' + JSON.stringify(err), duration: 'long' });
          reject(err);
        } else
          resolve();

      }
    });


  }

  private async handleSerialCommand(transactionID: string, position: number, transID: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const param = { slot: position, dropSensor: 1 };
      try {
        await this.serial.command(EMACHINE_COMMAND.shippingcontrol, param, 1);
        await this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Clicked slot ${position}, dropped transactionID ${transactionID}, transID ${transID}`,
        });
        resolve();
      } catch (error) {
        await this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Error in shippingcontrol: ${JSON.stringify(error)}`,
        });
        reject(error);
      }
    });


  }

  private async handleBillDeletion(transactionID: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.apiService.IndexedDB.deleteBillProcess(Number(transactionID));
        await this.loadBillLocal();
        resolve();
      } catch (error) {
        await this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Error deleting bill process: ${JSON.stringify(error)}`,
        });
        reject(error);
      }
    });


  }

  private async handleRetryAndUpdate(

    human: boolean
  ): Promise<void> {
    // await new Promise((resolve) => setTimeout(resolve, this.RETRY_TIMEOUT_MS));
    return new Promise(async (resolve, reject) => {
      try {
        const deliveryBills = await this.apiService.loadDeliveryingBillsNew();
        this.deliveryBills = deliveryBills;

        if (deliveryBills.length === 0) {
          this.apiService.pb = [];
          localStorage.setItem('product_fall', '0');
          this.clearTimer();
          this.modal.dismiss();
          Toast.show({ text: 'All bills processed 0', duration: 'short' });
          return resolve();
        }

        if (human) {
          this.loadAutoFall();
        }

        await this.apiService.soundThankYou();
        resolve();
      } catch (error) {
        await this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Error retrying bill process: ${JSON.stringify(error)}`,
        });
        reject(error);
      }
    });


  }

  private async handleError(
    error: unknown,
    transactionID: string,
    position: number,
    ownerUuid: string,
    transID: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Error in retryProcessBillNew: ${JSON.stringify(error)}`,
      });

      if (error instanceof Error && error.message === 'Serial device not initialized') {
        await this.apiService.soundSystemError();
        await this.apiService.reloadPage();
        this.apiService.exitApp();
        reject(new Error('Serial device not initialized'));
        return;
      }



      resolve();
    });


  }

  private async reconfirmStock(bills: { transactionID: string; position: number }[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.apiService.reconfirmStockNew(bills);
        resolve();
      } catch (error) {
        await this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Error reconfirming stock: ${JSON.stringify(error)}`,
        });
        reject(error);
      }
    });

  }

  private async reconfirmStockAndDrop(bills: { transactionID: string; position: number }[], dropPositionData: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.apiService.reconfirmStockAndDrop(bills, dropPositionData);
        resolve();
      } catch (error) {
        await this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Error reconfirming stock: ${JSON.stringify(error)}`,
        });
        reject(error);
      }
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
    if (this.timer)
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
