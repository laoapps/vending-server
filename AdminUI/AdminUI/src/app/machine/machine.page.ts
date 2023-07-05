import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { IMachineClientID, IMachineStatus } from '../services/syste.model';
import { MachineAddPage } from './machine-add/machine-add.page';
import { MachineDetailsPage } from './machine-details/machine-details.page';
import { SalePage } from '../sale/sale.page';
import { LaabApiService } from '../services/laab-api.service';
import { LAAB_FindMachineLimiter, LAAB_FindMachineWallet, LAAB_RegisterMachineLimiter, LAAB_RegisterMachineWallet, LAAB_ShowMachineCoinWalletBalance, LAAB_ShowMachineCoinWalletByGroup, LAAB_ShowMachineLimiterBalance, LAAB_ShowMachineWalletBalance } from '../models/laab.model';
import { IENMessage, IVendingRoles } from '../models/base.model';
import { MachineWalletPage } from './machine-wallet/machine-wallet.page';
import { EpinManagementPage } from './epin-management/epin-management.page';
import { FilemanagerApiService } from '../services/filemanager-api.service';
import { AppcachingserviceService } from '../services/appcachingservice.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-machine',
  templateUrl: './machine.page.html',
  styleUrls: ['./machine.page.scss'],
})
export class MachinePage implements OnInit {

  filemanagerURL: string = environment.filemanagerurl + 'download/';
  fakeList: Array<any> = [
    {
      uuid: 'c18ee036-ce2f-4723-95cf-f29481f91150'
    },
    {
      uuid: 'c30819b4-692c-4279-93da-92f5961a0405'
    }
  ];


  _l = new Array<IMachineClientID>();
  showImage: (p: string) => string;
  settings = {} as any;
  myMachineStatus=new Array<{machineId:string,mstatus:IMachineStatus}>();

  constructor(
    public apiService: ApiService, 
    private laabAPIService: LaabApiService,
    private filemanagerAPIService: FilemanagerApiService,
    private cashingService: AppcachingserviceService
  ) {
    this.showImage = this.apiService.showImage;
    this.myMachineStatus=apiService.myMachineStatus;
  }

  ngOnInit() {

    this.apiService.listMachine().subscribe(async r => {
      console.log(r);
      if (r.status) {

        const ownerUuid = localStorage.getItem('lva_ownerUuid');
        let storage = await this.cashingService.get(ownerUuid);
        if (storage == undefined || storage == null) {
          await this.cashingService.set(ownerUuid, JSON.stringify([]));
        }
        const storageValues: any = JSON.parse(JSON.parse(storage).v);
        console.log(`storageValues`, storageValues, storageValues.length);
        


        // 1 first time when you have open this page every image will get from server
        // 2 after get image from server this function will reload element and save current url and base64
        if (storageValues != undefined && Object.entries(storageValues).length == 0) {

          let i = setInterval(() => {
            clearInterval(i);
            const imgs = (document.querySelectorAll('.machine_image') as NodeListOf<HTMLImageElement>);

            imgs.forEach((elm, index) => {
              const name = elm.getAttribute('src');
              if (name != '') {
                const obj = {
                  name: name
                }
                elm.src = `${this.filemanagerURL}${name}`;
              }
            });
          });
          
        }
        else 
        {
          // for(let i = 0; i < r.data.length; i++) {
          //   for(let j = 0; j < storageValues.length; i++) {
          //     if (r.data[i].photo == storageValues[j].name) {
          //       r.data[i].photo == storageValues[j].file;
          //     } else 
          //     {
          //       const url = `http://${this.filemanagerURL}${r.data.photo}`;
          //       r.data.photo[i] = url;
          //     }
          //   }
          // }
        }
        
        console.log(`--->`, this._l);

        


        // let i = setInterval(() => {
        //   clearInterval(i);
        //   this._l.push(...r.data);
        // })
        this._l.push(...r.data);
        this._l.forEach(v=>{

          // init cashing

          console.log('....',v);
          if(!Array.isArray(v.data))v.data=[v.data]
          let setting =v.data?.find(vx=>vx?.settingName=='setting');
          console.log('setting',setting);
          
          if(!setting){
            setting={};
            setting.allowVending=true;
            setting.allowCashIn=true;
            setting.lowTemp=5;
            setting.highTemp=15;
            setting.light=true;
          }
          this.settings[v.machineId]=setting;
        })
       
      }
      // this.apiService.toast.create({message:r.message,duration:5000}).then(ry=>{
      //   ry.present();
      // })
    })
  }

  loadMachine() {
    this.apiService.listMachine().subscribe(r => {
      console.log(r);
      if (r.status) {



        this._l.push(...r.data);
        this._l.forEach(v=>{
          console.log('....',v);
          if(!Array.isArray(v.data))v.data=[v.data]
          let setting =v.data?.find(vx=>vx?.settingName=='setting');
          console.log('setting',setting);
          
          if(!setting){
            setting={};
            setting.allowVending=true;
            setting.allowCashIn=true;
            setting.lowTemp=5;
            setting.highTemp=15;
            setting.light=true;
          }
          this.settings[v.machineId]=setting;
        });
      }
    });
  }

  findMachine(m:string){
    return this.myMachineStatus.find(v=>v['machineId']==m)?.mstatus;
  }
  updateSetting(m:string){
    const setting = this.settings[m];
    const o = this._l.find(v=>v.machineId==m);
    const oldData = JSON.stringify(o.data);
    o.data=[setting];
    console.log('setting',o);
    console.log('setting',o.data);
    console.log('this.setting',this.settings);
    
    
    this.apiService.updateMachineSetting(o,o.id).subscribe(rx=>{
      console.log(rx);
      if (!rx.status) {
        o.data=JSON.parse(oldData);
        console.log('Update setting failed restore old data');
        
      }else{
        console.log('update setting success !');
        
      }
      this.apiService.toast.create({ message: rx.message, duration: 5000 }).then(ry => {
        ry.present();
      })
    })
  }
  new() {
    this.apiService.showModal(MachineAddPage).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        if (r.data.s) {
          
          const base64 = r.data.s.photo;
          const formfile = new FormData();
          const fileuuid = r.data.s.fileuuid;
          formfile.append('docs', r.data.s.file, r.data.s.file.name);
          formfile.append('uuid', fileuuid);

          this.filemanagerAPIService.writeFile(formfile).subscribe(r_writeFile => {
            console.log(`write file fail`, r_writeFile);
            console.log(`write file fail`, r_writeFile.data[0].info.fileUrl);
            if (r_writeFile.status != 1) {
              this.filemanagerAPIService.cancelWriteFile({ uuid: fileuuid}).subscribe(r_cancelWriteFile => {
                if (r_cancelWriteFile.status != 1) {
                  this.apiService.simpleMessage(IENMessage.cancelAndWriteFileFail);
                  return;
                }
                this.apiService.simpleMessage(IENMessage.writeFileFailAndCancelwriteFileSuccess);
                return;
              }, error => this.apiService.simpleMessage(IENMessage.writeFileError))
            }


            // change photo name
            delete r.data.s.file;
            delete r.data.s.fileuuid;
            r.data.s.photo = r_writeFile.data[0].info.fileUrl;
            this.apiService.addMachine(r.data.s)?.subscribe(rx => {
              console.log(`add machine response`, rx);
              if (rx.status != 1) {
                this.filemanagerAPIService.cancelWriteFile({ uuid: fileuuid}).subscribe(r_cancelWriteFile => {
                  if (r_cancelWriteFile.status != 1) {
                    this.apiService.simpleMessage(IENMessage.cancelAndWriteFileFail);
                    return;
                  }
                  // this.apiService.simpleMessage(IENMessage.writeFileFailAndCancelwriteFileSuccess);
                  this.apiService.simpleMessage(IENMessage.addMachineFail);
                  return;
                }, error => this.apiService.simpleMessage(IENMessage.writeFileError))
              }

              rx.data.photo = base64;
              this._l.unshift(rx.data);
            }, error => this.apiService.simpleMessage(IENMessage.addMachineError));
          }, error => this.apiService.simpleMessage(IENMessage.writeFileError));

        }
      })
    })
  }
  edit(id: number) {
    const s = this._l.find(v => v.id == id);
    if (!s) return alert('Not found')
    this.apiService.showModal(MachineDetailsPage, { s }).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(`after close modal update`, r);

        if (r.data.update) {
          this.apiService.updateMachine(s, id).subscribe(rx => {
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

    this.apiService.disableMachine(s.isActive, id).subscribe(rx => {
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
  sale(s: string) {
    this.apiService.showModal(SalePage, { machineId: s }).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);
      })
    });
  }
  close() {
    this.apiService.closeModal()
  }

  machineWallet(id: number) {
    const s = this._l.find(v => v.id == id);
    if (!s) return alert('Not found');
    this.apiService.currentMachineId = s.machineId;
    this.apiService.showModal(MachineWalletPage, { s }).then(r => {
      r.present();
      r.onDidDismiss().then(() => {
        this.apiService.currentMachineId = '';
        this.apiService.currentVendingWalletUUID = '';
        this.apiService.currentVendingWalletCoinName = '';
        this.apiService.currentVendingWalletCoinBalance = null;
      });
    });
  }

  epinManagement() {
    console.log(`list`, this._l);
    this.apiService.showModal(EpinManagementPage, { }).then(r => {
      r.present();
    });
  }

}




