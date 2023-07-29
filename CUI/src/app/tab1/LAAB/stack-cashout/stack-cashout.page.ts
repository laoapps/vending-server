import { Component, Input, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LaabCashoutPage } from '../laab-cashout/laab-cashout.page';
import { EpinCashOutPage } from '../epin-cash-out/epin-cash-out.page';
import { ControlMenuService } from 'src/app/services/control-menu.service';
import { MMoneyCashOutValidationProcess } from '../../LAAB_processes/mmoneyCashoutValidation.process';
import { VendingAPIService } from 'src/app/services/vending-api.service';
import { MmoneyCashoutPage } from '../mmoney-cashout/mmoney-cashout.page';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-stack-cashout',
  templateUrl: './stack-cashout.page.html',
  styleUrls: ['./stack-cashout.page.scss'],
})
export class StackCashoutPage implements OnInit {

    private CONTROL_MENUList: Array<{ name: string, status: boolean }> = [];
    private links: NodeListOf<HTMLLinkElement>;


  constructor(
    private modal: ModalController,
    private apiService: ApiService,
    private vendingAPIService: VendingAPIService
  ) { 
  }

  ngOnInit() {
    this.apiService.autopilot.auto=0;
    this.apiService.soundSelectTarget();
    this.dynamicControlMenu();
  }

  mmoneyCashout(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash.amount == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        const props = {
          stackCashoutPage: this.modal
        };
        this.apiService.modal
          .create({ component: MmoneyCashoutPage, componentProps: props })
          .then((r) => {
            r.present();
            resolve(IENMessage.success);
          });
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        this.apiService.soundPleaseTopUpValue();
        resolve(error.message);
      }
    });
  }
  laabCashout(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash.amount == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        const props = {
          stackCashoutPage: this.modal
        };
        this.apiService.modal
          .create({ component: LaabCashoutPage, componentProps: props })
          .then((r) => {
            r.present();
            resolve(IENMessage.success);
          });
      } catch (error) {
        this.apiService.simpleMessage(error.message);
        this.apiService.soundPleaseTopUpValue();
        resolve(error.message);
      }
    });
  }

  epinCashOut(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this.apiService.modal
          .create({ component: EpinCashOutPage, componentProps: {} })
          .then((r) => {
            r.present();
          });
      } catch (error) {
        resolve(error.message);
      }
    });
  }
  

  close() {
    this.apiService.modal.dismiss();
  }

  dynamicControlMenu() {
    this.CONTROL_MENUList = JSON.parse(JSON.stringify(this.apiService.controlMenuService.CONTROL_MENUList));

    let i = setInterval(() => {
      if (this.links == undefined) {
        this.links = (document.querySelectorAll('.control-menu') as NodeListOf<HTMLLinkElement>);
        ControlMenuService.stackCashoutPageLinks = this.links;
      } 

      this.links = ControlMenuService.stackCashoutPageLinks;
      this.animateControlMenu(this.links);

      this.apiService.controlMenuService.CONTROL_MENU.subscribe(r => {
        if (r) this.animateControlMenu(this.links, r);
      });
      clearInterval(i);

    });
  }
  animateControlMenu(links: NodeListOf<HTMLLinkElement>, res?: any) {
    links.forEach(item => {
      const name = item.className.split(' ')[2];
      if (res)
      {
        res.forEach(menu => {
          
          if (name == menu.name) {
            if (menu.status == true) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          }
        });
      }
      else 
      {
        this.CONTROL_MENUList.forEach(menu => {

          if (name == menu.name) {
            if (menu.status == true) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          }
        });
      }
    });
  }
}
