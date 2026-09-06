import { Injectable, NgZone } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class IdleService {
    private idleTimer: any;
    private idleTime = 30000; // 1 นาที
    private adsModal: HTMLIonModalElement | null = null;
    private disabled = true;   // ← add

    constructor(
        private modalCtrl: ModalController,
        public apiService: ApiService,
        private ngZone: NgZone
    ) {
        this.startWatching();
    }
    disable() {
        this.disabled = true;
        clearTimeout(this.idleTimer);
        this.closeAds();
    }

    enable() {
        this.disabled = false;
        this.resetTimer();
    }

    private startWatching() {
        // reset idle เมื่อมีการแตะ/คลิก/scroll
        ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'].forEach(event => {
            document.addEventListener(event, () => this.resetTimer());
        });

        this.resetTimer();
    }

    private resetTimer() {
        clearTimeout(this.idleTimer);
        if (this.disabled) return;
        this.idleTimer = setTimeout(() => {
            this.showAds();
        }, this.idleTime);
    }

    private async showAds() {
        if (this.disabled) return;
        // ✅ เช็คก่อนว่ามี modal อะไรเปิดอยู่หรือเปล่า
        if (this.apiService.isAds) {
            const topModal = await this.modalCtrl.getTop();
            if (topModal) {
                // มี modal เปิดอยู่ → ยังไม่เปิด ads, รอไปก่อน
                this.resetTimer();
                return;
            }

            if (this.adsModal) return; // ads เปิดอยู่แล้ว

            this.adsModal = await this.modalCtrl.create({
                component: (await import('../ads/ads.page')).AdsPage,
                cssClass: 'dialog-fullscreen',
                backdropDismiss: true
            });

            this.adsModal.onDidDismiss().then(() => {
                this.adsModal = null;
                this.resetTimer(); // เริ่มจับใหม่เมื่อปิด ads
            });

            await this.adsModal.present();
        }
    }

    public async closeAds() {
        if (this.adsModal) {
            await this.adsModal.dismiss();
        }
    }
}
