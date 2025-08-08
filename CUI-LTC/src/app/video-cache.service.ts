import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root'
})
export class VideoCacheService {

  constructor() { }

  async getCachedVideoBase64(videoUrl: string): Promise<string> {
    const fileName = this.generateSafeFileName(videoUrl);

    try {
      // ลองอ่านไฟล์จาก local storage
      const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data,
      });

      console.log('[VideoCacheService] ✅ Loaded from cache:', videoUrl);
      return `data:video/mp4;base64,${result.data}`;
    } catch (error) {
      console.log('[VideoCacheService] ⬇️ Downloading:', videoUrl);

      // ดึงวิดีโอจาก network
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      // เขียนไฟล์ลง local storage
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data,
      });

      console.log('[VideoCacheService] ✅ Saved to cache:', fileName);
      return `data:video/mp4;base64,${base64Data}`;
    }
  }

  /**
   * แปลง blob เป็น base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * แปลง URL ให้เป็นชื่อไฟล์ที่ปลอดภัย
   */
  private generateSafeFileName(url: string): string {
    const encoded = encodeURIComponent(url);
    return encoded.endsWith('.mp4') ? encoded : `${encoded}.mp4`;
  }


  /**
   * (Optional) ลบ cache video ทีละไฟล์
   */
  async deleteCachedVideo(videoUrl: string): Promise<void> {
    const fileName = this.generateSafeFileName(videoUrl);

    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Data,
      });
      console.log('[VideoCacheService] 🗑️ Deleted:', fileName);
    } catch (error) {
      console.warn('[VideoCacheService] ❌ File not found to delete');
    }
  }

}
