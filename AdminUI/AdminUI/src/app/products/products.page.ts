import { Component, OnInit } from '@angular/core';
import { IStock } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { ProductAddPage } from './product-add/product-add.page';
import { ProductDetailsPage } from './product-details/product-details.page';
import { FilemanagerApiService } from '../services/filemanager-api.service';
import { IENMessage } from '../models/base.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
  _l = new Array<IStock>();
  constructor(public apiService: ApiService, private filemanagerAPIService: FilemanagerApiService) { }

  ngOnInit() {
    this.apiService.listProduct().subscribe(r => {
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
    this.apiService.showModal(ProductAddPage).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);
        if (r.data.s) {

          const base64 = r.data.s.image;
          const formfile = new FormData();
          const fileuuid = r.data.s.fileuuid;
          formfile.append('docs', r.data.s.file, r.data.s.file.name);
          formfile.append('uuid', fileuuid);

          this.filemanagerAPIService.writeFile(formfile).subscribe(r_writeFile => {
            console.log(`write file fail`, r_writeFile);
            console.log(`write file fail`, r_writeFile);
            
            if (r_writeFile.status != 1) {
              this.filemanagerAPIService.cancelWriteFile({ uuid: fileuuid }).subscribe(r_cancelWriteFile => {
                if (r_cancelWriteFile.status != 1) {
                  this.apiService.simpleMessage(IENMessage.cancelAndWriteFileFail);
                  return;
                }
                this.apiService.simpleMessage(IENMessage.writeFileFailAndCancelwriteFileSuccess);
                return;
              }, error => this.apiService.simpleMessage(IENMessage.writeFileError));
            }

            delete r.data.s.file;
            delete r.data.s.fileuuid;
            r.data.s.image = r_writeFile.data[0].info.fileUrl;
            this.apiService.addProduct(r.data.s)?.subscribe(rx => {
              if (rx.status != 1) {
                this.filemanagerAPIService.cancelWriteFile({ uuid: fileuuid }).subscribe(r_cancelWriteFile => {
                  if (r_cancelWriteFile.status != 1) {
                    this.apiService.simpleMessage(IENMessage.cancelAndWriteFileFail);
                    return;
                  }
                  this.apiService.simpleMessage(IENMessage.addMachineFail);
                  return;
                }, error => this.apiService.simpleMessage(IENMessage.writeFileError));
              }

              rx.data.s.image = base64;
              this._l.unshift(rx.data);
            }, error => this.apiService.simpleMessage(IENMessage.addMachineError));
          }, error => this.apiService.simpleMessage(IENMessage.writeFileError));

        }
      });
    });
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
  disable(id: number) {
    const s = this._l.find(v => v.id == id);
    if (!s) return alert('Not found')

    this.apiService.disableProduct(s.isActive, id).subscribe(rx => {
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
  close() {
    this.apiService.closeModal()
  }

}
