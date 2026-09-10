
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import CryptoJS from 'crypto-js';
import { Toast } from '@capacitor/toast';
import { ApiService } from 'src/app/services/api.service';
import { EMACHINE_COMMAND, IBillProcess, IMachineId, IVendingMachineSale } from 'src/app/services/syste.model';
import { IonicStorageService } from 'src/app/ionic-storage.service';
import { BlockchainDbService } from 'src/app/blockchain-db';
import { CachingService } from 'src/app/services/caching.service';
import { IdleService } from 'src/app/services/idle.service';
import { WsapiService } from 'src/app/services/wsapi.service';
import { SettingPage } from 'src/app/setting/setting.page';
import { QrconfigMachinePage } from 'src/app/qrconfig-machine/qrconfig-machine.page';
import { StocksalePage } from 'src/app/stocksale/stocksale.page';
import { QrOpenStockPage } from 'src/app/qr-open-stock/qr-open-stock.page';
import { RemainingbillsPage } from 'src/app/remainingbills/remainingbills.page';
import { BillNotDropPage } from 'src/app/bill-not-drop/bill-not-drop.page';
import { NumpadModalComponent } from 'src/app/components/numpad-modal/numpad-modal.component';
import { environment } from 'src/environments/environment';
import { downloadPhotoUrl } from '../../../../filemanager-url';
import { HmAttractComponent } from '../hm-attract/hm-attract.component';
import { KioskShowcaseService } from '../../../../kiosk-showcase.service';
import { AppcachingserviceService } from '../../../../services/appcachingservice.service';
import { VideoCacheService } from '../../../../video-cache.service';
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
  qrMode = localStorage.getItem('qrMode') ? true : false;
  private numpadModal?: HTMLIonModalElement;
  isOpenStock = false;
  processLoadedPaidBills = false;
  private testMotorCount = 7;
  private testMotorTimer: any = null;
  private gearHoldTimer: any = null;
  private gearHeldOpen = false;

  /**
   * Attract demo delay after last touch.
   * 3000 = 3 seconds (demo). 180000 = 3 minutes (production).
   */
  // kiosk
  demoStartMs = environment.demoStartMs||3000;  // attract auto  (demo: 3000) ==>180000
  idleClearMs = environment.idleClearMs||180000;  // clear checkout ==>180000
  demoItemMs = environment.demoItemMs||10000;   // each product photo in attract
  cartMax = environment.cartMax ||10;


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
    private cashingService: AppcachingserviceService,
    private showcase: KioskShowcaseService,
    private videoCache: VideoCacheService,
    private router: Router,
  ) {
    this.machineId = this.apiService.machineId;
    // Sync from localStorage in case Admin/setting changed while on this URL.
    this.apiService.checkoutUiVersion = ApiService.readCheckoutUiVersion();
    if (this.apiService.checkoutUiVersion !== 'v3') {
      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    }
  }

  ngOnInit(): void {
    if (this.apiService.checkoutUiVersion !== 'v3') {
      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      return;
    }
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
    this.sfxAdd.load()
  }

  ngOnDestroy(): void {
    if (this.tapTimer) clearTimeout(this.tapTimer);
    if (this.holdTimer) clearTimeout(this.holdTimer);
    if (this.testMotorTimer) clearTimeout(this.testMotorTimer);
    if (this.gearHoldTimer) clearTimeout(this.gearHoldTimer);
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
      if (r?.checkoutUiVersion != null && r?.checkoutUiVersion !== '') {
        this.apiService.applyRemoteCheckoutUiVersionAndReload(r.checkoutUiVersion);
      }
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
    if (this.getTotalSale.q >= this.cartMax) {
      this.beep(this.sfxMax);
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
    this.beep(this.sfxAdd);
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
    this.beep(this.sfxRemove);
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
        let raw = s?.v ?? s;
        // Older kiosk writes double-wrapped { v: { v: list } } via storage.set
        if (raw && !Array.isArray(raw) && Array.isArray((raw as any).v)) {
          raw = (raw as any).v;
        }
        const fallback = ApiService.vendingOnSale || [];
        const items = JSON.parse(
          JSON.stringify(Array.isArray(raw) && raw.length ? raw : fallback)
        ) as IVendingMachineSale[];
        this.saleList = items;
        this.syncVendingOnSale(items);
        this.ref.detectChanges();
      } catch { }
    });
  }

  /** StocksalePage reads ApiService.vendingOnSale — keep it in sync with kiosk shelf. */
  private syncVendingOnSale(items: IVendingMachineSale[]): void {
    if (!Array.isArray(items)) return;
    ApiService.vendingOnSale.length = 0;
    ApiService.vendingOnSale.push(...items);
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

    const url = downloadPhotoUrl(id, 1024, 1024);
    const stored = await this.appCaching.getPhoto(url + key);
    const hit = this.asImageData(this.unwrapPhoto(stored));
    if (this.isPhotoData(hit)) {
      this.apiService.imageList[key] = hit;
      return;
    }
    if (navigator.onLine === false) return;

    const raw = await this.appCaching.saveCachingPhoto(
      url,
      new Date(sl?.stock?.updatedAt || 0), // 0 = never force-refresh
      key,
    );
    const v = this.asImageData(this.unwrapPhoto(raw));
    if (this.isPhotoData(v)) this.apiService.imageList[key] = v;
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

      /// seed fake
      this.showcase.seedFake(this.saleList);
      ///

      // await this.showcase.sync();

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



  showcaseOf = (sl: any) => this.showcase.get(Number(sl?.stock?.id));

  /** Legacy sync hint only; attract resolves via VideoCacheService.resolvePlayable. */
  videoSrcOf = (hash: string) => {
    try {
      const cached = this.videoCache.getPlayableUrl?.(hash);
      if (cached && (cached.startsWith('blob:') || cached.startsWith('data:') || cached.startsWith('capacitor:'))) {
        return cached;
      }
      return '';
    } catch {
      return '';
    }
  };
  /** Product card Details button */
  openShowcase(sl: any, ev?: Event) {
    ev?.stopPropagation();
    this.openAttractModal({ sl, auto: false });
  }
  async openAttractModal(opts?: { sl?: any; auto?: boolean }): Promise<void> {
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
        showcaseOf: this.showcaseOf,
        videoSrcOf: this.videoSrcOf,
        itemHoldMs: this.demoItemMs, // 10000
        fallback: this.hmLogo,
        shelfId: 'shelf',
        auto: opts?.auto !== false,
        startAt: opts?.sl || null,
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
    this.syncVendingOnSale(next);
    try {
      // storage.set already wraps { v, d } — pass the list only
      this.storage.set('saleStock', next, 'stock');
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
    // Same as Tab1 footer "IOS & Android" — tap ×6 then password.
    this.armTap(6, async () => {
      await this.openSettingNow();
    });
  }

  showQrConfig(): void {
    this.armTap(6, async () => {
      await this.openQrConfigNow();
    });
  }

  /** Open Setting after password (no multi-tap) — for gear menu. */
  async openSettingNow(): Promise<void> {
    if (!(await this.requireAdminPassword())) return;
    this.apiService.showModal(SettingPage).then((r) => r?.present());
  }

  async openQrConfigNow(): Promise<void> {
    if (!(await this.requireAdminPassword())) return;
    this.apiService.showModal(QrconfigMachinePage).then((r) => r?.present());
  }

  /** Gear: tap counts toward showSetting (Tab1). Hold ~0.8s opens kiosk demo menu. */
  holdGearMenu(ev: Event): void {
    ev.stopPropagation();
    this.gearHeldOpen = false;
    clearTimeout(this.gearHoldTimer);
    this.gearHoldTimer = setTimeout(() => {
      this.gearHeldOpen = true;
      this.menuOpen = true;
      this.ref.detectChanges();
    }, 800);
  }

  endGearMenu(): void {
    clearTimeout(this.gearHoldTimer);
    this.gearHoldTimer = null;
  }

  onGearClick(ev: Event): void {
    ev.stopPropagation();
    this.endGearMenu();
    if (this.gearHeldOpen) {
      this.gearHeldOpen = false;
      return;
    }
    if (this.menuOpen) {
      this.closeMenu();
      return;
    }
    this.showSetting();
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

  async topUpEwallet(): Promise<void> {
    try {
      const walletId = await this.promptWalletId();
      if (!walletId) return;

      const currentDbBalance = await this.blockchainDbService.getLocalBalance(
        this.machineId?.machineId
      );
      if (currentDbBalance <= 0) return;

      const offlineMode = localStorage.getItem('offlineMode') === 'true';
      await this.updateBalance(-currentDbBalance);

      let syncSuccess = false;
      if (!offlineMode) {
        try {
          await this.syncToServer(walletId);
          syncSuccess = true;
        } catch {
          syncSuccess = false;
        }
      } else {
        syncSuccess = true;
      }

      if (syncSuccess) {
        this.currentBalance.value = 0;
        this.apiService.localBalance = 0;
        this.ref.detectChanges();
      }
    } catch (error) {
      console.error('Failed to top up e-wallet:', error);
    }
  }

  async openTestMotor(): Promise<void> {
    if (!this.testMotorTimer) {
      this.testMotorTimer = setTimeout(() => {
        this.testMotorCount = 7;
        this.testMotorTimer = null;
      }, 1500);
    }
    if (--this.testMotorCount <= 0) {
      this.testMotorCount = 7;
      if (this.testMotorTimer) {
        clearTimeout(this.testMotorTimer);
        this.testMotorTimer = null;
      }
      const xp = prompt('password1');
      if (xp + '' === '1234567890_laoapps.*..') {
        await this.serial?.close?.();
        localStorage.setItem('startTestMotor', 'true');
        this.apiService.reloadPage();
      } else {
        this.apiService.alertError('ສຳເຫຼັດແລ້ວ');
      }
    }
  }

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

  getPassword(): string {
    let x = '';
    (this.apiService.machineuuid || '').split('').forEach((v: string) => {
      if (!Number.isNaN(Number.parseInt(v, 10))) x += v;
    });
    return x;
  }

  private async requireAdminPassword(): Promise<boolean> {
    const x = (await this.promptPassword()) || '';
    const otp = this.machineId?.otp || this.apiService.machineId?.otp;
    return (
      this.getPassword().endsWith(x?.substring(6) || '') &&
      !!x?.startsWith(otp || '') &&
      x.length >= 12
    );
  }

  private async promptPassword(length = 12): Promise<string | null> {
    const modal = await this.modal.create({
      component: NumpadModalComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 1],
      componentProps: {
        title: 'Password Required',
        subtitle: 'Enter your 12-digit Password',
        length,
      },
    });
    this.numpadModal = modal;
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (this.numpadModal === modal) this.numpadModal = undefined;
    return role === 'confirm' ? data : null;
  }

  private async promptWalletId(): Promise<string | null> {
    const modal = await this.modal.create({
      component: NumpadModalComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 1],
      componentProps: {
        title: 'Top up e-wallet',
        subtitle: 'Enter your 8-digit LaabX wallet number',
        length: 8,
        hideByDefault: false,
      },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    return role === 'confirm' ? data : null;
  }

  async showQrAlert(): Promise<void> {
    const m = await this.apiService.showModal(QrOpenStockPage);
    m?.present();
    this.isOpenStock = true;
    m?.onDidDismiss().then(() => {
      this.isOpenStock = false;
    });
  }

  /** Same as Tab1 logo → password + stock refill. */
  async manageStock(): Promise<void> {
    this.closeMenu();
    if (this.qrMode) {
      if (this.apiService.secret) this.showQrAlert();
      return;
    }
    if (!(await this.requireAdminPassword())) return;
    await this.openManageStock();
  }

  /** StocksalePage → StockPage reads apiService.stock (Tab1 fills this on boot). */
  private async ensureProductCatalog(): Promise<void> {
    if (this.apiService.stock?.length) return;
    try {
      const cached = await this.storage.get('productItems', 'item');
      const items = cached?.v;
      if (Array.isArray(items) && items.length) {
        this.apiService.stock.length = 0;
        this.apiService.stock.push(...JSON.parse(JSON.stringify(items)));
        return;
      }
    } catch { }
    try {
      const rx = await this.apiService.loadVendingSale();
      const r: any = rx?.data;
      if (r?.status == 1 && Array.isArray(r.data) && r.data.length) {
        this.apiService.newProductItems(r.data);
        return;
      }
    } catch (e) {
      console.log('kiosk ensureProductCatalog', e);
    }
    if (this.saleList?.length) {
      this.apiService.newProductItems(this.saleList);
    }
  }

  async openManageStock(): Promise<void> {
    try {
      // StocksalePage constructor uses ApiService.vendingOnSale only
      this.syncVendingOnSale(this.saleList?.length ? this.saleList : ApiService.vendingOnSale);
      if (!ApiService.vendingOnSale?.length) {
        await new Promise<void>((resolve) => {
          this.storage.get('saleStock', 'stock').then((s) => {
            try {
              let raw = s?.v ?? s;
              if (raw && !Array.isArray(raw) && Array.isArray((raw as any).v)) {
                raw = (raw as any).v;
              }
              if (Array.isArray(raw) && raw.length) {
                this.saleList = JSON.parse(JSON.stringify(raw));
                this.syncVendingOnSale(this.saleList);
              }
            } catch { }
            resolve();
          }).catch(() => resolve());
        });
      }

      // Stock picker (StockPage) needs apiService.stock product catalog
      await this.ensureProductCatalog();

      const m =
        (await this.apiService.showModal(StocksalePage, {}, false)) ||
        ({} as HTMLIonModalElement);
      m.onDidDismiss?.().then((r) => {
        const d = r?.data as { resetCashCount?: boolean };
        const k = 'refillSaleStock';
        this.storage.get(k + '_', k).then((rx) => {
          const b = rx?.v as Array<IVendingMachineSale>;
          const s = b ? b : [];
          const u = new Date();
          const onSale = ApiService.vendingOnSale || this.saleList || [];
          onSale.forEach((v) => (v.updatedAt = u));
          s.unshift(...onSale);
          this.storage.set(k + '_', s, k);
        });
        if (d?.resetCashCount) {
          this.resetCashAcceptor();
        }
        // After StocksalePage save, static list is source of truth
        if (ApiService.vendingOnSale?.length) {
          this.saleList = JSON.parse(JSON.stringify(ApiService.vendingOnSale));
        }
        this.loadStock();
        this.ref.detectChanges();
      });
      await m.present?.();
    } catch (error) {
      console.log('openManageStock', error);
    }
  }

  async resetCashAcceptor(): Promise<void> {
    try {
      await this.serial?.nv9Command?.(EMACHINE_COMMAND.NV9_RESET, {}, Date.now());
      await this.updateBalance(-this.currentBalance.value);
      await this.syncToServer();
      this.currentBalance.value = 0;
      this.apiService.localBalance = 0;
      this.ref.detectChanges();
    } catch (error) {
      console.error('Failed to reset NV9:', error);
    }
  }

  private async updateBalance(amount: number): Promise<void> {
    if (amount === 0) return;
    try {
      const isInsert = amount > 0;
      const absAmount = Math.abs(amount);
      const latest = await this.blockchainDbService.getLatestBlock(this.machineId.machineId);
      const prevHash =
        latest?.hash || '0000000000000000000000000000000000000000000000000000000000000000';
      const nextIndex = (latest?.block_index ?? 0) + 1;
      const txData = {
        type: isInsert ? 'insert' : 'withdrawal',
        amount: absAmount,
        timestamp: new Date().toISOString(),
        note: isInsert ? 'Banknote accepted' : 'Cash reset / transferred to e-wallet',
      };
      const blockString = JSON.stringify({
        prevHash,
        index: nextIndex,
        data: txData,
        timestamp: txData.timestamp,
      });
      const newHash = CryptoJS.SHA256(blockString).toString();
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
      this.apiService.localBalance = this.currentBalance.value;
      this.ref.detectChanges();
    } catch (err) {
      console.error('Failed to update balance / log transaction:', err);
    }
  }

  private async syncToServer(LaabXWallet: string = ''): Promise<void> {
    if (localStorage.getItem('offlineMode') === 'true') return;
    const unsynced = await this.blockchainDbService.getUnsyncedBlocks(
      this.machineId.machineId,
      200
    );
    if (!unsynced.length) return;
    const res = await this.apiService.blockChainSync(unsynced, LaabXWallet);
    if (res?.status === 1) {
      await this.blockchainDbService.markAsSynced(unsynced.map((b) => b.id));
      if (unsynced.length === 200) {
        setTimeout(() => this.syncToServer(LaabXWallet), 1500);
      }
    } else {
      throw new Error('Server returned non-success status');
    }
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
    if (this.processLoadedPaidBills) return;
    this.processLoadedPaidBills = true;

    try {
      const data = (await this.apiService.IndexedDB.getBillProcesses()) ?? [];
      if (data.length > 0) {
        this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Click loadPaidBills Local ${JSON.stringify(data)}`,
        });
        this.showBills();
        return;
      }

      try {
        const re = await this.apiService.loadPaidBills();
        const r = re.data;
        Toast.show({ text: `Load paid bills ${r?.data?.length}`, duration: 'short' });

        if (!r?.data?.length) {
          this.apiService.IndexedLogDB.addBillProcess({
            errorData: `Click loadPaidBills Server ${JSON.stringify(r?.data)}`,
          });
          this.showBills();
        }

        const m = await this.apiService.showModal(BillNotDropPage, {}, true, 'customModalLarge');
        if (m) {
          m.present();
          let timeout: any;
          const resetTimeout = () => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => m.dismiss(), 20000);
          };
          const events = ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'];
          const eventHandler = () => resetTimeout();
          events.forEach((event) => document.addEventListener(event, eventHandler, true));
          resetTimeout();
          m.onDidDismiss().then(() => {
            if (timeout) clearTimeout(timeout);
            events.forEach((event) => document.removeEventListener(event, eventHandler, true));
          });
        }
      } catch (er: any) {
        this.apiService.IndexedLogDB.addBillProcess({
          errorData: `Error Click loadPaidBills ${JSON.stringify(er)}`,
        });
        Toast.show({ text: `Load paid bills error ${er?.message || er}` });
      }
    } finally {
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `finally Click loadPaidBills` });
      Toast.show({ text: `Load paid bills finally`, duration: 'short' });
      this.processLoadedPaidBills = false;
    }
  }

  showBills(): void {
    this.apiService.loadDeliveryingBillsNew().then((r) => {
      try {
        if (r.length > 0) {
          this.apiService.pb = r as Array<IBillProcess>;
          if (this.apiService.pb.length) {
            this.apiService.isDropStock = true;
            if (!this.apiService.isRemainingBillsModalOpen) {
              if (this.serial) {
                if (localStorage.getItem('device') != 'ZDM8') {
                  const lastClick = this.apiService.checkOverLastSerialAction();
                  if (lastClick) {
                    this.apiService.exitApp();
                    return;
                  }
                }
                this.apiService
                  .showModal(RemainingbillsPage, { r: this.apiService.pb, serial: this.serial }, false)
                  .then((modal: any) => {
                    this.apiService.isRemainingBillsModalOpen = true;
                    this.apiService.IndexedLogDB.addBillProcess({
                      errorData: `RemainingbillsPage Open In Kiosk`,
                    });
                    modal.present();
                    modal.onDidDismiss().then(() => {
                      this.apiService.IndexedLogDB.addBillProcess({
                        errorData: `RemainingbillsPage Close In Kiosk`,
                      });
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
          this.apiService.toast.create({ message: '', duration: 5000 }).then((t) => t.present());
        }
      } catch (error: any) {
        this.apiService.toast
          .create({ message: error.message, duration: 5000 })
          .then((t) => t.present());
      }
    }).catch((e) => {
      Toast.show({ text: 'Error showBills ' + JSON.stringify(e), duration: 'long' });
    });
  }

  async _processLoopCheckLaoQRPaid(): Promise<void> {
    // dock already polls QR; keep for old call sites
  }





  private sfxAdd = new Audio('assets/sounds/add.wav');
  private sfxRemove = new Audio('assets/sounds/remove.wav');
  private sfxMax = new Audio('assets/sounds/max.wav');

  private beep(a: HTMLAudioElement) {
    try {
      a.currentTime = 0;
      a.volume = 0.7;
      a.play();
    } catch { }
  }






}