import { Injectable } from '@angular/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LiveupdateService {
  private serverUrl = 'http://localhost:9016';

  constructor(private http: HttpClient) { }

  async checkForUpdates(): Promise<any> {
    try {
      const latestBundle = await firstValueFrom(
        this.http.get<{ bundleId: string; url: string; channel: string }>(
          `${this.serverUrl}/latest-bundle?bundleId=1.0.103`
        )
      );

      const isNewBundleAvailable = await this.isNewBundleAvailable(latestBundle.bundleId);
      if (isNewBundleAvailable) {
        console.log('New bundle available, downloading...', latestBundle.url);
        await LiveUpdate.downloadBundle({
          url: latestBundle.url,
          bundleId: latestBundle.bundleId,
        });
        await LiveUpdate.setBundle({ bundleId: latestBundle.bundleId });
        await LiveUpdate.reload();
        console.log('Bundle downloaded and set as next bundle.');
      } else {
        console.log('No new bundle available.');
      }
    } catch (error) {
      console.error('Error checking for update:', error);
    }
  }


  async isNewBundleAvailable(latestBundleId: string): Promise<boolean> {
    try {
      const { bundleId: currentBundleId } = await LiveUpdate.getBundle();
      return latestBundleId !== currentBundleId;
    } catch (error) {
      console.error('Error checking bundle availability:', error);
      return false;
    }
  }

  async resetToDefaultBundle() {
    await LiveUpdate.reset();
    await LiveUpdate.reload();
  }
}
