import { Component, Input, OnInit } from '@angular/core';
import { IVendingMachineSale } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { SaleAddPage } from './sale-add/sale-add.page';
import { SaleDetailsPage } from './sale-details/sale-details.page';
import { ProductDetailsPage } from '../products/product-details/product-details.page';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.page.html',
  styleUrls: ['./sale.page.scss'],
})
export class SalePage implements OnInit {
  @Input()machineId='';
  showImage:(p:string)=>string;
  _l = new Array<IVendingMachineSale>();
  constructor(public apiService: ApiService) {
    this.showImage=this.apiService.showImage;
   }

  ngOnInit() {
    
    this.apiService.listSaleByMachine(this.machineId).subscribe(r => {
      console.log(r);
      if (r.status) {
        this._l.push(...r.data);
      }
      this.apiService.toast.create({ message: r.message, duration: 2000 }).then(ry => {
        ry.present();
      })
    })
  }
  new() {
    this.apiService.showModal(SaleAddPage,{machineId:this.machineId,sales:this._l}).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);
        if (r.data.s) {
          this.apiService.addSale(r.data.s)?.subscribe(rx => {
            console.log(rx);
            if (rx.status) {
              this._l.unshift(rx.data);
            }
            this.apiService.toast.create({ message: rx.message, duration: 2000 }).then(ry => {
              ry.present();
            })

          })
        }
      })
    })
  }
  edit(id: number | undefined) {
    const s = this._l.find(v => v.id == id);
    if (!s) return alert('Not found')
    this.apiService.showModal(SaleDetailsPage, {machineId:this.machineId, s ,sales:this._l}).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);

        if (r.data.update) {
          this.apiService.disableProduct(Boolean(s.isActive), Number(id)).subscribe(rx => {
            console.log(rx);
            if (rx.status) {
              this._l.find((v, i) => {
                if (v.id == rx.data.id) {
                  this._l.splice(i, 1, ...[rx.data]);
                  return true;
                }
                return false;
              })
            }
            this.apiService.toast.create({ message: rx.message, duration: 2000 }).then(ry => {
              ry.present();
            })

          })
        }
      }).catch(e => {
        console.log(e);

      })
    })
  }
  showProduct(id:number=-1){
    const s = this._l.find(v => v.stock.id == id)?.stock;
    if (!s) return alert('Not found')
    this.apiService.showModal(ProductDetailsPage, { s }).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);

        if (r.data.update) {
          this.apiService.disableProduct(Boolean(s.isActive), Number(id)).subscribe(rx => {
            console.log(rx);
            if (rx.status) {
              this._l.find((v, i) => {
                if (v.id == rx.data.id) {
                  this._l.splice(i, 1, ...[rx.data]);
                  return true;
                }
                return false;
              })
            }
            this.apiService.toast.create({ message: rx.message, duration: 2000 }).then(ry => {
              ry.present();
            })

          })
        }
      }).catch(e => {
        console.log(e);

      })
    })
  }

  close() {
    this.apiService.closeModal()
  }
}
