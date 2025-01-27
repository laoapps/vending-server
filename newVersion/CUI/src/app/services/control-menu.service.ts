import { Injectable } from '@angular/core';
import { IControlMenu } from '../models/menu.model';
import { BehaviorSubject } from 'rxjs';
import { IENMessage } from '../models/base.model';
import cryptojs from "crypto-js";

@Injectable({
  providedIn: 'root'
})
export class ControlMenuService {

  public CONTROL_MENUList: Array<{ name: string, status: boolean }> = [
    {
      name: 'menu-ticket',
      status: true,
    },
    {
      name: 'menu-laab-cashin',
      status: true,
    },
    {
      name: 'menu-cashout',
      status: true,
    },
    {
      name: 'menu-whatsapp',
      status: true,
    },
    {
      name: 'menu-showlaabtab',
      status: true,
    },
    {
      name: 'menu-how-to',
      status: true,
    },
    {
      name: 'menu-tempurature',
      status: true,
    },
    {
      name: 'menu-mmoney-ios-android-qr-link',
      status: true,
    },
    {
      name: 'menu-cashout-mmoney-account',
      status: true,
    },
    {
      name: 'menu-cashout-laab-account',
      status: true,
    },
    {
      name: 'menu-cashout-laab-epin',
      status: true,
    },


    {
      name: 'menu-cashout-vietcombank-account',
      status: true,
    },
    {
      name: 'menu-cashout-vietinbank-account',
      status: true,
    },



    {
      name: 'menu-cashout-icbcbank-account',
      status: true,
    },
    {
      name: 'menu-cashout-bocbank-account',
      status: true,
    },





    {
      name: 'menu-cashout-kaskornbank-account',
      status: true,
    },
    {
      name: 'menu-cashout-bangkokbank-account',
      status: true,
    },





    {
      name: 'menu-cashout-bcabank-account',
      status: true,
    },
    {
      name: 'menu-cashout-dbsbank-account',
      status: true,
    },




    {
      name: 'menu-cashout-abank-account',
      status: true,
    },
    {
      name: 'menu-cashout-mcbbank-account',
      status: true,
    },
  ];
  CONTROL_MENU = new BehaviorSubject<Array<{ name: string, status: boolean }>>([]);

  public static settingControlPageCheckboxs: NodeListOf<HTMLInputElement>;
  public static tab1PageLinks: NodeListOf<HTMLLinkElement>;
  public static stackCashoutPageLinks: NodeListOf<HTMLLinkElement>;

  localname: string = 'CONTROL_MENU';



  constructor() {
    const local = localStorage.getItem(this.localname);
    if (local == undefined || local == null) {
      localStorage.setItem(this.localname, JSON.stringify(this.CONTROL_MENUList));
    } else {
      const list: Array<{ name: string, status: boolean }> = JSON.parse(local);
      if (list != undefined && this.CONTROL_MENUList != undefined && list.length == this.CONTROL_MENUList.length) {
        this.CONTROL_MENUList = list;
      }
      else {
        // when user was add new menu this function will auto update localstorage
        // old -> list
        // new -> menu list

        localStorage.setItem(this.localname, JSON.stringify(this.CONTROL_MENUList.filter(item => !list.includes(item))));

      }
    }
  }

  disableControlMenuFunction(menu_name: string) {
    const list = JSON.parse(JSON.stringify(this.CONTROL_MENUList));
    const status = list.filter(item => item.name == menu_name)[0]?.status;
    return status;
  }

}
