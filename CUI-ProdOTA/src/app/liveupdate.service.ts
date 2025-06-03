import { Injectable } from '@angular/core';
import { DownloadBundleOptions, LiveUpdate } from '@capawesome/capacitor-live-update';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './services/api.service';
import { environment } from 'src/environments/environment.prod';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class LiveupdateService {
  private serverUrl = 'https://tvending4.khamvong.com';
  private appId = '6e351b4f-69a7-415e-a057-4567df7ffe94';

  constructor(private http: HttpClient, private apiService: ApiService) { }

  async checkForUpdates(version: string): Promise<{ bundleId: string; url: string; channel: string } | undefined> {
    const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
    const url = `${vending_server}/latest-bundle?bundleId=${version}`;

    try {
      // Reset plugin state
      await LiveUpdate.reset();

      // Fetch bundle metadata
      const latestBundle = await firstValueFrom(
        this.http.get<{ bundleId: string; url: string; channel: string } | { error: string }>(url, {
          headers: { 'X-Capawesome-App-Id': this.appId },
        })
      );

      if ('error' in latestBundle) {
        console.error('=====>Server returned error:', latestBundle.error);
        this.apiService.IndexedLogDB.addBillProcess({ errorData: `Server returned error:: ${latestBundle.error}` });
        await this.updateAppData();
        return undefined;
      }

      const bundleId = latestBundle.bundleId.trim();
      const bundleUrl = `${latestBundle.url}?t=${Date.now()}`;

      // Check if the bundle is new
      if (!(await this.isNewBundleAvailable(bundleId))) {
        console.log('=====>No new bundle available.');
        this.apiService.IndexedLogDB.addBillProcess({ errorData: 'No new bundle available.' });
        await this.updateAppData();
        return undefined;
      }

      // Download bundle
      await LiveUpdate.downloadBundle({
        url: bundleUrl,
        bundleId: bundleId,
      });

      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify bundle
      const bundles = await LiveUpdate.getBundles();
      if (!bundles.bundleIds.includes(bundleId)) {
        this.apiService.IndexedLogDB.addBillProcess({ errorData: `Bundle ${bundleId} not found in available bundles` });
        throw new Error(`Bundle ${bundleId} not found in available bundles`);
      }

      // Set next bundle and reload
      await LiveUpdate.setNextBundle({ bundleId: bundleId });
      await new Promise(resolve => setTimeout(resolve, 5000));

      await LiveUpdate.ready();
      await new Promise(resolve => setTimeout(resolve, 5000));

      await LiveUpdate.reload();
      await new Promise(resolve => setTimeout(resolve, 5000));

      await this.updateAppData();
      await this.showToast(`=====>App updated to version ${bundleId}`);
      return latestBundle;
    } catch (error) {
      console.error('=====>Update process failed:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Update process failed: ${JSON.stringify(error)}` });
      await this.updateAppData();
      return undefined;
    }
  }

  async updateAppData() {
    try {
      const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
      const data = await firstValueFrom(this.http.get<{ items: any[] }>(`${vending_server}/api/data`));
      const bundleId = await this.getCurrentBundleId() || 'unknown';
      await Preferences.set({
        key: 'appData',
        value: JSON.stringify({ data, bundleId }),
      });
      console.log('=====>App data updated for bundle:', bundleId);
    } catch (error) {
      console.error('=====>Error updating app data:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error updating app data: ${JSON.stringify(error)}` });
    }
  }

  async getAppData() {
    const { value } = await Preferences.get({ key: 'appData' });
    return value ? JSON.parse(value) : null;
  }

  async clearAppData() {
    try {
      await Preferences.remove({ key: 'appData' });
      console.log('=====>App data cleared');
    } catch (error) {
      console.error('=====>Error clearing app data:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error clearing app data: ${JSON.stringify(error)}` });
    }
  }

  async isNewBundleAvailable(latestBundleId: string): Promise<boolean> {
    try {
      const { bundleIds } = await LiveUpdate.getBundles();
      return bundleIds.length > 0 ? latestBundleId !== bundleIds[0] : true;
    } catch (error) {
      console.error('=====>Error checking bundle availability:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error checking bundle availability: ${JSON.stringify(error)}` });
      return false;
    }
  }

  async getCurrentBundleId(): Promise<string | null> {
    try {
      const { bundleIds } = await LiveUpdate.getBundles();
      return bundleIds.length > 0 ? bundleIds[0] : null;
    } catch (error) {
      console.error('=====>Error getting current bundle:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error getting current bundle: ${JSON.stringify(error)}` });
      return null;
    }
  }

  async verifyBundle() {
    try {
      const { bundleIds } = await LiveUpdate.getBundles();
      console.log('=====>Current bundle ID:', bundleIds);
      return bundleIds.length > 0 ? bundleIds[0] : null;
    } catch (error) {
      console.error('=====>Error verifying bundle:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error verifying bundle: ${JSON.stringify(error)}` });
      return null;
    }
  }

  async resetToDefaultBundle() {
    try {
      await LiveUpdate.reset();
      await LiveUpdate.reload();
      console.log('=====>Reset to default bundle');
    } catch (error) {
      console.error('=====>Error resetting to default bundle:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error resetting to default bundle: ${JSON.stringify(error)}` });
    }
  }

  async showToast(message: string) {
    try {
      const toast = await this.apiService.toast.create({
        message,
        duration: 2000,
      });
      await toast.present();
    } catch (error) {
      console.error('=====>Error showing toast:', JSON.stringify(error));
      this.apiService.IndexedLogDB.addBillProcess({ errorData: `Error showing toast: ${JSON.stringify(error)}` });
    }
  }


  async cleanupOldBundles() {
    try {
      // 1. ดึงข้อมูล Bundle ปัจจุบันที่กำลังทำงานอยู่ (สมมติว่าเรามีวิธีหามาได้)
      // วิธีที่น่าเชื่อถือที่สุดคือการอ่านจากไฟล์ version.json ใน assets
      const activeBundleId = await this.getCurrentActiveBundleId(); // คุณต้องสร้างฟังก์ชันนี้เอง

      // 2. ดึงรายการ Bundle ทั้งหมดที่ดาวน์โหลดไว้
      const { bundleIds } = await LiveUpdate.getBundles();

      console.log(`Active bundle is ${activeBundleId}. All bundles:`, bundleIds);

      // 3. วนลูปเพื่อลบ Bundle ที่ไม่ใช่ตัวที่กำลังใช้งานอยู่
      for (const bundleId of bundleIds) {
        if (bundleId !== activeBundleId) {
          console.log(`Deleting old bundle: ${bundleId}`);
          await LiveUpdate.deleteBundle({ bundleId });
        }
      }
    } catch (error) {
      console.error('Error cleaning up old bundles:', error);
    }
  }

  // ตัวอย่างฟังก์ชันอ่านเวอร์ชันปัจจุบัน (ต้องมีไฟล์ src/assets/version.json)
  async getCurrentActiveBundleId(): Promise<string> {
    const result = await this.http.get<{ version: string }>('/assets/version.json').toPromise();
    return result.version;
  }
}