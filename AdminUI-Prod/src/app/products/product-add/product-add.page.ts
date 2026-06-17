import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { IStock } from 'src/app/services/syste.model';
import * as uuid from "uuid";

@Component({
  selector: 'app-product-add',
  templateUrl: './product-add.page.html',
  styleUrls: ['./product-add.page.scss'],
})
export class ProductAddPage implements OnInit {
  showImage: (p: string) => string;
  s = { isActive: false } as IStock;
  loaded: boolean = false;
  imageSrc: string = '';




  constructor(public apiService: ApiService) {
    this.showImage = this.apiService.showImage;
  }

  ngOnInit() {

  }
  close() {
    this.apiService.closeModal()
  }
  save() {
    this.s.image = this.imageSrc;
    // console.log(`---->`, this.s.image);
    this.s.token = localStorage.getItem('lva_token');

    if (!(this.s.image && this.s.token && this.s.file && this.s.filename && this.s.fileuuid)) {
      this.apiService.simpleMessage(IENMessage.parametersEmpty);
      return;
    }


    this.apiService.closeModal({ s: this.s })
  }

  handleInputChange(e: any) {
    console.log("input change");

    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!file) return;

    // Validate image
    if (!file.type.match(/image-*/)) {
      alert('Invalid image format');
      return;
    }

    this.s.file = file;
    this.s.filename = file.name;
    this.s.fileuuid = uuid.v4();

    // === NEW: Create framed version with white margins ===
    this.createFramedImage(file, 400, 400, 0.15).then(framedFile => {

      // Use the framed file for upload
      this.s.file = framedFile;
      this.s.filename = framedFile.name;

      // Preview the framed image
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const base64 = event.target.result as string;
        (document.querySelector('.product_image') as HTMLImageElement).src = base64;
        this.imageSrc = base64;
      };
      reader.readAsDataURL(framedFile);

    }).catch(err => {
      console.error('Framing failed', err);
      alert('Failed to process image');
    });
  }
  async createFramedImage(
    originalFile: File,
    targetWidth: number,
    targetHeight: number,
    marginPercent: number = 0.15
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e: any) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d', { alpha: false })!;

          // White background (frame)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Inner area with margins
          const margin = marginPercent;
          const innerW = targetWidth * (1 - 2 * margin);
          const innerH = targetHeight * (1 - 2 * margin);

          // Contain fit (preserve aspect ratio)
          const scale = Math.min(innerW / img.width, innerH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;

          // Center position
          const dx = (targetWidth - drawW) / 2;
          const dy = (targetHeight - drawH) / 2;

          ctx.drawImage(img, dx, dy, drawW, drawH);

          // Export as JPEG
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }

            const framedFile = new File(
              [blob],
              originalFile.name.replace(/\.[^/.]+$/, '') + `_framed_${targetWidth}x${targetHeight}.jpg`,
              { type: 'image/jpeg' }
            );

            resolve(framedFile);
          }, 'image/jpeg', 0.9);
        };

        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(originalFile);
    });
  }

  _handleReaderLoaded(e: any) {
    console.log("_handleReaderLoaded");
    var reader = e.target;
    this.imageSrc = reader.result;
    this.loaded = true;
  }
  cancel() {
    this.imageSrc = '';
  }

}