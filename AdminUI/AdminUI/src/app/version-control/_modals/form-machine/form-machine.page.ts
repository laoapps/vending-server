import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { LoadMachineListProcess } from '../../_processes/loadMachineList.process';
import { AppcachingserviceService } from 'src/app/services/appcachingservice.service';
import { IMachineStatus } from 'src/app/services/syste.model';
import { IENMessage } from 'src/app/models/base.model';
import { FilemanagerApiService } from 'src/app/services/filemanager-api.service';
import { environment } from 'src/environments/environment';
import { SetUpdateVendingVersionProcess } from '../../_processes/setupdateVendingVersion.process';
import { ControlVendingVersionAPIService } from 'src/app/services/control-vending-version-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-machine',
  templateUrl: './form-machine.page.html',
  styleUrls: ['./form-machine.page.scss'],
})
export class FormMachinePage implements OnInit, OnDestroy {

  @Input() uuid: string;
  @Input() version: number;
  @Input() versionText: string;

  private loadMachineListProcess: LoadMachineListProcess;
  private setupdateVendingVersionProcess: SetUpdateVendingVersionProcess;

  filemanagerURL: string = environment.filemanagerurl + 'download/';
  settings = {} as any;
  myMachineStatus=new Array<{machineId:string,mstatus:IMachineStatus}>();
  dateformat='yy-MM-dd HH:mm:ss';

  reloadElement: any = {} as any;
  lists: Array<any> = [];
  onlineList: Array<any> = [];
  count: number;
  machines: Array<string> = []; 

  constructor(
    public apiService: ApiService,
    public controlVendingVersionAPIService: ControlVendingVersionAPIService,
    private filemanagerAPIService: FilemanagerApiService,
    private cashingService: AppcachingserviceService
  ) { 
    this.loadMachineListProcess = new LoadMachineListProcess(this.apiService, this.cashingService);
    this.setupdateVendingVersionProcess = new SetUpdateVendingVersionProcess(this.apiService, this.controlVendingVersionAPIService);
    this.myMachineStatus=apiService.myMachineStatus;
  }

  async ngOnInit() {
    await this.loadMachine();
  }

  ngOnDestroy(): void {
      clearTimeout(this.reloadElement);
  }

  close() {
    this.apiService.modal.dismiss();
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

        this.lists = run.data[0].lists;
        this.count = run.data[0].count;

        console.log(`list`, this.lists);

        this.lists.forEach(v=>{
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

          resolve(IENMessage.success);

        });


      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  findMachine(m:string){
    return this.myMachineStatus.find(v=>v['machineId']==m)?.mstatus;
  }

  chooseMachine(list: any, index: number) {
    const status = this.findMachine(list?.machineId)?.lastUpdate;
    if (!status) return;
    
    this.reloadElement = setInterval(() => {
      clearInterval(this.reloadElement);
      const docs = (document.querySelectorAll('.machine-container .item-option') as NodeListOf<HTMLHRElement>);
      docs[index].classList.toggle('active');
      if (this.machines != undefined && Object.entries(this.machines).length == 0) {
        this.machines.unshift(list.machineid);
        console.log(`machines`, this.machines);
      } else {
        const duplicate = this.machines.filter(item => item == list.machineid);
        if (duplicate != undefined && Object.entries(duplicate).length > 0) {
          this.machines = this.machines.filter(item => item != list.machineid);
          console.log(`machines`, this.machines);
          return;
        }
        this.machines.unshift(list.machineid);
      }
      console.log(`machines`, this.machines);
    });
  }

  setupdateVersion(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const text = 'Do you want to update machines version!?';
        const alert = this.apiService.alertConfirm(text);

        if ((await alert).isConfirmed) {
          const params = {
            uuid: this.uuid,
            machines: this.machines
          }

          const run = await this.setupdateVendingVersionProcess.Init(params);
          if (run.message != IENMessage.success) throw new Error(run);
        }

        this.apiService.alertSuccess(IENMessage.success);
        this.apiService.modal.dismiss();
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message); 
      }
    });
  }
}
