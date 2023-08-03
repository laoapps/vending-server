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
import { EpinAdminPage } from '../epin-admin/epin-admin.page';
import { FilemanagerApiService } from '../services/filemanager-api.service';
import { AppcachingserviceService } from '../services/appcachingservice.service';
import { environment } from 'src/environments/environment';
import { IonicstorageService } from '../services/ionicstorage.service';
import { LoadMachineListProcess } from './processes/loadMachineList.process';
import { RefreshMachineProcess } from './processes/refreshMachine.process';


@Component({
  selector: 'app-machine',
  templateUrl: './machine.page.html',
  styleUrls: ['./machine.page.scss'],
})
export class MachinePage implements OnInit {
  offsettz = 420;
  dateformat='yy-MM-dd HH:mm:ss'
  private loadMachineListProcess: LoadMachineListProcess;
  private refreshMachineProcess: RefreshMachineProcess;

  ionicStorage: IonicstorageService;
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
  readonly: boolean;

  constructor(
    public apiService: ApiService, 
    private laabAPIService: LaabApiService,
    private filemanagerAPIService: FilemanagerApiService,
    private cashingService: AppcachingserviceService,
  ) {
   this.offsettz= this.apiService.offsettz;
   this.dateformat=this.apiService.dateformat;
    this.loadMachineListProcess = new LoadMachineListProcess(this.apiService, this.cashingService);
    this.refreshMachineProcess = new RefreshMachineProcess(this.apiService);
    
    this.showImage = this.apiService.showImage;
    this.myMachineStatus=apiService.myMachineStatus;

  }


  ngOnInit() {
    // this.initDOM();
    this.loadMachine();
   
  }
  Refresh(m:string){
    this.apiService.refreshMachine(m).subscribe(r=>{
      console.log('refreshMachine',r);
      if(r.status){
        alert('Machine '+m+' has been refresh')
      }
    });
  }
  loaddefault() {
    let setList: Array<any> = [];

    this.apiService.listMachine().subscribe(async r => {
      console.log(r);
      if (r.status) {
        setList = r.data;
        // await this.cashingService.clear();
        let storage = await this.cashingService.get(this.apiService.ownerUuid);
        if (storage == undefined || storage == null) {
          await this.cashingService.set(this.apiService.ownerUuid, JSON.stringify([]));
        }
        const storageValues: any = JSON.parse(JSON.parse(storage)?.v);
        console.log(`storageValues`, storageValues, storageValues.length);
        


        // 1 first time when you have open this page every image will get from server
        // 2 after get image from server this function will reload element and save current url and base64
        if (storageValues != undefined && Object.entries(storageValues).length == 0) {

          let i = setInterval(async () => {
            clearInterval(i);
            let lists: Array<{ name: string, file: string}> = [];
            const imgs = (document.querySelectorAll('.display_machine_image') as NodeListOf<HTMLImageElement>);
            imgs.forEach(async (elm, index) => {
              const name = elm.getAttribute('src');
              if (name != '') {
              
                const url = `${this.filemanagerURL}${name}`;
                const run = await fetch(url, { method: 'GET' });
                let file = await this.apiService.convertBlobToBase64(await run.blob());

                const obj = {
                  name: name,
                  file: file
                }

                const same = lists.find(item => item.name == name);
                console.log(`same`, same);
                if (same == undefined) {
                  lists.push(obj);
                }
                elm.src = file;
              }
              if (index == imgs.length-1) {
                await this.cashingService.set(this.apiService.ownerUuid, JSON.stringify(lists));
              }
            });
          });
          
        }
        else 
        {
          let lists: Array<{ name: string, file: string}> = [];

          for(let i = 0; i < setList.length; i++) {
            for(let j = 0; j < storageValues.length; j++) {
              
              if (setList[i].photo == storageValues[j].name) {
                setList[i].photo = storageValues[j].file;
              } 
              else 
              {
                if (setList[i].photo != '') {
                  const url = `${this.filemanagerURL}${setList[i].photo}`;
                  const run = await fetch(url, { method: 'GET' });
                  const file = await this.apiService.convertBlobToBase64(await run.blob());
  
                  const obj = {
                    name: setList[i].photo,
                    file: file
                  }
  
                  lists.push(obj);
                  setList[i].photo = file;
                  console.log();
                }
              }
            }
          }

          storageValues.push(...lists);
          await this.cashingService.set(this.apiService.ownerUuid, JSON.stringify(storageValues));
        }
      

        this._l.push(...setList);
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
            setting.imei='';
            setting.imgHeader='';
            setting.imgFooter='';
            setting.imgLogo='';
          }
          this.settings[v.machineId]=setting;
        })
       
      }
      // this.apiService.toast.create({message:r.message,duration:5000}).then(ry=>{
      //   ry.present();
      // })
    });
  }

  loadMachine(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        // await this.cashingService.clear();
        // return resolve(IENMessage.success);
        const params = {
          ownerUuid: this.apiService.ownerUuid,
          filemanagerURL: this.filemanagerURL
        }
        const run = await this.loadMachineListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this._l.push(...run.data[0].lists);
        this.readonly = run.data[0]?.readonly;
        if (this.readonly == true) return resolve(IENMessage.success);

        this._l.forEach(v=>{
          if(!Array.isArray(v.data))v.data=[v.data]
          let setting =v.data?.find(vx=>vx?.settingName=='setting');
          // console.log('setting',setting);
          
          if(!setting){
            setting={};
            setting.allowVending=true;
            setting.allowCashIn=true;
            setting.lowTemp=5;
            setting.highTemp=15;
            setting.light=true;
            setting.imei='';
          }
          this.settings[v.machineId]=setting;
        });

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  findMachine(m:string){
    // console.log('Machine '+m,this.myMachineStatus);
    
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
            this.apiService.addMachine(r.data.s)?.subscribe(async rx => {
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
  sale(s: string, otp: string) {
    console.log(`sale id`, s);
    this.apiService.showModal(SalePage, { machineId: s, otp: otp }).then(ro => {
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

  // epinManagement() {
  //   console.log(`list`, this._l);
  //   this.apiService.showModal(EpinAdminPage, { }).then(r => {
  //     r.present();
  //   });
  // }

  refreshMachine(machineId: string): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const confirm = this.apiService.alert.create({
          header: 'Are you sure !?',
          subHeader: `Do you want to refresh this ${machineId} machine`,
          buttons: [
            {
              text: 'Confirm',
              handler: async () => {
                const params = {
                  machineId: machineId
                }
                const run = await this.refreshMachineProcess.Init(params);
                if (run.message != IENMessage.success) {

                  this.apiService.simpleMessage(run);
                  return resolve(run);
                }
                this.apiService.simpleMessage(IENMessage.refreshMachineSuccess);
              }
            },
            'Cancel'
          ]
        });

        (await confirm).present();
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }

}




