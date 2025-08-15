import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { AppcachingserviceService } from 'src/app/services/appcachingservice.service';
import { FilemanagerApiService } from 'src/app/services/filemanager-api.service';
import { LaabApiService } from 'src/app/services/laab-api.service';
import { LoadMachineListProcess } from '../processes/loadMachineList.process';
import { RefreshMachineProcess } from '../processes/refreshMachine.process';
import { ResetCashingProcess } from '../processes/resetCashing.process';
import { IonicstorageService } from 'src/app/services/ionicstorage.service';
import { environment } from 'src/environments/environment';
import { IMachineClientID, IMachineStatus } from 'src/app/services/syste.model';
import { SaleReportPage } from 'src/app/sale/sale-report/sale-report.page';
import { IENMessage } from 'src/app/models/base.model';
import { MachineWalletPage } from '../machine-wallet/machine-wallet.page';
import { SalePage } from 'src/app/sale/sale.page';
import { BillnotPaidPage } from 'src/app/billnot-paid/billnot-paid.page';
import { MachineAddPage } from '../machine-add/machine-add.page';
import { MachineDetailsPage } from '../machine-details/machine-details.page';

@Component({
  selector: 'app-mymachine',
  templateUrl: './mymachine.page.html',
  styleUrls: ['./mymachine.page.scss'],
})
export class MymachinePage implements OnInit {
  offsettz = 420;
  dateformat = 'yy-MM-dd HH:mm:ss'
  private loadMachineListProcess: LoadMachineListProcess;
  private refreshMachineProcess: RefreshMachineProcess;
  private resetCashingProcess: ResetCashingProcess;

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
  pinFormatter(value: number) {
    return `${value}%`;
  }
  myMachineStatus = new Array<{ machineId: string, mstatus: IMachineStatus }>();
  readonly: boolean;
  constructor(
    public apiService: ApiService,
    private laabAPIService: LaabApiService,
    private filemanagerAPIService: FilemanagerApiService,
    private cashingService: AppcachingserviceService,
  ) {
    this.offsettz = this.apiService.offsettz;
    this.dateformat = this.apiService.dateformat;
    this.loadMachineListProcess = new LoadMachineListProcess(this.apiService, this.cashingService);
    this.refreshMachineProcess = new RefreshMachineProcess(this.apiService);
    this.resetCashingProcess = new ResetCashingProcess(this.apiService);

    this.showImage = this.apiService.showImage;
    this.myMachineStatus = apiService.myMachineStatus;
  }

  // dismissModal() {

  //   this.modalCtrl.dismiss();
  // }

  ngOnInit() {
    this.loadMachine();
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
            let lists: Array<{ name: string, file: string }> = [];
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
              if (index == imgs.length - 1) {
                await this.cashingService.set(this.apiService.ownerUuid, JSON.stringify(lists));
              }
            });
          });

        }
        else {
          let lists: Array<{ name: string, file: string }> = [];

          for (let i = 0; i < setList.length; i++) {
            for (let j = 0; j < storageValues.length; j++) {

              if (setList[i].photo == storageValues[j].name) {
                setList[i].photo = storageValues[j].file;
              }
              else {
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
        this._l.forEach(v => {

          // init cashing

          console.log('....', v);
          if (!Array.isArray(v.data)) v.data = [v.data]
          let setting = v.data?.find(vx => vx?.settingName == 'setting');

          console.log('setting', setting);


          if (!setting) {
            setting = {};
            setting.allowVending = true;
            setting.allowCashIn = true;
            setting.lowTemp = 5;
            setting.highTemp = 15;
            setting.light = true;
            setting.imei = '';
            setting.imgHeader = '';
            setting.imgFooter = '';
            setting.imgLogo = '';
          }

          this.settings[v.machineId] = setting;
        })

      }
      // this.apiService.toast.create({message:r.message,duration:5000}).then(ry=>{
      //   ry.present();
      // })
    });
  }

  loadMachine(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
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

        this._l.forEach(v => {
          if (!Array.isArray(v.data)) v.data = [v.data]
          let setting = v.data?.find(vx => vx?.settingName == 'setting');
          console.log('setting', setting);

          if (!setting) {
            setting = {};
            setting.allowVending = true;
            setting.allowCashIn = true;
            setting.lowTemp = 5;
            setting.highTemp = 15;
            setting.light = { start: 3, end: 2 };
            setting.adsList = [];

            setting.imei = '';
          }
          if (typeof setting.light == 'boolean') {
            setting.light = { start: 3, end: 2 };
          }
          if (setting.adsList == undefined || setting.adsList == null) {
            setting.adsList = [];
          }
          setting.adsList = setting.adsList?.join(',')


          console.log('setting.adsList', setting.adsList);

          this.settings[v.machineId] = setting;
        });

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  findMachine(m: string) {
    return this.myMachineStatus.find(v => v['machineId'] == m)?.mstatus;
  }
  updateSetting(m: string) {
    const setting = this.settings[m];
    setting.adsList = setting.adsList?.split(',')
      .map(item => item.trim())
      .filter(item => item);
    console.log('setting0', setting);

    const o = this._l.find(v => v.machineId == m);
    const oldData = JSON.stringify(o.data);
    o.data = [setting];
    console.log('setting', o);
    console.log('setting', o.data);
    console.log('this.setting', this.settings);


    this.apiService.updateMachineSetting(o, o.id).subscribe(rx => {
      console.log(rx);
      if (!rx.status) {
        o.data = JSON.parse(oldData);
        console.log('Update setting failed restore old data');

      } else {
        console.log('update setting success !');
        this.loadMachine();

      }
      this.apiService.toast.create({ message: rx.message, duration: 5000 }).then(ry => {
        ry.present();
      })
    })
  }
  refreshMachine(m: string) {

    this.apiService.refreshMachine({ machineId: m }).subscribe(rx => {
      console.log(rx);
      if (!rx.status) {
        console.log('Update setting failed restore old data');

      } else {
        console.log('update setting success !');

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

  billNotPaid(machineId: string, otp: string, ownerUuid: string) {
    this.apiService.showModal(BillnotPaidPage, { machineId: machineId, otp: otp, ownerUuid: ownerUuid }).then(r => {
      r.present();
      r.onDidDismiss().then(() => {

      });
    })
  }


  allSaleReport() {
    const props = {
      machineId: 'all'
    }
    this.apiService.showModal(SaleReportPage, props).then(r => {
      r.present();
    });
  }


}
