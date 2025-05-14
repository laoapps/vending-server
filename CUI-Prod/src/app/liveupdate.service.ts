import { Injectable } from '@angular/core';
import { DownloadBundleOptions, LiveUpdate } from '@capawesome/capacitor-live-update';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './services/api.service';
import { environment } from 'src/environments/environment.prod';
import { App } from '@capacitor/app';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { WebView } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class LiveupdateService {
  private serverUrl = 'https://tvending.khamvong.com';

  constructor(private http: HttpClient,
    private apiService: ApiService

  ) { }



  async checkForUpdates(version: string): Promise<{ bundleId: string; url: string; channel: string } | undefined> {

    const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
    const url = `${vending_server}/latest-bundle?bundleId=${version}`;
    console.log('Checking for updates at:', url);

    try {
      // Add download progress listener


      // Reset plugin state
      console.log('Resetting plugin state');
      await LiveUpdate.reset();

      // Fetch bundle metadata
      const latestBundle = await firstValueFrom(
        this.http.get<{ bundleId: string; url: string; channel: string } | { error: string }>(url, {
          headers: { 'X-Capawesome-App-Id': '6e351b4f-69a7-415e-a057-4567df7ffe94' }
        })
      );
      console.log('Latest bundle:', JSON.stringify(latestBundle));

      if ('error' in latestBundle) {
        console.error('Server returned error:', latestBundle.error);
        await this.updateAppData();
        return;
      }

      const bundleId = latestBundle.bundleId.trim();
      const bundleUrl = `${latestBundle.url}?t=${Date.now()}`;
      console.log('Bundle URL:', bundleUrl);

      // Download bundle
      console.log('Downloading bundle:', bundleId);
      await LiveUpdate.downloadBundle({
        url: bundleUrl,
        bundleId: bundleId
      });
      console.log('Bundle downloaded successfully');

      // Log available bundles
      const bundles = await LiveUpdate.getBundles();
      console.log('Available bundles:', JSON.stringify(bundles));

      if (!bundles.bundleIds.includes(bundleId)) {
        throw new Error(`Bundle ${bundleId} not found in available bundles`);
      }

      // Set next bundle
      console.log('Setting next bundle with ID:', bundleId);
      await LiveUpdate.setBundle({ bundleId: bundleId });
      console.log('Bundle set as next bundle');

      // Notify app is ready
      console.log('Notifying app is ready');
      await LiveUpdate.ready();

      // Reload app
      console.log('Reloading app');
      await LiveUpdate.reload();
      console.log('App reloaded with new update');
    } catch (error) {
      console.error('Update process failed:', error);
      // Log available bundles on error
      const bundles = await LiveUpdate.getBundles();
      console.log('Available bundles on error:', JSON.stringify(bundles));
      throw error;
    } finally {

    }






    // const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
    // const url = `${vending_server}/latest-bundle?bundleId=${version}`;
    // console.log('Checking for updates at:', url);

    // try {
    //   // Add download progress listener


    //   // Reset plugin state to clear any stale bundles
    //   console.log('Resetting plugin state');
    //   await LiveUpdate.reset();

    //   // Fetch bundle metadata with appId header
    //   const latestBundle = await firstValueFrom(
    //     this.http.get<{ bundleId: string; url: string; channel: string } | { error: string }>(url, {
    //       headers: { 'X-Capawesome-App-Id': '6e351b4f-69a7-415e-a057-4567df7ffe94' }
    //     })
    //   );
    //   console.log('Latest bundle:', JSON.stringify(latestBundle));

    //   if ('error' in latestBundle) {
    //     console.error('Server returned error:', latestBundle.error);
    //     await this.updateAppData();
    //     return;
    //   }

    //   const bundleId = latestBundle.bundleId.trim();
    //   const bundleUrl = `${latestBundle.url}?t=${Date.now()}`;
    //   console.log('Bundle URL:', bundleUrl);

    //   // Download bundle
    //   console.log('Downloading bundle:', bundleId);
    //   await LiveUpdate.downloadBundle({
    //     url: bundleUrl,
    //     bundleId: bundleId
    //   });
    //   console.log('Bundle downloaded successfully');

    //   // Log available bundles
    //   const bundles = await LiveUpdate.getBundles();
    //   console.log('Available bundles:', JSON.stringify(bundles));

    //   if (!bundles.bundleIds.includes(bundleId)) {
    //     throw new Error(`Bundle ${bundleId} not found in available bundles`);
    //   }

    //   // Set next bundle
    //   console.log('Setting next bundle with ID:', bundleId);
    //   await LiveUpdate.setBundle({ bundleId: bundleId });
    //   console.log('Bundle set as next bundle');

    //   // Notify app is ready
    //   console.log('Notifying app is ready');
    //   await LiveUpdate.ready();

    //   // Reload app
    //   console.log('Reloading app');
    //   await LiveUpdate.reload();
    //   console.log('App reloaded with new update');
    // } catch (error) {
    //   console.error('Update process failed:', error);
    //   // Log available bundles on error
    //   const bundles = await LiveUpdate.getBundles();
    //   console.log('Available bundles on error:', JSON.stringify(bundles));
    //   throw error;
    // } finally {

    // }
















    try {

      // const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
      // const url = `${vending_server}/latest-bundle?bundleId=${version}`;
      // console.log('Checking for updates at:', url);

      // try {
      //   const latestBundle = await firstValueFrom(
      //     this.http.get<{ bundleId: string; url: string; channel: string } | { error: string }>(url)
      //   );
      //   console.log('Latest bundle:', JSON.stringify(latestBundle));

      //   if ('error' in latestBundle) {
      //     console.error('Server returned error:', latestBundle.error);
      //     await this.updateAppData();
      //     return undefined;
      //   }

      //   const bundleId = latestBundle.bundleId.trim();
      //   const bundleUrl = `${latestBundle.url}?t=${Date.now()}`;
      //   console.log('Bundle URL:', bundleUrl);

      //   try {
      //     await LiveUpdate.downloadBundle({
      //       url: bundleUrl,
      //       bundleId: bundleId,
      //     });
      //     console.log('Bundle downloaded successfully');
      //   } catch (error) {
      //     console.error('Bundle download failed:', error);
      //     throw error;
      //   }

      //   // Log available bundles
      //   const bundles = await LiveUpdate.getBundles();
      //   console.log('Available bundles:', JSON.stringify(bundles));

      //   try {
      //     console.log('Setting next bundle with ID:', bundleId);
      //     await LiveUpdate.setBundle({ bundleId: bundleId });
      //     console.log('Bundle set as next bundle');
      //   } catch (error) {
      //     console.error('Failed to set next bundle:', error);
      //     throw error;
      //   }

      //   try {
      //     await LiveUpdate.reload();
      //     console.log('App reloaded with the new update');
      //   } catch (error) {
      //     console.error('Reload failed:', error);
      //     throw error;
      //   }
      // } catch (error) {
      //   console.error('Update process failed:', error);
      // }



      // const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
      // const url = `${vending_server}/latest-bundle?bundleId=${version}`;
      // console.log('Checking for updates at:', url);
      // const latestBundle = await firstValueFrom(
      //   this.http.get<{ bundleId: string; url: string; channel: string } | { error: string }>(url)
      // );
      // console.log('Latest bundle:', JSON.stringify(latestBundle));

      // if ('error' in latestBundle) {
      //   console.error('Server returned error:', latestBundle.error);
      //   await this.updateAppData();
      //   return undefined;
      // }
      // const bundleUrl = `${latestBundle.url}?t=${Date.now()}`;
      // console.log('Bundle URL:', bundleUrl);
      // await LiveUpdate.reset();
      // console.log('Bundle reset successfully');
      // await LiveUpdate.downloadBundle({
      //   url: bundleUrl,
      //   bundleId: latestBundle.bundleId,
      // });
      // console.log('Bundle downloaded successfully');
      // const bundles = await LiveUpdate.getBundles();
      // console.log('Available bundles:', JSON.stringify(bundles));
      // await LiveUpdate.setBundle({ bundleId: latestBundle.bundleId });
      // console.log('Bundle set as current bundle');

      // await LiveUpdate.reload(); // Reloads the app with the new bundle
      // console.log('App reloaded with the new update');


      // const latestBundle = await firstValueFrom(
      //   this.http.get<{ bundleId: string; url: string; channel: string } | { error: string }>(url)
      // );

      // if ('error' in latestBundle) {
      //   console.error('Server returned error:', latestBundle.error);
      //   await this.updateAppData();
      //   return undefined;
      // }

      // console.log('Latest bundle:', JSON.stringify(latestBundle));

      // const isNewBundleAvailable = await this.isNewBundleAvailable(latestBundle.bundleId);
      // console.log('Is new bundle available:', isNewBundleAvailable);

      // if (isNewBundleAvailable) {
      //   console.log('New bundle available, downloading...', latestBundle.url);
      //   await this.clearAppData();
      //   // เพิ่ม query string เพื่อป้องกัน cache
      //   const bundleUrl = `${latestBundle.url}?t=${Date.now()}`;
      //   // await LiveUpdate.downloadBundle({
      //   //   url: bundleUrl,
      //   //   bundleId: latestBundle.bundleId,
      //   // });
      //   // console.log('Bundle downloaded successfully');
      //   // // ตรวจสอบว่า bundle ใหม่ถูกดาวน์โหลดสำเร็จ
      //   // const bundles = await LiveUpdate.getBundles();
      //   // console.log('Available bundles:', JSON.stringify(bundles));

      //   // await LiveUpdate.setBundle({ bundleId: latestBundle.bundleId });
      //   // console.log('Bundle set as current bundle');

      //   // // ตรวจสอบว่า bundle ใหม่ถูกตั้งค่าถูกต้อง
      //   // const { bundleId: currentBundleId } = await LiveUpdate.getBundle();
      //   // if (currentBundleId !== latestBundle.bundleId) {
      //   //   console.error('Bundle not set correctly:', currentBundleId);
      //   //   return latestBundle;
      //   // }

      //   // // เพิ่ม delay เพื่อให้ plugin ประมวลผล
      //   // await new Promise(resolve => setTimeout(resolve, 5000));
      //   // await LiveUpdate.reload().then(() => {
      //   //   console.log('App reloaded with the new update');
      //   // }).catch((error) => {
      //   //   console.error('Error reloading app:', error);
      //   // });

      //   // await this.updateAppData();
      //   // await this.showToast(`App updated to version ${latestBundle.bundleId}`);
      //   // console.log('Bundle downloaded and set as current bundle.');
      //   // return latestBundle;
      // } else {
      //   console.log('No new bundle available.');
      //   await this.updateAppData();
      //   return undefined;
      // }
    } catch (error) {
      console.error('Error checking for update:', error);
      await this.updateAppData();
      return undefined;
    }
  }

  async updateAppData() {
    try {
      const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
      const data = await firstValueFrom(
        this.http.get<{ items: any[] }>(`${vending_server}/api/data`)
      );
      const bundleId = await this.getCurrentBundleId() || 'unknown';
      await Storage.set({
        key: 'appData',
        value: JSON.stringify({ data, bundleId }),
      });
      console.log('App data updated for bundle:', bundleId);
    } catch (error) {
      console.error('Error updating app data:', error);
    }
  }

  async getAppData() {
    const { value } = await Storage.get({ key: 'appData' });
    return value ? JSON.parse(value) : null;
  }

  async clearAppData() {
    try {
      await Storage.remove({ key: 'appData' });
      console.log('App data cleared');
    } catch (error) {
      console.error('Error clearing app data:', error);
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

  async getCurrentBundleId(): Promise<string | null> {
    try {
      const { bundleId } = await LiveUpdate.getBundle();
      return bundleId;
    } catch (error) {
      console.error('Error getting current bundle:', error);
      return null;
    }
  }

  async verifyBundle() {
    try {
      const { bundleId } = await LiveUpdate.getBundle();
      console.log('Current bundle ID:', bundleId);
      return bundleId;
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
    const toast = await this.apiService.toast.create({
      message,
      duration: 2000,
    });
    await toast.present();
  }
}

// async checkForUpdates(version: string): Promise<any> {
//   try {
//     const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
//     const url = `${vending_server}/latest-bundle?bundleId=${version}`;
//     console.log('Checking for updates at:', url);

//     const latestBundle = await firstValueFrom(
//       this.http.get<{ bundleId: string; url: string; channel: string }>(
//         url
//       )
//     );

//     console.log('Latest bundle:', JSON.stringify(latestBundle));


//     const isNewBundleAvailable = await this.isNewBundleAvailable(latestBundle.bundleId);
//     console.log('Is new bundle available:', isNewBundleAvailable);
//     if (isNewBundleAvailable) {
//       console.log('New bundle available, downloading...', latestBundle.url);
//       await LiveUpdate.downloadBundle({
//         url: latestBundle.url,
//         bundleId: latestBundle.bundleId,
//       });

//       await LiveUpdate.setBundle({ bundleId: latestBundle.bundleId });
//       await LiveUpdate.reload().then(() => {
//         console.log('App reloaded with the new update');

//       }).catch((error) => {
//         console.log('Error reloading app:', error);
//       });

//       console.log('Bundle downloaded and set as next bundle.');
//       return latestBundle;
//     } else {
//       console.log('No new bundle available.');
//     }
//   } catch (error) {
//     console.error('Error checking for update:', error);
//   }
// }


// async isNewBundleAvailable(latestBundleId: string): Promise<boolean> {
//   try {
//     const { bundleId: currentBundleId } = await LiveUpdate.getBundle();
//     return latestBundleId !== currentBundleId;
//   } catch (error) {
//     console.error('Error checking bundle availability:', error);
//     return false;
//   }
// }



// async checkBundleExists(bundleId: string): Promise<boolean> {
//   try {
//     await Filesystem.readdir({
//       path: '',
//       directory: Directory.Data,
//     }).then(r => {
//       console.log('read dir', JSON.stringify(r));
//       const folderContent = r.files.map((file) => ({
//         name: file.name,
//         isFile: file.type === 'file', // Capacitor provides type: 'file' or 'directory'
//         isDirectory: file.type === 'directory',
//       }));

//       console.log('Folder contents:', JSON.stringify(folderContent));
//     })
//     await Filesystem.stat({
//       path: `${bundleId}`,
//       directory: Directory.Data,
//     });
//     console.log(`Bundle ${bundleId} found in storage`);
//     return true;
//   } catch (error) {
//     console.warn(`Bundle ${bundleId} not found in storage:`, error);
//     return false;
//   }
// }

// async deleteOldBundle(bundleId: string) {
//   try {
//     await Filesystem.rmdir({
//       path: `${bundleId}`,
//       directory: Directory.Data,
//       recursive: true,
//     });
//     console.log(`Deleted old bundle: ${bundleId}`);
//   } catch (error) {
//     console.warn('Error deleting old bundle:', error);
//   }
// }

// async updateAppData() {
//   try {
//     const vending_server = localStorage.getItem('vending_server') || environment.vending_server;
//     const data = await firstValueFrom(
//       this.http.get<{ items: any[] }>(`${vending_server.replace('http://', 'https://')}/api/data`)
//     );
//     const bundleId = await this.getCurrentBundleId() || 'unknown';
//     await Storage.set({
//       key: 'appData',
//       value: JSON.stringify({ data, bundleId }),
//     });
//     console.log('App data updated for bundle:', bundleId);
//   } catch (error) {
//     console.error('Error updating app data:', error);
//   }
// }

// async getAppData() {
//   const { value } = await Storage.get({ key: 'appData' });
//   return value ? JSON.parse(value) : null;
// }

// async clearAppData() {
//   try {
//     await Storage.remove({ key: 'appData' });
//     console.log('App data cleared');
//   } catch (error) {
//     console.error('Error clearing app data:', error);
//   }
// }



// async getCurrentBundleId(): Promise<string | null> {
//   try {
//     const { bundleId } = await LiveUpdate.getBundle();
//     return bundleId;
//   } catch (error) {
//     console.error('Error getting current bundle:', error);
//     return null;
//   }
// }

// async verifyBundle() {
//   try {
//     const { bundleId } = await LiveUpdate.getBundle();
//     console.log('Current bundle ID:', bundleId);
//     return bundleId;
//   } catch (error) {
//     console.error('Error verifying bundle:', error);
//     return null;
//   }
// }

// async resetToDefaultBundle() {
//   try {
//     await LiveUpdate.reset();
//     await LiveUpdate.reload();
//     console.log('Reset to default bundle');
//   } catch (error) {
//     console.error('Error resetting to default bundle:', error);
//   }
// }

// async showToast(message: string) {
//   const toast = await this.apiService.toast.create({
//     message,
//     duration: 2000,
//   });
//   await toast.present();
// }
