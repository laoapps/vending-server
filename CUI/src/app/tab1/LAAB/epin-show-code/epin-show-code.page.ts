import { Component, OnInit ,Input} from '@angular/core';
import moment from 'moment';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-epin-show-code',
  templateUrl: './epin-show-code.page.html',
  styleUrls: ['./epin-show-code.page.scss'],
})
export class EpinShowCodePage implements OnInit {

  @Input() data: any = {} as any;
  @Input() qrImage: string;
  @Input() code: string;  

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.apiService.autopilot.auto=0;
    this.loadQR();
  }

  loadQR() {
      (document.querySelector('#qr-img') as HTMLImageElement).src = this.qrImage;
  }

  close() {
    this.apiService.modal.dismiss();
  }

  confirmHide(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const msg = this.apiService.alert.create({ 
          header: 'Do you want to hide this EPIN',
          subHeader: 'It would be hidden within 24H, please note well',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.EPINHidden();
              }
            },
            {
              text: 'Cancel'
            }
          ]
        });

        (await msg).present();

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  EPINHidden() {
    let local = localStorage.getItem('epin_hide_list');
    let lists: Array<any> = [];
    if (local == null)
      {
        local='[]';
      }
      lists = JSON.parse(local);
      if (lists != undefined && Object.entries(lists).length == 0) {
        const params = {
          uuid: this.data.uuid,
          time: moment.now()
        }
        lists.push(params);
        localStorage.setItem('epin_hide_list', JSON.stringify(lists));
      } else {
        const params = {
          uuid: this.data.uuid,
          time: moment.now()
        }
        lists.push(params);
        localStorage.setItem('epin_hide_list', JSON.stringify(lists));
      }

    this.apiService.modal.dismiss();
  }

}
