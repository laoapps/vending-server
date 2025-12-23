import { Component, Input, OnInit } from '@angular/core';
import { IStock, IVendingMachineSale } from '../services/syste.model';
import { ApiService } from '../services/api.service';
import { SaleAddPage } from './sale-add/sale-add.page';
import { SaleDetailsPage } from './sale-details/sale-details.page';
import { ProductDetailsPage } from '../products/product-details/product-details.page';
import { ProductlistPage } from '../products/productlist/productlist.page';
import { LoadSaleListProcess } from './processes/loadSaleList.process';
import { environment } from 'src/environments/environment';
import { IENMessage } from '../models/base.model';
import { AppcachingserviceService } from '../services/appcachingservice.service';
import { CloneSaleProcess } from './processes/cloneSale.process';
import { CuiSalePage } from './cui-sale/cui-sale.page';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.page.html',
  styleUrls: ['./sale.page.scss'],
})
export class SalePage implements OnInit {
  @Input() machineId: string;
  @Input() otp: string;

  private loadSaleListProcess: LoadSaleListProcess;
  private cloneSaleProcess: CloneSaleProcess;
  filemanagerURL: string = environment.filemanagerurl + 'download/';



  showImage: (p: string) => string;
  _l = new Array<IVendingMachineSale>();
  readonly: boolean;

  constructor(
    public apiService: ApiService,
    private cashingService: AppcachingserviceService,
  ) {
    this.loadSaleListProcess = new LoadSaleListProcess(this.apiService, this.cashingService);
    this.cloneSaleProcess = new CloneSaleProcess(this.apiService, this.cashingService);
    this.showImage = this.apiService.showImage;
  }

  ngOnInit() {
    this.loadSaleList();

    // this.apiService.listSaleByMachine(this.machineId).subscribe(r => {
    //   console.log(r);
    //   if (r.status) {
    //     this._l.push(...r.data);
    //   }
    //   this.apiService.toast.create({ message: r.message, duration: 2000 }).then(ry => {
    //     ry.present();
    //   })
    // })
  }


  loadSaleList(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        //  await this.cashingService.clear();
        const params = {
          ownerUuid: this.apiService.ownerUuid,
          filemanagerURL: this.filemanagerURL,
          machineId: this.machineId
        }
        const run = await this.loadSaleListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);
        console.log(`---->`, run.data[0].readonly);
        this._l = [];
        this._l.push(...run.data[0].lists);
        console.log('this._l', this._l);

        this.readonly = run.data[0].readonly;
        console.log('this.readonly', this.readonly);

        resolve(IENMessage.success);


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  new() {
    this.apiService.showModal(SaleAddPage, { machineId: this.machineId, sales: this._l }).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        if (r.data.s) {

          const base64 = r.data.s.stock.image;
          r.data.s.stock.image = r.data.s.stock.imageurl;
          console.log(`-->addSale `, r.data.s);
          this.apiService.addSale(r.data.s)?.subscribe(rx => {
            console.log(`rx`, rx);
            console.log(`rx stock`, rx.data.stock);
            if (rx.status) {
              rx.data.stock.image = base64;
              this._l.unshift(rx.data);
            }
            this.apiService.toast.create({ message: rx.message, duration: 2000 }).then(ry => {
              ry.present();
            });

          })
        }
      })
    })
  }
  edit(id: number | undefined) {
    const s = this._l.find(v => v.id == id);
    // console.log('edit detail');

    if (!s) return alert('Not found');
    this.apiService.showModal(SaleDetailsPage, { machineId: this.machineId, s, sales: this._l }).then(ro => {
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

  editProductDetail(id: number | undefined) {
    const s = this._l.find(v => v.id == id);
    // console.log('edit detail');

    if (!s) return alert('Not found');
    this.apiService.showModal(SaleDetailsPage, { machineId: this.machineId, s, sales: this._l }).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        if (r?.data?.s) {
          const sData: IVendingMachineSale = r?.data?.s as IVendingMachineSale;



          this.apiService.disableSale(false, sData.id).subscribe(rx => {
            console.log('Success');
          })

          this.apiService.deleteSale(s.id).subscribe(rx => {
            console.log(rx);
            if (rx.status) {
              this._l.find((v, i) => {
                if (v.id == s.id) {
                  this._l.splice(i, 1);
                  return true;
                }
                return false;
              })
            }
          });

          const params = {
            price: Number(sData.stock.price),
            image: r?.data?.s.stock.imageUrl ?? sData.stock.imageurl,
            name: sData.stock.name,
            filename: r?.data?.s.stock.imageUrl ?? sData.stock.imageurl,
            imageurl: r?.data?.s.stock.imageUrl ?? sData.stock.imageurl,
            qtty: 1000,
            isActive: true
          } as IStock;
          // console.log('params', params);

          let sSave: IVendingMachineSale = {} as IVendingMachineSale;
          sSave.isActive = true;
          sSave.machineId = sData.machineId;
          sSave.max = sData.max;
          sSave.position = sData.position;


          this.apiService.addProduct(params)?.subscribe(async rx => {
            // console.log(`----->rx data`, rx.data);
            sSave.stock = JSON.parse(JSON.stringify(rx.data));
            if (rx.status != 1) {
              this.apiService.simpleMessage(IENMessage.addMachineFail);
              return;
            } else {
              this.apiService.simpleMessage(IENMessage.success);
            }
            await this.loadSaleList();

            const usedPositions = new Set(this._l.map(v => v.position));

            if (!usedPositions.has(sData.position)) {
              sSave.position = sData.position;
            } else {
              for (let i = 0; i < 200; i++) {
                if (!usedPositions.has(i)) {
                  sSave.position = i;
                  break;
                }
              }
            }
            this.apiService.addSale(sSave)?.subscribe(rx => {
              if (rx.status) {
                rx.data.stock.image = r?.data?.s?.stock?.image;
                this._l.unshift(rx.data);
              }
              this.apiService.toast.create({ message: rx.message, duration: 2000 }).then(ry => {
                ry.present();
              })

            });
            this.loadSaleList();


          },);

        }

      }).catch(e => {
        console.log(e);

      })
    })
  }


  deletesale(s: IVendingMachineSale) {
    if (!confirm('Are you sure?')) return;

    this.apiService.deleteSale(s.id).subscribe(rx => {
      console.log(rx);
      if (rx.status) {
        this._l.find((v, i) => {
          if (v.id == s.id) {
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
  save(s: IVendingMachineSale) {
    this.apiService.disableSale(s.isActive, s.id).subscribe(rx => {
      console.log(rx);
      if (rx.status) {
        this._l.find((v, i) => {
          if (v.id == rx.data.id) {
            rx.data.stock.image = s.stock.image;
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
  showProductList(p: IVendingMachineSale) {
    this.apiService.showModal(ProductlistPage).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r.data);

        if (r.data) {
          this._l.find((v, i) => {
            console.log(v);

            if (v.stock.id == p.stock.id) {
              v.stock = r.data.data
              this.apiService.updateSale(v).subscribe(v => {
                this.apiService.toast.create({ message: v.message, duration: 2000 }).then(ry => {
                  ry.present();
                })
              })
              return true;
            }
            return false;
          })
        }
      }).catch(e => {
        console.log(e);

      })
    })
  }

  cloneSale(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const msg = this.apiService.alert.create({
          header: 'Are you sure !?',
          subHeader: 'Enter clone machine id',
          inputs: [
            {
              type: 'text',
              name: 'inputMachineId'
            }
          ],
          buttons: [
            {
              text: 'Confirm',
              handler: async (data) => {
                console.log(data.inputMachineId);
                const params = {
                  ownerUuid: this.apiService.ownerUuid,
                  filemanagerURL: this.filemanagerURL,
                  machineId: this.machineId,
                  cloneMachineId: data.inputMachineId
                }
                const run = await this.cloneSaleProcess.Init(params);
                if (run.message != IENMessage.success) {
                  this.apiService.simpleMessage(run);
                  return;
                }
                this._l.push(...run.data[0].lists);
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
  cloneSaleCUI(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {

        const msg = this.apiService.alert.create({
          header: 'Are you sure !?',
          subHeader: 'Enter clone machine id',
          inputs: [
            {
              type: 'text',
              name: 'inputMachineId'
            }
          ],
          buttons: [
            {
              text: 'Confirm',
              handler: async (data) => {
                console.log(data.inputMachineId);
                const params = {
                  ownerUuid: this.apiService.ownerUuid,
                  filemanagerURL: this.filemanagerURL,
                  machineId: this.machineId,
                  cloneMachineId: data.inputMachineId
                }
                this.apiService.cloneMahinceCUI(params).subscribe(r => {
                  console.log(r);
                  if (r) {
                    this.apiService.toast.create({ message: r?.message, duration: 2000 }).then(ry => {
                      ry.present();
                    })
                  } else {
                    this.apiService.simpleMessage(r.message);
                  }
                });

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
  cuisale() {
    const props = {
      machineId: this.machineId,
      otp: this.otp,
      _l: this._l
    }
    this.apiService.showModal(CuiSalePage, props).then(r => {
      r.present();
    });
  }
}
