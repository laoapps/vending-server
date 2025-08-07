import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { FilemanagerApiService } from '../services/filemanager-api.service';
import { environment } from 'src/environments/environment';
import { IENMessage } from '../models/base.model';
import { ProductAddPage } from '../products/product-add/product-add.page';
import { IProductImage, IStock } from '../services/syste.model';

@Component({
  selector: 'app-imagesproduct',
  templateUrl: './imagesproduct.page.html',
  styleUrls: ['./imagesproduct.page.scss'],
})
export class ImagesproductPage implements OnInit {
  filemanagerURL: string = environment.filemanagerurl + 'download/';
  _l = new Array<IProductImage>();


  constructor(
    public apiService: ApiService,
    private filemanagerAPIService: FilemanagerApiService,
  ) { }

  ngOnInit() {
  }

  loadProduct(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        //  await this.cashingService.clear();
        const params = {
          ownerUuid: this.apiService.ownerUuid,
          filemanagerURL: this.filemanagerURL
        }
        // const run = await this.loadProductListProcess.Init(params);
        // if (run.message != IENMessage.success) throw new Error(run);

        // this._l.push(...run.data[0].lists);

        resolve(IENMessage.success);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  new() {
    this.apiService.showModal(ProductAddPage).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);
        if (r.data.s) {
          console.log(`---->`, r.data.s.image);
          const base64 = r.data.s.image;
          const formfile = new FormData();
          const fileuuid = r.data.s.fileuuid;
          formfile.append('docs', r.data.s.file, r.data.s.file.name);
          formfile.append('uuid', fileuuid);

          this.filemanagerAPIService.writeFile(formfile).subscribe(r_writeFile => {
            console.log(`write file fail`, r_writeFile);
            console.log(`write file fail`, r_writeFile.data[0].info.fileUrl);

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

            console.log(`r_writefile der`, r_writeFile);
            delete r.data.s.file;
            delete r.data.s.fileuuid;
            r.data.s.imageURL = r_writeFile.data[0].info.fileUrl;
            console.log('r.data.s', r.data.s);

            // this.apiService.addProduct(r.data.s)?.subscribe(rx => {
            //   if (rx.status != 1) {
            //     this.filemanagerAPIService.cancelWriteFile({ uuid: fileuuid }).subscribe(r_cancelWriteFile => {
            //       if (r_cancelWriteFile.status != 1) {
            //         this.apiService.simpleMessage(IENMessage.cancelAndWriteFileFail);
            //         return;
            //       }
            //       this.apiService.simpleMessage(IENMessage.addMachineFail);
            //       return;
            //     }, error => this.apiService.simpleMessage(IENMessage.writeFileError));
            //   }
            //   console.log(`rx data`, rx.data);
            //   rx.data.image = base64;
            //   this._l.unshift(rx.data);
            // }, error => this.apiService.simpleMessage(IENMessage.addMachineError));
          }, error => this.apiService.simpleMessage(IENMessage.writeFileError));

        }
      });
    });
  }
  delete(id: number) {
    if (!confirm('Are you sure?')) return;
    const s = this._l.find(v => v.id == id);
    if (!s) return alert('Not found')

    this.apiService.deleteProduct(id).subscribe(rx => {
      console.log(rx);
      if (rx.status) {
        this._l.find((v, i) => {
          if (v.id == id) {
            this._l.splice(i, 1);
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
  disable(data: any) {
    const s = this._l.find(v => v.id == data.id);
    if (!s) return alert('Not found')

    this.apiService.disableProduct(s.isActive, data.id).subscribe(rx => {
      console.log(rx);
      if (rx.status) {
        this._l.find((v, i) => {
          if (v.id == rx.data.id) {
            rx.data.image = data.image;
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
