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
        console.error('Server returned error:', latestBundle.error);
        await this.updateAppData();
        return undefined;
      }

      const bundleId = latestBundle.bundleId.trim();
      const bundleUrl = `${latestBundle.url}?t=${Date.now()}`;

      // Check if the bundle is new
      if (!(await this.isNewBundleAvailable(bundleId))) {
        console.log('No new bundle available.');
        await this.updateAppData();
        return undefined;
      }

      // Download bundle
      await LiveUpdate.downloadBundle({
        url: bundleUrl,
        bundleId: bundleId,
      });

      // Verify bundle
      const bundles = await LiveUpdate.getBundles();
      if (!bundles.bundleIds.includes(bundleId)) {
        throw new Error(`Bundle ${bundleId} not found in available bundles`);
      }

      // Set next bundle and reload
      await LiveUpdate.setNextBundle({ bundleId: bundleId });
      await LiveUpdate.ready();
      await LiveUpdate.reload();

      await this.updateAppData();
      await this.showToast(`App updated to version ${bundleId}`);
      return latestBundle;
    } catch (error) {
      console.error('Update process failed:', error);
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
      console.log('App data updated for bundle:', bundleId);
    } catch (error) {
      console.error('Error updating app data:', error);
    }
  }

  async getAppData() {
    const { value } = await Preferences.get({ key: 'appData' });
    return value ? JSON.parse(value) : null;
  }

  async clearAppData() {
    try {
      await Preferences.remove({ key: 'appData' });
      console.log('App data cleared');
    } catch (error) {
      console.error('Error clearing app data:', error);
    }
  }

  async isNewBundleAvailable(latestBundleId: string): Promise<boolean> {
    try {
      const { bundleIds } = await LiveUpdate.getBundles();
      return bundleIds.length > 0 ? latestBundleId !== bundleIds[0] : true;
    } catch (error) {
      console.error('Error checking bundle availability:', error);
      return false;
    }
  }

  async getCurrentBundleId(): Promise<string | null> {
    try {
      const { bundleIds } = await LiveUpdate.getBundles();
      return bundleIds.length > 0 ? bundleIds[0] : null;
    } catch (error) {
      console.error('Error getting current bundle:', error);
      return null;
    }
  }

  async verifyBundle() {
    try {
      const { bundleIds } = await LiveUpdate.getBundles();
      console.log('Current bundle ID:', bundleIds);
      return bundleIds.length > 0 ? bundleIds[0] : null;
    } catch (error) {
      console.error('Error verifying bundle:', error);
      return null;
    }
  }

  async resetToDefaultBundle() {
    try {
      await LiveUpdate.reset();
      await LiveUpdate.reload();
      console.log('Reset to default bundle');
    } catch (error) {
      console.error('Error resetting to default bundle:', error);
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
      console.error('Error showing toast:', error);
    }
  }
}