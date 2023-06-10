import { Component, OnInit ,Input} from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-epin-show-code',
  templateUrl: './epin-show-code.page.html',
  styleUrls: ['./epin-show-code.page.scss'],
})
export class EpinShowCodePage implements OnInit {

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
