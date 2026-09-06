
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { IMachineId, IVendingMachineSale } from 'src/app/services/syste.model';
import { IonicStorageService } from 'src/app/ionic-storage.service';
import { BlockchainDbService } from 'src/app/blockchain-db';
import { CachingService } from 'src/app/services/caching.service';
import { IdleService } from 'src/app/services/idle.service';
import { WsapiService } from 'src/app/services/wsapi.service';
import { SettingPage } from 'src/app/setting/setting.page';
import { QrconfigMachinePage } from 'src/app/qrconfig-machine/qrconfig-machine.page';
import { environment } from 'src/environments/environment';
import { downloadPhotoUrl } from '../../../../filemanager-url';
import { HmAttractComponent } from '../hm-attract/hm-attract.component';
import { KioskStockService } from '../../../../services/kiosk-stock.service';
import { AppcachingserviceService } from '../../../../services/appcachingservice.service';
@Component({
  selector: 'app-hm-vending-kiosk',
  templateUrl: './hm-vending-kiosk.page.html',
  styleUrls: ['./hm-vending-kiosk.page.scss'],
})

export class HmVendingKioskPage implements OnInit, OnDestroy {
  hmLogo = 'assets/icon/logo.png';
  contact = localStorage.getItem('contact') || '55516321';
  filemanagerURL = (environment as any).filemanagerurl || '';
  url = environment.url;

  machineId = {} as IMachineId;
  saleList: IVendingMachineSale[] = [];
  orders: IVendingMachineSale[] = [];
  getTotalSale = { q: 0, t: 0 };
  currentBalance = { value: 0, currency: 'LAK' };
  isShowLaabTabEnabled = false;
  compensation = 0;
  _machineStatus: { status?: { temp?: string | number } } = { status: {} };
  serial: any = null;
  menuOpen = false;

  /**
   * Attract demo delay after last touch.
   * 3000 = 3 seconds (demo). 180000 = 3 minutes (production).
   */
  demoStartMs = 3000;
  demoItemMs = 2500;
  idleClearMs = 3 * 60 * 1000;

  photoOfBound = (sl: any, size?: number) => this.photoOf(sl, size);
  private holdTimer: any = null;
  private idleClearTimer: any = null;
  private attractArm: any = null;
  private attractModal: HTMLIonModalElement | null = null;

  private tapCount = 6;
  private tapTimer: any = null;
  private loginSub: Subscription | null = null;
  private aliveSub: Subscription | null = null;
  private billSub: Subscription | null = null;
  private waitSub: Subscription | null = null;
  lastUpdate = Date.now();

  constructor(
    private ref: ChangeDetectorRef,
    public apiService: ApiService,
    public platform: Platform,
    public modal: ModalController,
    public storage: IonicStorageService,
    public appCaching: CachingService,
    public blockchainDbService: BlockchainDbService,
    private idleService: IdleService,
    private WSAPIService: WsapiService,
    private cashingService: AppcachingserviceService
  ) {
    this.machineId = this.apiService.machineId;
  }

  ngOnInit(): void {
    // Dock still calls apiService.myTab1.* — this PAGE is the host, not Tab1.
    this.apiService.myTab1 = this as any;
    this.bindWebsocket();
    this.saleList = ApiService.vendingOnSale || [];
    this.localLoad();
    this.loadStock();
    this.loadBalance();
    this.loadPhotos();
    this.connect();
    this.apiService.isAds = false;
    try {
      this.idleService?.closeAds?.();
    } catch { }
    this.armIdle();
    this.armAttract();
  }

  ngOnDestroy(): void {
    if (this.tapTimer) clearTimeout(this.tapTimer);
    if (this.holdTimer) clearTimeout(this.holdTimer);
    clearTimeout(this.attractArm);
    this.closeAttractModal();
    this.loginSub?.unsubscribe();
    this.aliveSub?.unsubscribe();
    this.billSub?.unsubscribe();
    this.waitSub?.unsubscribe();
  }

  /** Subscribe only. AppComponent already owns connect/ping. Do not reconnect if OPEN. */
  private bindWebsocket(): void {
    const wsapi: any = this.apiService.wsapi || this.WSAPIService;

    this.loginSub = wsapi?.loginSubscription?.subscribe((rxx: any) => {
      if (!rxx) return;
      const data = rxx.data?.data || rxx.data || rxx;
      const clientId = data?.clientId || rxx.clientId;
      if (clientId && this.apiService.clientId) {
        this.apiService.clientId.clientId = clientId;
      }
      if (this.apiService.wsAlive) {
        this.apiService.wsAlive.time = new Date();
        this.apiService.wsAlive.isAlive = true;
      }
      this.loadStock();
      this.ref.detectChanges();
    });

    this.aliveSub = this.WSAPIService.aliveSubscription?.subscribe((res: any) => {
      this.lastUpdate = Date.now();
      if (this.apiService.wsAlive) {
        this.apiService.wsAlive.time = new Date();
        this.apiService.wsAlive.isAlive = true;
      }
      const r = res?.data?.setting;
      if (r?.refresh) this.apiService.reloadPage?.();
    });

    this.billSub = this.WSAPIService.billProcessSubscription?.subscribe((bill: any) => {
      if (!bill) return;
      this.onPaymentConfirmed(bill);
    });
    this.waitSub = this.WSAPIService.waitingDelivery?.subscribe((bill: any) => {
      if (!bill) return;
      this.onPaymentConfirmed(bill);
    });
    try {
      this.WSAPIService.onBillProcess?.((data: any) => this.onPaymentConfirmed(data));
    } catch { }
    // AppComponent already connected. Do not call reconnect() — that closes loginok.
  }

  private asSaleList(x: any): IVendingMachineSale[] {
    if (Array.isArray(x)) return x;
    if (Array.isArray(x?.v)) return x.v;
    if (Array.isArray(x?.data)) return x.data;
    return [];
  }

  get filteredSaleList(): IVendingMachineSale[] {
    return this.asSaleList(this.saleList).filter(
      (sl) => Number(sl?.stock?.qtty) - this.checkCartCount(sl.position) > 0,
    );
  }

  trackByPosition(_i: number, sl: IVendingMachineSale) {
    return sl?.position;
  }

  checkCartCount(position: number): number {
    return this.orders.filter((o) => o.position == position).length;
  }

  addOrder(sl: IVendingMachineSale): void {
    this.bumpActivity();
    if (!sl?.stock || sl.stock.price == 0) return;
    if (this.checkCartCount(sl.position) >= sl.stock.qtty) return;
    if (this.getTotalSale.q >= 10) {
      try {
        this.apiService.toast
          ?.create({
            message: 'ສູງສຸດ 10 ລາຍການ · Max 10 items',
            duration: 1800,
            position: 'top',
            color: 'danger',
          })
          .then((t) => t.present());
      } catch { }
      return;
    }

    const line = JSON.parse(JSON.stringify(sl)) as IVendingMachineSale;
    line.stock.qtty = 1;
    this.orders = [...this.orders, line];
    this.recalcTotals();
    this.localSave();
    this.ref.detectChanges();
  }

  removeCart(index: number): void {
    if (index < 0 || index >= this.orders.length) return;
    this.orders = this.orders.filter((_, i) => i !== index);
    this.recalcTotals();
    this.localSave();
    this.ref.detectChanges();
  }

  clearCart(): void {
    this.orders = [];
    this.getTotalSale = { q: 0, t: 0 };
    this.localSave();
    this.ref.detectChanges();
  }

  recalcTotals(): void {
    this.getTotalSale = {
      q: this.orders.reduce((a, b) => a + (b.stock?.qtty || 1), 0),
      t: this.orders.reduce(
        (a, b) => a + (b.stock?.qtty || 1) * (b.stock?.price || 0),
        0,
      ),
    };
  }

  localSave(): void {
    try {
      localStorage.setItem('vendingPendingOrders', JSON.stringify(this.orders));
      localStorage.setItem('vendingPendingSum', JSON.stringify(this.getTotalSale));
    } catch { }
  }

  localLoad(): { orders: IVendingMachineSale[]; sum: { q: number; t: number } } {
    try {
      const orders = JSON.parse(localStorage.getItem('vendingPendingOrders') || '[]');
      const sum = JSON.parse(localStorage.getItem('vendingPendingSum') || '{"q":0,"t":0}');
      this.orders = Array.isArray(orders) ? [...orders] : [];
      this.getTotalSale = { q: sum?.q || 0, t: sum?.t || 0 };
      this.recalcTotals();
    } catch {
      this.orders = [];
      this.getTotalSale = { q: 0, t: 0 };
    }
    this.ref.detectChanges();
    return { orders: this.orders, sum: this.getTotalSale };
  }

  loadStock(): void {
    this.storage.get('saleStock', 'stock').then((s) => {
      try {
        const items = JSON.parse(JSON.stringify(s?.v ? s.v : ApiService.vendingOnSale || []));
        this.saleList = items;
        this.ref.detectChanges();
      } catch { }
    });
  }

  private hiBusy = new Set<string>();

  photoOf(sl: any, size = 256): string {
    const id = sl?.stock?.image;
    if (!id) return this.hmLogo;
    if (size >= 800) {
      const hi = this.unwrapPhoto(this.apiService?.imageList?.[id + '@1024']);
      if (this.isPhotoData(hi)) return this.asImageData(hi);
    }
    const lo = this.unwrapPhoto(this.apiService?.imageList?.[id]);
    if (this.isPhotoData(lo)) return this.asImageData(lo);
    if (typeof id === 'string' && this.isPhotoData(id)) return this.asImageData(id);
    return this.hmLogo;
  }

  hydrateHi = (sl: any): Promise<void> => this.ensureHi(sl);

  private async ensureHi(sl: any): Promise<void> {
    const id = sl?.stock?.image;
    if (!id) return;
    const key = id + '@1024';
    if (this.isPhotoData(this.unwrapPhoto(this.apiService?.imageList?.[key]))) return;
    if (this.hiBusy.has(key) || navigator.onLine === false) return;
    this.hiBusy.add(key);
    try {
      const raw = await this.appCaching.saveCachingPhoto(
        downloadPhotoUrl(id, 1024, 1024),
        new Date(sl?.stock?.updatedAt || Date.now()),
        key,
      );
      const v = this.asImageData(this.unwrapPhoto(raw));
      if (this.isPhotoData(v)) {
        this.apiService.imageList[key] = v;
        this.apiService.imageList = { ...this.apiService.imageList };
      }
    } catch { }
    this.hiBusy.delete(key);
  }

  onPhotoError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (img) img.src = this.hmLogo || 'assets/icon/logo.png';
  }

  private unwrapPhoto(x: any): string {
    if (!x) return '';
    if (typeof x === 'string') {
      const s = x.trim();
      if (s.startsWith('data:') || s.startsWith('blob:')) return s;
      if (s.startsWith('{')) {
        try { return this.unwrapPhoto(JSON.parse(s)); } catch { return ''; }
      }
      return '';
    }
    return this.unwrapPhoto(x.v || x.file || '');
  }

  private isPhotoData(s: any): boolean {
    return typeof s === 'string' && (
      s.startsWith('data:image') ||
      s.startsWith('data:application/octet-stream') ||
      s.startsWith('blob:')
    );
  }

  private asImageData(s: string): string {
    if (s.startsWith('data:application/octet-stream')) {
      return 'data:image/jpeg;base64,' + s.split(',')[1];
    }
    return s;
  }

  async loadPhotos(): Promise<void> {
    if (!this.apiService.imageList) this.apiService.imageList = {};

    // 1) Tab1 cache (this is what already exists on the machine)
    try {
      const owner = localStorage.getItem('machineId') || this.apiService.machineId?.machineId || '';
      const run = await this.cashingService.get(owner);
      const parse = typeof run === 'string' ? JSON.parse(run) : run;
      const list = parse?.v || parse || [];
      if (Array.isArray(list)) {
        for (const item of list) {
          const name = item?.name;
          const file = this.asImageData(this.unwrapPhoto(item?.file));
          if (name && this.isPhotoData(file)) this.apiService.imageList[name] = file;
        }
      }
    } catch (e) {
      console.warn('cashList hydrate', e);
    }

    // 2) per-slot fill / online miss
    const online = navigator.onLine !== false;
    for (const sl of this.asSaleList(this.saleList)) {
      const id = sl?.stock?.image;
      if (!id || this.isPhotoData(this.unwrapPhoto(this.apiService.imageList[id]))) continue;

      try {
        const stored = await this.appCaching.getPhoto(
          (typeof downloadPhotoUrl === 'function' ? downloadPhotoUrl(id, 256, 256) : id) + id,
        );
        const v = this.asImageData(this.unwrapPhoto(stored));
        if (this.isPhotoData(v)) {
          this.apiService.imageList[id] = v;
          continue;
        }
      } catch { }

      if (!online) continue;
      try {
        const raw = await this.appCaching.saveCachingPhoto(
          downloadPhotoUrl(id, 256, 256),
          new Date(sl?.stock?.updatedAt || Date.now()),
          id,
        );
        const v = this.asImageData(this.unwrapPhoto(raw));
        if (this.isPhotoData(v)) this.apiService.imageList[id] = v;
      } catch { }
    }

    this.apiService.imageList = { ...this.apiService.imageList }; // force CD
    this.ref.detectChanges();
    console.log(
      'imageList',
      Object.keys(this.apiService.imageList).length,
      this.saleList[0]?.stock?.image,
      String(this.apiService.imageList[this.saleList[0]?.stock?.image] || '').slice(0, 40),
    );
  }

  async loadBalance(): Promise<void> {
    try {
      const id = this.machineId?.machineId;
      if (!id) return;
      this.currentBalance.value = await this.blockchainDbService.getLocalBalance(id);
      this.currentBalance.currency = localStorage.getItem('currency') || 'LAK';
    } catch {
      this.currentBalance.value = 0;
    }
  }

  handleRefresh(ev?: any): void {
    this.loadStock();
    this.localLoad();
    this.loadBalance();
    this.loadPhotos();
    setTimeout(() => ev?.target?.complete?.(), 600);
  }

  focusShelf(): void {
    document.getElementById('shelf')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bumpActivity(): void {
    this.closeAttractModal();
    this.armIdle();
    this.armAttract();   // always, even if cart has items
  }

  onKioskPointer(ev: Event): void {
    const t = ev.target as HTMLElement;
    if (t?.closest?.('.action-bar, .gear-menu')) return;
    if (this.menuOpen) this.closeMenu();
    this.bumpActivity();
  }

  startDemoTour(): void {
    this.clearCart();
    this.openAttractModal();
  }

  stopDemoTour(): void {
    this.closeAttractModal();
    this.armIdle();
    this.armAttract();
  }

  armIdle(): void {
    clearTimeout(this.idleClearTimer);
    this.idleClearTimer = setTimeout(() => {
      this.clearCart();              // 3 min: wipe dock
      this.armAttract();             // then attract if still idle
    }, this.idleClearMs);
  }

  armAttract(): void {
    clearTimeout(this.attractArm);
    if (this.attractModal) return;
    this.attractArm = setTimeout(() => this.openAttractModal(), this.demoStartMs);
  }

  async openAttractModal(): Promise<void> {
    if (this.attractModal) return;
    this.apiService.isAds = false;
    try {
      this.idleService?.closeAds?.();
    } catch { }
    this.attractModal = await this.modal.create({
      component: HmAttractComponent,
      cssClass: 'kiosk-attract-modal',
      backdropDismiss: true,
      showBackdrop: true,
      componentProps: {
        products: this.filteredSaleList,
        photoOf: this.photoOfBound,
        hydrateHi: this.hydrateHi,
        fallback: this.hmLogo,
        shelfId: 'shelf',
        itemHoldMs: this.demoItemMs,
      },
    });
    this.pinAttractToShelf(this.attractModal);
    this.attractModal.onDidDismiss().then(() => {
      this.attractModal = null;
      this.armAttract();
    });
    await this.attractModal.present();
    this.pinAttractToShelf(this.attractModal);
  }

  private pinAttractToShelf(modal: HTMLIonModalElement | null): void {
    if (!modal) return;
    const shelf = document.getElementById('shelf');
    const r = shelf?.getBoundingClientRect();
    const sw = r ? r.width : window.innerWidth - 24;
    const sh = r ? r.height : window.innerHeight * 0.45;
    const st = r ? r.top : 160;
    const sl = r ? r.left : 12;
    const w = Math.min(480, Math.max(320, sw - 80));
    const h = Math.min(520, Math.max(360, sh - 48));
    const top = Math.round(st + (sh - h) / 2);
    const left = Math.round(sl + (sw - w) / 2);
    // modal.style.setProperty('--attract-top', top + 'px');
    // modal.style.setProperty('--attract-left', left + 'px');
    // modal.style.setProperty('--attract-w', Math.round(w) + 'px');
    // modal.style.setProperty('--attract-h', Math.round(h) + 'px');
    modal.style.setProperty('--attract-top', 25 + '%');
    modal.style.setProperty('--attract-left', 10 + '%');
    modal.style.setProperty('--attract-w', Math.round(80) + '%');
    modal.style.setProperty('--attract-h', Math.round(60) + '%');
  }

  async closeAttractModal(): Promise<void> {
    const m = this.attractModal;
    this.attractModal = null;
    if (m) {
      try {
        await m.dismiss();
      } catch { }
    }
  }

  onCheckoutPaid(_bill: any): void {
    this.clearStockAfterLAABGo();
  }

  /** WS command `confirm` / waitingt — deduct stock then empty cart. */
  onPaymentConfirmed(bill: any): void {
    if (!this.orders?.length) return;
    const tid = localStorage.getItem('transactionID');
    if (tid && bill?.transactionID && String(bill.transactionID) !== String(tid)) return;
    this.clearStockAfterLAABGo();
  }

  deductStockFromOrders(): void {
    if (!this.orders?.length) return;
    const next = this.saleList.map((sl) => {
      const n = this.orders.filter((o) => o.position == sl.position).length;
      if (!n) return sl;
      const copy = JSON.parse(JSON.stringify(sl));
      copy.stock.qtty = Math.max(0, Number(copy.stock.qtty || 0) - n);
      return copy;
    });
    this.saleList = next;
    if (ApiService.vendingOnSale) ApiService.vendingOnSale = next;
    try {
      this.storage.set('saleStock', { v: next, d: new Date() }, 'stock');
    } catch { }
    this.ref.detectChanges();
  }

  /** Host API the dock still calls via apiService.myTab1 */
  clearStockAfterLAABGo(): void {
    this.deductStockFromOrders();
    this.clearCart();
    this.ref.detectChanges();
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

  topUpEwallet(): void { }
  openTestMotor(): void { }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  holdCount(): void {
    clearTimeout(this.holdTimer);
    this.holdTimer = setTimeout(() => this.manageStock(), 1500);
  }

  endCount(): void {
    clearTimeout(this.holdTimer);
  }

  /** Same as Tab1 logo → password + stock refill. Paste Tab1.manageStock body here. */
  manageStock(): void {
    this.closeMenu();
  }

  refreshBalanceFromAnotherModal(n: number): void {
    this.currentBalance.value = Number(n) || 0;
    this.apiService.localBalance = this.currentBalance.value;
    this.ref.detectChanges();
  }

  async connect(): Promise<void> {
    try {
      this.serial = this.apiService.serialPort || this.serial;
    } catch { }
  }

  async loadPaidBills(): Promise<void> {
    // copy body from Tab1.loadPaidBills if remaining-drop modal is needed
  }

  async _processLoopCheckLaoQRPaid(): Promise<void> {
    // dock already polls QR; keep for old call sites
  }
}