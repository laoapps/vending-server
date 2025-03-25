import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import QRCode from "qrcode";

@Component({
  selector: 'app-generate-cqr',
  templateUrl: './generate-cqr.page.html',
  styleUrls: ['./generate-cqr.page.scss'],
})
export class GenerateCqrPage implements OnInit {

  @Input() detail: any;


  constructor(
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    await this.loadQR();
  }

  close(){
    this.apiService.modal.dismiss();
  }

  loadQR(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        QRCode.toDataURL(JSON.stringify(this.detail)).then(r => {
          (document.querySelector('.qr-img') as HTMLImageElement).src = r;
        });

      } catch (error) {
        resolve(error.message);
      }
    });
  }


}
