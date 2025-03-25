import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { CreateVendingVersionProcess } from '../../_processes/createVendingVersion.process';
import { ControlVendingVersionAPIService } from 'src/app/services/control-vending-version-api.service';
import { FilemanagerApiService } from 'src/app/services/filemanager-api.service';
import { VersionControlPage } from '../../version-control.page';
import { EditVendingContentVersionProcess } from '../../_processes/editVendingContentVersion.process';

@Component({
  selector: 'app-form-preview',
  templateUrl: './form-preview.page.html',
  styleUrls: ['./form-preview.page.scss'],
})
export class FormPreviewPage implements OnInit {

  @Input() versionControlPage: VersionControlPage;
  @Input() formUpload: any;
  @Input() id: number;
  @Input() dataPack: any;
  @Input() readme: Array<any>;
  @Input() isEdit: boolean = false;

  private createVendingVersionProcess: CreateVendingVersionProcess;
  private editVendingContentVersionProcess: EditVendingContentVersionProcess;

  constructor(
    public apiService: ApiService,
    public controlVendingVersionAPIService: ControlVendingVersionAPIService,
    public filemanagerAPIService: FilemanagerApiService
  ) { 
    this.createVendingVersionProcess = new CreateVendingVersionProcess(this.apiService, this.controlVendingVersionAPIService, this.filemanagerAPIService);
    this.editVendingContentVersionProcess = new EditVendingContentVersionProcess(this.apiService, this.controlVendingVersionAPIService);
  }

  ngOnInit() {
    console.log(`data pack`, this.dataPack);
  }

  close() {
    this.apiService.modal.dismiss();
  }

  upload(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const params = {
          dataPack: this.dataPack,
          readme: this.readme
        }

        const run = await this.createVendingVersionProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        await this.versionControlPage.autoUpdateAfterUpload(run.data[0].list);
        this.formUpload.dismiss();
        this.apiService.modal.dismiss();
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }

  editContent(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const params = {
          id: this.id,
          dataPack: this.dataPack,
          readme: this.readme
        }

        const run = await this.editVendingContentVersionProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        await this.versionControlPage.autoUpdateAfterEditContent(params);
        this.formUpload.dismiss();
        this.apiService.modal.dismiss();
        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.alertError(error.message);
        resolve(error.message);
      }
    });
  }

}
