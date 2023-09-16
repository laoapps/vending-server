import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { FormUploadPage } from './_modals/form-upload/form-upload.page';
import { IENMessage } from '../models/base.model';
import { LoadAllVersionProcess } from './_processes/loadAllVersion.process';
import { ControlVendingVersionAPIService } from '../services/control-vending-version-api.service';
import { FormMachinePage } from './_modals/form-machine/form-machine.page';

@Component({
  selector: 'app-version-control',
  templateUrl: './version-control.page.html',
  styleUrls: ['./version-control.page.scss'],
})
export class VersionControlPage implements OnInit {

  private loadAllVersionProcess: LoadAllVersionProcess;


  lists: Array<any> = [];
  count: number = 0;


  uuid: string;
  version: number;
  versionText: string;
  filesize: number = 0;
  lastUpdatedAt: any = {} as any;
  readme: any = {} as any;

  constructor(
    public apiService: ApiService,
    public controlVendingVersionAPIService: ControlVendingVersionAPIService
  ) { 
    this.loadAllVersionProcess = new LoadAllVersionProcess(this.apiService, this.controlVendingVersionAPIService);
  }

  async ngOnInit() {
    await this.loadAllVersion();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  openFormUpload() {
    this.apiService.showModal(FormUploadPage,{}).then(r=>{r?.present()});
  }

  loadAllVersion(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const params = {}
        const run = await this.loadAllVersionProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.lists = run.data[0].rows;
        this.count = run.data[0].count;
        if (this.count == 0) return resolve(IENMessage.success);

        this.uuid = this.lists[0].uuid;
        this.version = this.lists[0].version;
        for(let i = 0; i < this.lists.length; i++) {
          this.lists[i].versionText = '';
          this.lists[i].versionText = this.convertVersion(this.lists[i].version);
        }
        this.versionText = this.lists[0].versionText;
        this.lastUpdatedAt = this.lists[0].updatedAt;
        this.readme = this.lists[0].readme;

        resolve(IENMessage.success);
        
      } catch (error) {
        this.apiService.modal.dismiss();
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }
  convertVersion(version: string) {
    let text = version;
    let versionText: string = '';
    const parses = parseInt(text);

    if (parses > 0 && parses < 10) {
      return `0.0.${parses}`;
    } 
    if (parses >= 10 && parses < 100) {
      text = text.substring(text.length - parses.toString().length-1, text.length);
    } else {
      text = text.substring(text.length - parses.toString().length, text.length);
    }
    
    let s: string = '';
    for(let i = 0; i < text.length; i++) {
      s += `${text[i]}.`;
    }
    versionText = `${s}0`;
    versionText = versionText.substring(0, versionText.length -2);
    return versionText;
  } 
  switchVersion(index: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      let workload: any = {} as any;
      try {
        
        workload = this.apiService.load.create({ message: 'loading...' });
        (await workload).present();

        this.versionText = this.lists[index].version;
        this.lastUpdatedAt = this.lists[index].updatedAt;
        this.readme = this.lists[index].readme;

        (await workload).dismiss();
        resolve(IENMessage.success);

      } catch (error) {
        (await workload).dismiss();
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }
  openFormMachine() {
    const props = {
      uuid: this.uuid,
      version: this.version,
      versionText: this.versionText
    }
    this.apiService.showModal(FormMachinePage,props).then(r=>{r?.present()});
  }
}
