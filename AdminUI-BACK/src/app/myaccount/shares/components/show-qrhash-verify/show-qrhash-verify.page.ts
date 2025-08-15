import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-show-qrhash-verify',
  templateUrl: './show-qrhash-verify.page.html',
  styleUrls: ['./show-qrhash-verify.page.scss'],
})
export class ShowQrhashVerifyPage implements OnInit {

  @Input() qrImage: string;
  @Input() type: string;


  languageStr: any = {} as any;

  constructor(
    private apiService: ApiService,
    private modal: ModalController
  ) { }

  ngOnInit() {

    this.loadQR();
  }


  loadQR() {
      (document.querySelector('.qr-img') as HTMLImageElement).src = this.qrImage;
  }

  close() {
    this.modal.dismiss();
  }

}
