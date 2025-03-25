import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { IStock } from 'src/app/services/syste.model';
import { LoadProductListProcess } from '../processes/loadProductList.process';
import { environment } from 'src/environments/environment';
import { IENMessage } from 'src/app/models/base.model';
import { AppcachingserviceService } from 'src/app/services/appcachingservice.service';

@Component({
  selector: 'app-productlist',
  templateUrl: './productlist.page.html',
  styleUrls: ['./productlist.page.scss'],
})
export class ProductlistPage implements OnInit {

  private loadProductListProcess: LoadProductListProcess;
  filemanagerURL: string = environment.filemanagerurl + 'download/';
  
  _l = new Array<IStock>();
  constructor(
    public apiService: ApiService,
    private cashingService: AppcachingserviceService,
    
    ) { 
    this.loadProductListProcess = new LoadProductListProcess(this.apiService, this.cashingService);

  }

  ngOnInit() {
    this.loadProductList();
    // this.apiService.listProduct('yes').subscribe(r => {
    //   console.log(r);
    //   if (r.status) {
    //     this._l.push(...r.data);
    //   }
    //   this.apiService.toast.create({ message: r.message, duration: 2000 }).then(ry => {
    //     ry.present();
    //   });
    // })
  }
  loadProductList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
      //  await this.cashingService.clear();
        const params = {
          ownerUuid: this.apiService.ownerUuid,
          filemanagerURL: this.filemanagerURL,
          status: 'yes'
        }
        const run = await this.loadProductListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this._l.push(...run.data[0].lists);

        resolve(IENMessage.success);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  selectProduct(id:number){
    this.apiService.dismissModal(this._l.find(v=>v.id==id));
  }

}
