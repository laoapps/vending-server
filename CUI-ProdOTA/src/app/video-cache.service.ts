import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http'; // Import this
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root'
})
export class VideoCacheService {
  public downloadProgress = 0;
  constructor(private ngZone: NgZone) {
    // Listen for global download progress events
    Filesystem.addListener('progress', (status) => {
      this.ngZone.run(() => {
        this.downloadProgress = Math.round((status.bytes / status.contentLength) * 100);
        console.log(`Download progress: ${this.downloadProgress}%`);
      });
    });
  }

  private getFileName(url: string): string {
    // Using a simple split, but btoa is a good fallback for messy URLs
    return url.split('/').pop() || btoa(url);
  }

  async getLocalPath(url: string): Promise<string | null> {
    const fileName = this.getFileName(url);
    try {
      const stat = await Filesystem.stat({
        path: fileName,
        directory: Directory.Data
      });
      return stat.uri;
    } catch {
      return null;
    }
  }



  async downloadIfNotExist(url: string): Promise<string> {
    const fileName = this.getFileName(url);
    const existing = await this.getLocalPath(url);

    if (existing) return existing;

    try {
      const result = await Filesystem.downloadFile({
        url: url,
        path: fileName,
        directory: Directory.Data,
        progress: true, // This enables the 'progress' listener above
      });

      return result.path || '';
    } catch (error) {
      console.error('Native download failed', error);
      throw error;
    }
  }




  getPlayableUrl(path: string): string {
    return Capacitor.convertFileSrc(path);
  }

  async deleteVideo(url: string): Promise<void> {
    const fileName = this.getFileName(url);
    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Data
      });
    } catch (e) {
      console.error("File already deleted or not found");
    }
  }
}