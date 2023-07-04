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


@Component({
  selector: 'app-machine',
  templateUrl: './machine.page.html',
  styleUrls: ['./machine.page.scss'],
})
export class MachinePage implements OnInit {

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
  constructor(public apiService: ApiService, private laabAPIService: LaabApiService) {
    this.showImage = this.apiService.showImage;
    this.myMachineStatus=apiService.myMachineStatus;
  }

  ngOnInit() {
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
        })
       
      }
      // this.apiService.toast.create({message:r.message,duration:5000}).then(ry=>{
      //   ry.present();
      // })
    })
  }
  findMachine(m:string){
    return this.myMachineStatus.find(v=>v['machineId']==m).mstatus;
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
        console.log(`adddd`, r);
        if (r.data.s) {
          this.apiService.addMachine(r.data.s)?.subscribe(rx => {
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
  edit(id: number) {
    const s = this._l.find(v => v.id == id);
    if (!s) return alert('Not found')
    this.apiService.showModal(MachineDetailsPage, { s }).then(ro => {
      ro?.present();
      ro?.onDidDismiss().then(r => {
        console.log(r);

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




