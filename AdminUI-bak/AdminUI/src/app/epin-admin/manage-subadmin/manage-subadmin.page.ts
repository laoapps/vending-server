import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ShowSubadminListProcess } from '../processes/showSubadminList.process';
import { FindSubadminListProcess } from '../processes/findSubadminList.process';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { IENMessage } from 'src/app/models/base.model';
import { ManageSubadminCreatePage } from '../manage-subadmin-create/manage-subadmin-create.page';
import { DeleteSubadminProcess } from '../processes/deleteSubadmin.process';
import { ManageSubadminInfoPage } from '../manage-subadmin-info/manage-subadmin-info.page';

@Component({
  selector: 'app-manage-subadmin',
  templateUrl: './manage-subadmin.page.html',
  styleUrls: ['./manage-subadmin.page.scss'],
})
export class ManageSubadminPage implements OnInit {

  private showSubadminListProcess: ShowSubadminListProcess;
  private findSubadminListProcess: FindSubadminListProcess;
  private deleteSubadminProcess: DeleteSubadminProcess;

  phonenumber: string;

  lists: any[] = [];
  currentPage: number = 1;
  limit: number = 5;
  count: number;
  btnList: Array<any> = [];

  constructor(
    private apiService: ApiService,
    private vendingAPIServgice: VendingAPIService
  ) { 
    this.showSubadminListProcess = new ShowSubadminListProcess(this.apiService, this.vendingAPIServgice);
    this.findSubadminListProcess = new FindSubadminListProcess(this.apiService, this.vendingAPIServgice);
    this.deleteSubadminProcess = new DeleteSubadminProcess(this.apiService, this.vendingAPIServgice);
  }


  ngOnInit(): void {
    this.showList();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  resetList(e: Event) {
    this.lists = [];
  }
  // getTime(e: Event) {
  //   this.time = momenttimezone((e.target as HTMLInputElement).value).tz("Asia/Vientiane").format('D/M/YYYY HH:mm:ss');
  //   console.log(`change`, this.time);
  // }
  showList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.lists = [];
        this.btnList = [];
        
        
        const params = {
          page: this.currentPage,
          limit: this.limit,
        }
        console.log(`params`, params);
        const run = await this.showSubadminListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.lists = run.data[0].rows;
        this.count = Number(run.data[0].count);

        const totalPage = Math.ceil(this.count / this.limit);
        this.btnList = this.apiService.paginations(this.currentPage, totalPage);

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  refreshList(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        this.lists = [];
        this.btnList = [];
        this.currentPage = 1;
        
        
        const params = {
          page: this.currentPage,
          limit: this.limit,
        }
        const run = await this.showSubadminListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.lists = run.data[0].rows;
        this.count = Number(run.data[0].count);

        const totalPage = Math.ceil(this.count / this.limit);
        this.btnList = this.apiService.paginations(this.currentPage, totalPage);

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  resetSearchList(e: Event): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        let value: any = (e.target as HTMLSelectElement).value;
        if (value == '') {
          this.currentPage = 1;
          const run = await this.showList();
          if (run != IENMessage.success) throw new Error(run);
        }

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message); 
      }
    });
  }
  searchList(page?: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
      
        this.lists = [];
        this.btnList = [];
        this.currentPage = page ? page : this.currentPage;
        
        const params = {
          phonenumber: this.phonenumber,
          page: this.currentPage,
          limit: this.limit,
        }
        const run = await this.findSubadminListProcess.Init(params);
        if (run.message != IENMessage.success) throw new Error(run);

        this.lists = run.data[0].rows;
        this.count = Number(run.data[0].count);

        const totalPage = Math.ceil(this.count / this.limit);
        this.btnList = this.apiService.paginations(this.currentPage, totalPage);

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  manageListPage(page: number): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        let run: any = {} as any;
        this.currentPage = page;

        if (this.phonenumber != undefined && this.phonenumber != '' && Object.entries(this.phonenumber).length > 0) {
          run = await this.searchList();   
        } else 
        {
          run = await this.showList(); 
        }

        if (run != IENMessage.success) throw new Error(run);
        resolve(IENMessage.success);

      } catch (error) {
        resolve(error.message);
      }
    });
  }

  switchShowLimit(e: Event): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const value = Number((e.target as HTMLSelectElement).value);
        if (value != this.limit) {
          this.currentPage = 1;
          this.limit = value;
          const run = await this.showList();
          if (run != IENMessage.success) throw new Error(run);
          this.phonenumber = '';
        }
        

        resolve(IENMessage.success);

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  openManageSubadminCreate() {
    const props = {
      manageSubadminPage: this
    }
    this.apiService.showModal(ManageSubadminCreatePage, props).then(r => {
      r.present();
    });
  }
  autoUpdateAfterManageSubadminCreate(list: any) {
    if (this.lists != undefined && Object.entries(this.lists).length == this.limit) {
      this.lists.splice(-1);
    }
    this.lists.unshift(list);
  }
  deleteSubadmin(list: any): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        const alert = this.apiService.alert.create({
          header: 'Are your sure !?',
          subHeader: 'Do you want to delete this sub admin ?',
          buttons: [
            {
              text: 'Confirm',
              handler: async () => {
                const params = {
                  id: list.id,
                  phonenumber: list.phonenumber
                }
                let run: any = await this.deleteSubadminProcess.Init(params);
                if (run.message != IENMessage.success) {
                  this.apiService.simpleMessage(run);
                  return;
                }

                this.lists = this.lists.filter(item => item.id !== list.id);
                if (this.lists != undefined && Object.entries(this.lists).length == 0) {
                  run = await this.showList();
                  if (run != IENMessage.success) {
                    this.apiService.simpleMessage(run);
                    return;
                  }
                }
                resolve(IENMessage.success);
              }
            },
            'Cancel'
          ]
        });
        (await alert).present();
        
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  openManageSubadminInfo(list: any) {
    const props = {
      manageSubadminPage: this,
      list: list
    }
    this.apiService.showModal(ManageSubadminInfoPage, props).then(r => {
      r.present();
    });
  }
  autoUpdateAfterRemoveProvideFromSubadmin(list: any) {
    this.lists.filter(item => {
      if (item.id == list.id) {
        item.provides = list.provides;
      }
    });
  }



}
