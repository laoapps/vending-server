import { Component, OnInit } from '@angular/core';
import { IENMessage } from 'src/app/models/base.model';
import { ApiService } from 'src/app/services/api.service';
import { LaabCashoutPage } from '../laab-cashout/laab-cashout.page';
import { EpinCashOutPage } from '../epin-cash-out/epin-cash-out.page';
import { ControlMenuService } from 'src/app/services/control-menu.service';

@Component({
  selector: 'app-stack-cashout',
  templateUrl: './stack-cashout.page.html',
  styleUrls: ['./stack-cashout.page.scss'],
})
export class StackCashoutPage implements OnInit {

    private CONTROL_MENUList: Array<{ name: string, status: boolean }> = [];
    private links: NodeListOf<HTMLLinkElement>;

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.dynamicControlMenu();
  }

  laabCashout(state: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if (this.apiService.cash == 0)
          throw new Error(IENMessage.thereIsNotBalance);

        const props = {
          state: state
        };
        this.apiService.modal
          .create({ component: LaabCashoutPage, componentProps: props })
          .then((r) => {
            r.present();
            resolve(IENMessage.success);
          });
      } catch (error) {
        this.apiService.simpleMessage(error.message);
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
