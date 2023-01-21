import { Component, OnInit } from '@angular/core';
import { IStock } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { ProductAddPage } from './product-add/product-add.page';
import { ProductDetailsPage } from './product-details/product-details.page';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
  _l = new Array<IStock>();
  constructor(public apiService: ApiService) { }

  ngOnInit() {
    this.apiService.listProduct().subscribe(r => {
      console.log(r);
      if (r.status) {
        this._l.push(...r.data);
      }
      this.apiService.toast.create({ message: r.message, duration: 5000 }).then(ry => {
        ry.present();
      })
    })
  }
  new() {
    this.apiService.showModal(ProductAddPage).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);
        if (r.data.s) {
          this.apiService.addProduct(r.data.s)?.subscribe(rx => {
            console.log(rx);
            if (rx.status) {
              this._l.unshift(rx.data);
            }
            this.apiService.toast.create({ message: rx.message, duration: 5000 }).then(ry => {
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
            this.apiService.toast.create({ message: rx.message, duration: 5000 }).then(ry => {
              ry.present();
            })

          })
        }
      }).catch(e => {
        console.log(e);

      })
    })
  }
  disable(id: number) {
    const s = this._l.find(v => v.id == id);
    if (!s) return alert('Not found')

    this.apiService.disableMachine(s.isActive!, id).subscribe(rx => {
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
      this.apiService.toast.create({ message: rx.message, duration: 5000 }).then(ry => {
        ry.present();
      })

    })
  }
}
