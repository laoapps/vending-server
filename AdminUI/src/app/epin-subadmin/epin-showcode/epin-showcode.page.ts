import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-epin-showcode',
  templateUrl: './epin-showcode.page.html',
  styleUrls: ['./epin-showcode.page.scss'],
})
export class EpinShowcodePage implements OnInit {

  @Input() qrImage: string;
  @Input() code: string;  

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadQR();
  }

  loadQR() {
      (document.querySelector('#qr-img') as HTMLImageElement).src = this.qrImage;
  }

  close() {
    this.apiService.modal.dismiss();
  }

}
