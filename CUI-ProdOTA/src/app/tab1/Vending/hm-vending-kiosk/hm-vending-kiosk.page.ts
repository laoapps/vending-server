import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  ModalController,
  Platform,
} from '@ionic/angular';
import { Toast } from '@capacitor/toast';
import cryptojs from 'crypto-js';
import { ApiService } from '../../../services/api.service';
import {
  EMACHINE_COMMAND,
  ESerialPortType,
  IBillProcess,
  ICreditData,
  IlogSerial,
  IMachineClientID,
  IMachineId,
  ISerialService,
  IVendingMachineBill,
  IVendingMachineSale,
  addLogMessage,
} from '../../../services/syste.model';
import { IENMessage } from '../../../models/base.model';
import { IonicStorageService } from '../../../ionic-storage.service';
import { CachingService } from '../../../services/caching.service';
import { VendingAPIService } from '../../../services/vending-api.service';
import { WsapiService } from '../../../services/wsapi.service';
import { AppcachingserviceService } from '../../../services/appcachingservice.service';
import { VendingIndexServiceService } from '../../../vending-index-service.service';
import { DatabaseService } from '../../../database.service';
import { BlockchainDbService } from '../../../blockchain-db';
import { LiveupdateService } from '../../../liveupdate.service';
import { GenerateLaoQRCodeProcess } from '../../LaoQR_processes/generateLaoQRCode.process';
import { LoadStockListProcess } from '../../Vending_processes/loadStockList.process';
import { RemainingbillsPage } from '../../../remainingbills/remainingbills.page';
import { RemainingbilllocalPage } from '../../../remainingbilllocal/remainingbilllocal.page';
import { SettingPage } from '../../../setting/setting.page';
import { QrconfigMachinePage } from '../../../qrconfig-machine/qrconfig-machine.page';
import { HowToPage } from '../how-to/how-to.page';
import { PlayGamesPage } from '../play-games/play-games.page';
import { GetCouponPromotionPage } from '../../../get-coupon-promotion/get-coupon-promotion.page';
import { IMachineStatus } from '../../../services/service';
import { environment } from 'src/environments/environment';
import { IBankNote, IHashBankNote } from '../../../vmc.service';
import { downloadPhotoUrl } from '../../../filemanager-url';


/**
 * Standalone customer kiosk (not Tab1).
 * Serial / NV9 / drop still use the same ApiService + serial port
 * so Auto Payment dock can call myTab1.serial / loadPaidBills / localLoad.
 */
@Component({
  selector: 'app-hm-vending-kiosk',
  templateUrl: './hm-vending-kiosk.page.html',
  styleUrls: ['./hm-vending-kiosk.page.scss'],
})
export class HmVendingKioskPage implements OnInit, OnDestroy {
  private router = inject(Router);

  readyState = false;
  contact = localStorage.getItem('contact') || '55516321';
  hmLogo = 'assets/icon/logo.png';
  redemgif = 'assets/redeemqr.gif';
  production = environment.production;
  filemanagerURL = environment.filemanagerurl;
  url = environment.url;

  serial: ISerialService | null = null;
  connecting = false;
  selectedDevice = localStorage.getItem('device') || 'adh814';
  NV9USB = localStorage.getItem('NV9USB') || 'false';
  portName = localStorage.getItem('portName') || '/dev/ttyS1';
  baudRate = localStorage.getItem('baudRate') || 38400;
  isSerial: ESerialPortType = ESerialPortType.Serial;
  platforms: { label: string; value: ESerialPortType }[] = [];

  offlineMode: Boolean = true;
  allowCashIn = false;
  allowVending = true;
  isShowLaabTabEnabled = false;
  qrMode = localStorage.getItem('qrMode') ? true : false;
  isRobotMuted = localStorage.getItem('isRobotMuted') ? true : false;
  isMusicMuted = localStorage.getItem('isMusicMuted') ? true : false;
  musicVolume = localStorage.getItem('musicVolume')
    ? Number(localStorage.getItem('musicVolume'))
    : 6;

  machineId = {} as IMachineId;
  vendingOnSale = new Array<IVendingMachineSale>();
  vendingBill = new Array<IVendingMachineBill>();
  vendingBillPaid = new Array<IVendingMachineBill>();
  onlineMachines = new Array<IMachineClientID>();
  saleList = new Array<IVendingMachineSale>();
  orders = new Array<IVendingMachineSale>();
  summarizeOrder = new Array<IVendingMachineSale>();
  getTotalSale = { q: 0, t: 0 };
  bills = {} as IVendingMachineBill;
  notes = new Array<IBankNote>();
  compensation = 0;
  otherModalAreOpening = false;
  processedQRPaid = false;
  lastUpdate = Date.now();
  lastAction = Date.now();
  lastCallTime: number | null = null;
  timeoutId: NodeJS.Timeout | null = null;
  queues = new Array<{ data: any; command: string }>();
  creditPending: ICreditData[] = [];
  vlog = { log: { data: '', limit: 50 } as IlogSerial };
  _machineStatus = { status: {} as IMachineStatus };
  tempStatus = { lowTemp: 5, highTemp: 10 };
  light = { start: 3, end: 2 };
  currentBalance = { value: 0, currency: 'LAK' };
  isNV9Ready = false;
  isNV9Enabled = false;
  isCashboxPresent = true;
  isReadingNote = false;
  currentReadingChannel = -1;
  nv9SerialNumber = '';
  nv9ChannelValues: number[] = [];
  transactions: any[] = [];
  shouldAutoEnable = true;

  private generateLaoQRCodeProcess: GenerateLaoQRCodeProcess;
  private loadStockListProcess: LoadStockListProcess;
  private tapCount = 6;
  private tapTimer: any = null;
  private ownerUuid: string | undefined;

  constructor(
    private ref: ChangeDetectorRef,
    public apiService: ApiService,
    private liveUpdateService: LiveupdateService,
    public platform: Platform,
    public modal: ModalController,
    public storage: IonicStorageService,
    public appCaching: CachingService,
    private vendingAPIService: VendingAPIService,
    private WSAPIService: WsapiService,
    private cashingService: AppcachingserviceService,
    public loading: LoadingController,
    private vendingIndex: VendingIndexServiceService,
    private dbService: DatabaseService,
    private alertController: AlertController,
    public blockchainDbService: BlockchainDbService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
  ) {
    this.machineId = this.apiService.machineId;
    this.url = this.apiService.url;
    this.generateLaoQRCodeProcess = new GenerateLaoQRCodeProcess(this.apiService);
    this.loadStockListProcess = new LoadStockListProcess(
      this.apiService,
      this.cashingService,
    );
  }

  async ngOnInit() {
    this.apiService.myTab1 = this as any;

    this.isShowLaabTabEnabled =
      JSON.parse(
        localStorage.getItem(this.apiService.controlMenuService.localname) ||
          '{}',
      ).find?.((x: any) => x.name == 'menu-showlaabtab')?.status ?? false;

    this.vendingOnSale = ApiService.vendingOnSale;
    this.vendingBillPaid = this.apiService.vendingBillPaid;
    this.vendingBill = this.apiService.vendingBill;
    this.onlineMachines = this.apiService.onlineMachines;
    this.saleList = this.vendingOnSale || [];

    this.ownerUuid = localStorage.getItem('machineId') || '';
    this.localLoad();
    this.bindWsLogin();
    this.bindAlive();
    this.bindDeductOrder();

    try {
      await this.blockchainDbService.initialize(this.machineId.machineId);
      await this.loadBalance();
    } catch (err) {
      console.error('SQLite init failed at kiosk start:', err);
    }

    try {
      await this.connect();
    } catch (errorSerial) {
      console.log('errorSerial', errorSerial);
    }

    this.readyState = true;
    this.checkLastClick();
    this.loadStock();
  }

  ngOnDestroy(): void {
    if (this.tapTimer) clearTimeout(this.tapTimer);
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    if (this.serial) {
      this.serial.close().catch((e) => console.log('serial close', e));
    }
  }

  get filteredSaleList(): IVendingMachineSale[] {
    return this.saleList.filter(
      (sl) => sl.stock.qtty - this.checkCartCount(sl.position) > 0,
    );
  }

  trackByPosition(_index: number, sl: IVendingMachineSale): number {
    return sl?.position;
  }

  checkCartCount(position: number): number {
    return this.orders.filter((o) => o.position == position).length;
  }



  removeCart(index: number): void {
    if (index < 0 || index >= this.orders.length) return;
    this.orders.splice(index, 1);
    this.getSummarizeOrder();
    this.localSave();
    this.ref.detectChanges();
  }

  clearCart(): void {
    this.orders.length = 0;
    this.summarizeOrder.length = 0;
    this.getTotalSale = { q: 0, t: 0 };
    this.localSave();
    this.ref.detectChanges();
  }

  clearStockAfterLAABGo(): void {
    this.clearCart();
  }

  refreshBalanceFromAnotherModal(balance: number): void {
    this.apiService.cash.value = balance;
    this.currentBalance.value = balance;
  }

  getSummarizeOrder(): void {
    const o = new Array<IVendingMachineSale>();
    const ord = JSON.parse(JSON.stringify(this.orders)) as Array<IVendingMachineSale>;
    ord.forEach((v) => {
      const x = o.find((x) => x.stock.id == v.stock.id && x.position == v.position);
      if (!x) o.push(v);
      else x.stock.qtty += 1;
    });
    this.summarizeOrder = o;
    const t = this.getTotal();
    this.getTotalSale.q = t.q;
    this.getTotalSale.t = t.t;
  }

  getTotal() {
    const o = this.orders;
    const q = o.reduce((a, b) => a + (b.stock?.qtty || 1), 0);
    const t = o.reduce((a, b) => a + (b.stock?.qtty || 1) * (b.stock?.price || 0), 0);
    return { q, t };
  }

  localSave(): void {
    try {
      localStorage.setItem(
        IENMessage.vendingPendingOrders as any,
        JSON.stringify(this.orders),
      );
      localStorage.setItem(
        IENMessage.vendingPendingSum as any,
        JSON.stringify(this.getTotalSale),
      );
      localStorage.setItem('vendingPendingOrders', JSON.stringify(this.orders));
      localStorage.setItem('vendingPendingSum', JSON.stringify(this.getTotalSale));
    } catch (e) {
      console.log('localSave', e);
    }
  }

  localLoad(): { orders: IVendingMachineSale[]; sum: { q: number; t: number } } {
    try {
      const rawOrders =
        localStorage.getItem(IENMessage.vendingPendingOrders as any) ||
        localStorage.getItem('vendingPendingOrders') ||
        '[]';
      const rawSum =
        localStorage.getItem(IENMessage.vendingPendingSum as any) ||
        localStorage.getItem('vendingPendingSum') ||
        '{"q":0,"t":0}';
      const orders = JSON.parse(rawOrders);
      const sum = JSON.parse(rawSum);
      this.orders = Array.isArray(orders) ? orders : [];
      this.getTotalSale = sum?.q != null ? sum : { q: 0, t: 0 };
      this.getSummarizeOrder();
    } catch (e) {
      console.log('localLoad', e);
      this.orders = [];
      this.getTotalSale = { q: 0, t: 0 };
    }
    return { orders: this.orders, sum: this.getTotalSale };
  }

  loadStock(): void {
    this.storage.get('saleStock', 'stock').then((s) => {
      try {
        const saleitems = JSON.parse(
          JSON.stringify(s?.v ? s.v : this.vendingOnSale || []),
        ) as Array<IVendingMachineSale>;
        this.saleList = saleitems;
        this.vendingOnSale = saleitems;
        this.ref.detectChanges();
      } catch (error) {
        console.log('loadStock', error);
      }
    });
  }


  focusShelf(): void {
    const el = document.querySelector('.shelf') as HTMLElement | null;
    el?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCheckoutPaid(_bill: any): void {
    this.clearCart();
    setTimeout(() => this.loadPaidBills(), 500);
  }

  public _processLoopCheckLaoQRPaid(transactionID?: string): Promise<any> {
    return new Promise<any>(async (resolve) => {
      try {
        const run = await this.generateLaoQRCodeProcess.CheckLaoQRPaid();
        Toast.show({
          text: `CHECK LAOQR SERVER ${JSON.stringify(run)}`,
          duration: 'long',
        });
        if (run.status == 1) {
          await this.apiService.waitingDelivery(
            run.message['data']['bill'],
            this.serial,
          );
        }
        resolve(IENMessage.success);
      } catch (error) {
        this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Error _processLoopCheckLaoQRPaid :${JSON.stringify(error)}`,
        });
        resolve(error);
      }
    });
  }

  loadPaidBills(): void {
    this.showBills();
  }

  showBills(): void {
    this.apiService
      .loadDeliveryingBillsNew()
      .then((r) => {
        try {
          if (r.length > 0) {
            this.apiService.pb = r as Array<IBillProcess>;
            if (this.apiService.pb.length) {
              this.apiService.isDropStock = true;
              if (!this.apiService.isRemainingBillsModalOpen) {
                if (this.serial) {
                  this.apiService
                    .showModal(
                      RemainingbillsPage,
                      { r: this.apiService.pb, serial: this.serial },
                      false,
                    )
                    .then((modal: any) => {
                      this.apiService.isRemainingBillsModalOpen = true;
                      this.apiService.IndexedLogDB.addBillProcess({
                        errorData: `RemainingbillsPage Open In Kiosk`,
                      });
                      modal.present();
                      modal.onDidDismiss().then(() => {
                        this.apiService.isRemainingBillsModalOpen = false;
                      });
                    });
                } else {
                  this.apiService.exitApp();
                }
              }
            }
          } else {
            this.apiService.isDropStock = false;
          }
        } catch (error: any) {
          this.apiService.toast
            .create({ message: error.message, duration: 5000 })
            .then((t) => t.present());
        }
      })
      .catch((e) => {
        Toast.show({
          text: 'Error showBills ' + JSON.stringify(e),
          duration: 'long',
        });
      });
  }

  async connect() {
    if (!this.selectedDevice) {
      return Toast.show({ text: 'Please select setting', duration: 'long' });
    }
    if (this.connecting) return Toast.show({ text: 'Connecting' });
    this.connecting = true;
    if (this.selectedDevice == 'VMC') {
      this.serial = await this.vendingIndex.initVMC(
        this.portName,
        Number(this.baudRate),
        '',
        '',
        this.isSerial,
      );
    } else if (this.selectedDevice == 'adh814') {
      this.serial = await (this.vendingIndex as any).initADH814?.(
        this.portName,
        Number(this.baudRate),
      );
    }
    this.connecting = false;
    if (this.serial) this.apiService.serialPort = this.serial;
  }

  enableCash() {
    this.serial
      ?.nv9Command(EMACHINE_COMMAND.NV9_ENABLE, { enable: true }, 1)
      .then(async (r) => {
        await Toast.show({ text: 'enableCash' + JSON.stringify(r) });
      })
      .catch((e) => {
        Toast.show({ text: 'enableCash error' + JSON.stringify(e) });
      });
  }

  disableCash() {
    this.serial
      ?.nv9Command(EMACHINE_COMMAND.NV9_DISABLE, { enable: false }, 1)
      .catch((e) => console.error('disableCash error', e));
  }

  sendStatus(
    b: string,
    t: number,
    c: EMACHINE_COMMAND = EMACHINE_COMMAND.MACHINE_STATUS,
  ) {
    this.lastCallTime = Date.now();
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    if (this.queues.find((v) => v.command == c && v.data == b)) return;
    this.queues.push({ data: b, command: c });
    const timeOut = this.queues.length;
    const that = this;
    setTimeout(() => {
      that.apiService
        .updateStatus({ data: b, transactionID: t, command: c })
        .then(async (rx) => {
          const r = rx.data;
          that.queues.shift();
          if (r.command === EMACHINE_COMMAND.CREDIT_NOTE) {
            if (r.transactionID) {
              const x = that.creditPending.find(
                (v) => v.transactionID === r.transactionID,
              );
              if (x) {
                await that.deleteCredit(x.id);
                that.creditPending = that.creditPending.filter(
                  (v) => v.transactionID !== r.transactionID,
                );
              }
            } else {
              setTimeout(() => that.sendStatus(b, t, c), 5000);
            }
          }
        });
    }, 1000 * timeOut);
  }

  async deleteCredit(id: number) {
    await this.dbService.deleteItem(id);
    return await this.loadCredits();
  }

  async loadCredits() {
    return await this.dbService.getItems();
  }

  async addOrUpdateCredit(data: ICreditData) {
    if (data.id >= 0) {
      await this.dbService.updateItem(
        data.id,
        data.name,
        data.data,
        data.transactionID,
        data.description,
      );
    } else {
      await this.dbService.createItem(
        data.name,
        data.data,
        data.transactionID,
        data.description,
      );
    }
    return await this.loadCredits();
  }

  private async loadBalance() {
    try {
      this.currentBalance.value = await this.blockchainDbService.getLocalBalance(
        this.machineId.machineId,
      );
      this.currentBalance.currency = localStorage.getItem('currency') || 'LAK';
    } catch (e) {
      this.currentBalance.value = 0;
    }
  }

  async loadOnlineBalance(): Promise<number> {
    try {
      const machineId = this.machineId?.machineId;
      if (!machineId) return 0;
      let localBalance = await this.blockchainDbService.getLocalBalance(machineId);
      const offlineMode = localStorage.getItem('offlineMode') === 'true';
      if (!offlineMode) {
        try {
          const res = await this.apiService.getBlockChainBalance(machineId);
          if (res?.status === 1 && res.data) {
            const serverBalance = Number(res.data.data.currentBalance ?? 0);
            if (Math.abs(serverBalance - localBalance) > 0.01) {
              localBalance = serverBalance;
            }
          }
        } catch (err) {
          console.warn('Server balance fetch failed, using local balance', err);
        }
      }
      this.currentBalance.value = localBalance;
      return localBalance;
    } catch (err) {
      return 0;
    }
  }

  private async updateBalance(amount: number) {
    if (amount === 0) return;
    try {
      const isInsert = amount > 0;
      const absAmount = Math.abs(amount);
      const latest = await this.blockchainDbService.getLatestBlock(
        this.machineId.machineId,
      );
      const prevHash =
        latest?.hash ||
        '0000000000000000000000000000000000000000000000000000000000000000';
      const nextIndex = (latest?.block_index ?? 0) + 1;
      const txData = {
        type: isInsert ? 'insert' : 'withdrawal',
        amount: absAmount,
        timestamp: new Date().toISOString(),
        note: isInsert
          ? 'Banknote accepted'
          : 'Cash reset / transferred to e-wallet',
      };
      const blockString = JSON.stringify({
        prevHash,
        index: nextIndex,
        data: txData,
        timestamp: txData.timestamp,
      });
      const newHash = cryptojs.SHA256(blockString).toString();
      await this.blockchainDbService.addBlock({
        machineId: this.machineId.machineId,
        prevHash,
        hash: newHash,
        data: txData,
        isReset: !isInsert,
        signature: '',
        needsSync: true,
      });
      this.currentBalance.value += amount;
    } catch (err) {
      console.error('Failed to update balance / log transaction:', err);
    }
  }

  private async syncToServer(LaabXWallet: string = ''): Promise<void> {
    const offlineMode = localStorage.getItem('offlineMode') === 'true';
    if (offlineMode) return;
    const unsynced = await this.blockchainDbService.getUnsyncedBlocks(
      this.machineId.machineId,
      200,
    );
    if (!unsynced.length) return;
    const res = await this.apiService.blockChainSync(unsynced, LaabXWallet);
    if (res?.status === 1) {
      const blockIds = unsynced.map((b) => b.id);
      await this.blockchainDbService.markAsSynced(blockIds);
      if (unsynced.length === 200) {
        setTimeout(() => this.syncToServer(LaabXWallet), 1500);
      }
    } else {
      throw new Error('Server returned non-success status');
    }
  }

  public async topUpEwallet() {
    try {
      const currentDbBalance = await this.blockchainDbService.getLocalBalance(
        this.machineId?.machineId,
      );
      if (currentDbBalance <= 0) return;
      await this.updateBalance(-currentDbBalance);
      const offlineMode = localStorage.getItem('offlineMode') === 'true';
      if (!offlineMode) {
        try {
          await this.syncToServer();
          this.currentBalance.value = 0;
        } catch (syncErr) {
          console.error('Sync to server failed after local withdrawal:', syncErr);
        }
      } else {
        this.currentBalance.value = 0;
      }
    } catch (error) {
      console.error('Failed to top up e-wallet:', error);
    }
  }

  initHashBankNotes(machineId: string) {
    const hashNotes = Array<IHashBankNote>();
    for (let i = 0; i < this.notes.length; i++) {
      const x = JSON.parse(JSON.stringify(this.notes[i])) as IHashBankNote;
      x.hash = cryptojs
        .SHA256(machineId + this.notes[i].value * 100)
        .toString(cryptojs.enc.Hex);
      hashNotes.push(x);
    }
    return hashNotes;
  }

  checkLastClick() {
    try {
      const lastClick = this.getStoredLastClick();
      if (!lastClick) return false;
      const targetTime = new Date(lastClick).getTime();
      if (isNaN(targetTime)) {
        this.clearInvalidLastClick();
        return false;
      }
      setTimeout(() => {
        this.loadPaidBills();
        localStorage.setItem('lastClickCheck', '');
      }, 30000);
    } catch (error) {
      this.apiService.IndexedLogDB.addBillProcess({
        errorData: `Error checkLastClick ${JSON.stringify(error)}`,
      });
      return false;
    }
  }

  private getStoredLastClick(): string | null {
    try {
      const stored = localStorage.getItem('lastClickCheck');
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch {
        if (stored.startsWith('"') && stored.endsWith('"')) {
          return stored.slice(1, -1);
        }
        return stored;
      }
    } catch {
      return null;
    }
  }

  private clearInvalidLastClick() {
    localStorage.removeItem('lastClickCheck');
  }

  setLastClick() {
    try {
      localStorage.setItem('lastClickCheck', JSON.stringify(new Date().toISOString()));
    } catch {}
  }

  showSetting(): void {
    this.armTap(6, () => {
      this.apiService.showModal(SettingPage).then((r) => r?.present());
    });
  }

  showQrConfig(): void {
    this.armTap(6, () => {
      this.apiService.showModal(QrconfigMachinePage).then((r) => r?.present());
    });
  }

  private armTap(resetTo: number, action: () => void): void {
    if (!this.tapTimer) {
      this.tapTimer = setTimeout(() => {
        this.tapCount = resetTo;
        this.tapTimer = null;
      }, 1500);
    }
    if (--this.tapCount <= 0) {
      this.tapCount = resetTo;
      if (this.tapTimer) {
        clearTimeout(this.tapTimer);
        this.tapTimer = null;
      }
      action();
    }
  }

  showGetCouponPromotion(): void {
    this.apiService.showModal(GetCouponPromotionPage).then((r) => r?.present());
  }

  openHowToPage(): void {
    this.apiService.modalCtrl
      .create({
        component: HowToPage,
        componentProps: {},
        cssClass: 'dialog-fullscreen',
      })
      .then((r) => r.present());
  }

  openGameServices(): void {
    this.apiService.modalCtrl
      .create({
        component: PlayGamesPage,
        cssClass: 'dialog-fullscreen',
      })
      .then((r) => r.present());
  }

  openSmartCB(): void {
    this.router.navigate(['/smartcb']);
  }

  openHMStoreVending(): void {
    this.router.navigate(['/HM-store-vending']);
  }

  openTestMotor(): void {
    this.armTap(7, () => {
      localStorage.setItem('startTestMotor', 'true');
      this.apiService.reloadPage();
    });
  }

  showMenu(m: string): boolean {
    return localStorage.getItem('menu-' + m) == 'true';
  }

  private bindWsLogin() {
    try {
      this.apiService.wsapi.loginSubscription.subscribe((rxx) => {
        if (!rxx) return;
        this.apiService.myTab1 = this as any;
        this.apiService.clientId.clientId = rxx.clientId;
        this.apiService.wsAlive.time = new Date();
        this.apiService.wsAlive.isAlive = this.apiService.checkOnlineStatus();
        this.loadStock();
      });
    } catch {}
  }

  private bindDeductOrder() {
    this.apiService.onDeductOrderUpdate((position) => {
      try {
        const ind = this.orders.findIndex((v) => v.position == position);
        if (ind != -1) this.orders.splice(ind, 1);
        this.getSummarizeOrder();
        this.localSave();
      } catch (error) {
        console.log(' error on event emitter');
      }
    });
  }

  private bindAlive() {
    this.WSAPIService.aliveSubscription.subscribe(async (res) => {
      try {
        this.lastUpdate = Date.now();
        const r = res?.data?.setting;
        if (!r || !this.readyState) return;

        if (r?.refresh) return this.apiService.reloadPage();
        if (r?.exit) {
          setTimeout(() => this.apiService.exitApp(), 5000);
          return;
        }
        if (r?.reboot) {
          setTimeout(() => this.apiService.rebootMachine(), 5000);
          return;
        }
        if (r?.recoverSale) {
          this.storage.set('saleStock', [], 'stock');
          setTimeout(() => this.apiService.reloadPage(), 1000);
          return;
        }

        if (this.allowVending !== r.allowVending) {
          this.allowVending = r.allowVending;
        }
        if (this.offlineMode != r.offlineMode) {
          this.offlineMode = r.offlineMode;
          localStorage.setItem('offlineMode', this.offlineMode ? 'true' : 'false');
        }
        if (this.isMusicMuted != r.isMusicMuted) {
          this.isMusicMuted = r.isMusicMuted;
          localStorage.setItem('isMusicMuted', this.isMusicMuted ? 'yes' : '');
        }
        if (this.isRobotMuted != r.isRobotMuted) {
          this.isRobotMuted = r.isRobotMuted;
          localStorage.setItem('isRobotMuted', this.isRobotMuted ? 'yes' : '');
        }
        if (this.musicVolume != r.musicVolume) {
          this.musicVolume = r.musicVolume;
          localStorage.setItem('musicVolume', this.musicVolume.toString());
        }

        if (this.NV9USB) {
          if (this.allowCashIn != r.allowCashIn) {
            this.allowCashIn = r.allowCashIn;
            if (this.allowCashIn) this.enableCash();
            else this.disableCash();
          }
        }
      } catch (error) {
        Toast.show({
          text: 'Error alive ' + JSON.stringify(error || '{}'),
          duration: 'long',
        });
      }
    });
  }

  private addLogMessage(log: IlogSerial, message: string, consoleMessage?: string): void {
    addLogMessage(log, message, consoleMessage);
  }



  /**
 * Paste these methods into HmVendingKioskPage.
 * Replace addOrder / refreshOrder if they call apiService.reloadPage().
 */










async ngOnInitPhotosHook() {
  // call at end of ngOnInit:
  await this.loadPhotos();
}


photoOf(sl: any, size = 256): string {
  const id = sl?.stock?.image;
  if (!id) return this.hmLogo;
  const cached = this.apiService?.imageList?.[id];
  if (typeof cached === 'string' && cached.startsWith('data:image')) return cached;
  return downloadPhotoUrl(id, size, size) || this.hmLogo;
}

onPhotoError(ev: Event, sl: any): void {
  const img = ev.target as HTMLImageElement;
  if (!img) return;
  const step = Number(img.dataset['step'] || '0');
  const id = sl?.stock?.image;
  if (step === 0 && id) {
    img.dataset['step'] = '1';
    img.src = downloadPhotoUrl(id, 64, 64);
    return;
  }
  img.dataset['step'] = '2';
  img.src = this.hmLogo;
}

async loadPhotos(): Promise<void> {
  if (!this.apiService.imageList) this.apiService.imageList = {};
  for (const sl of this.saleList || []) {
    const id = sl?.stock?.image;
    if (!id || this.apiService.imageList[id]) continue;
    try {
      const d = sl.updatedAt ? new Date(sl.updatedAt) : new Date();
      const saved: any = await this.appCaching.saveCachingPhoto(
        downloadPhotoUrl(id, 256, 256),
        d,
        String(sl.stock?.id ?? id),
      );
      const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
      let v = parsed?.v || parsed;
      if (typeof v === 'string' && v.indexOf('data:application/octet-stream') !== -1) {
        v = v.replace('data:application/octet-stream', 'data:image/jpeg');
      }
      if (typeof v === 'string' && v.startsWith('data:image')) {
        this.apiService.imageList[id] = v;
      } else {
        this.apiService.imageList[id] = downloadPhotoUrl(id, 256, 256);
      }
    } catch {
      this.apiService.imageList[id] = downloadPhotoUrl(id, 256, 256);
    }
  }
  this.ref.detectChanges();
}

addOrder(sl: IVendingMachineSale): void {
  if (!sl?.stock || sl.stock.price == 0) return;
  const remaining = sl.stock.qtty - this.checkCartCount(sl.position);
  if (remaining <= 0) return;
  if (this.getTotalSale.q >= 10) {
    this.apiService.toast
      ?.create({ message: 'ສູງສຸດ 10 ລາຍການ', duration: 1500 })
      .then((t) => t.present());
    return;
  }
  const line = JSON.parse(JSON.stringify(sl)) as IVendingMachineSale;
  line.stock.qtty = 1;
  this.orders.push(line);
  this.getSummarizeOrder();
  this.localSave();
  this.setLastClick();
  this.ref.detectChanges();
}

handleRefresh(ev?: any): void {
  this.loadStock();
  this.localLoad();
  this.loadBalance();
  this.loadPhotos();
  setTimeout(() => ev?.target?.complete?.(), 800);
}
}