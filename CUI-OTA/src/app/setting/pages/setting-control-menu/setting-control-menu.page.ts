import { Component, OnInit } from '@angular/core';
import { IControlMenu } from 'src/app/models/menu.model';
import { ApiService } from 'src/app/services/api.service';
import { ControlMenuService } from 'src/app/services/control-menu.service';

@Component({
    selector: 'app-setting-control-menu',
    templateUrl: './setting-control-menu.page.html',
    styleUrls: ['./setting-control-menu.page.scss'],
    standalone: false
})
export class SettingControlMenuPage implements OnInit {

  private CONTROL_MENUList: Array<{ name: string, status: boolean }> = [];
  private checkboxs: NodeListOf<HTMLInputElement>;

  constructor(
    public apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadSetting();
  }

  loadSetting() {
    this.CONTROL_MENUList = JSON.parse(JSON.stringify(this.apiService.controlMenuService.CONTROL_MENUList));

    let i = setInterval(() => {
      if (this.checkboxs == undefined)
      {
        this.checkboxs = (document.querySelectorAll('.form-check-input') as NodeListOf<HTMLInputElement>);
        ControlMenuService.settingControlPageCheckboxs = this.checkboxs;
      }
      this.checkboxs = ControlMenuService.settingControlPageCheckboxs;
      this.animateStatus();
      clearInterval(i);
    });
    
  }

  animateStatus() {
    this.checkboxs.forEach((item, index) => {
      const name = item.className.split(' ')[1];
      this.CONTROL_MENUList.filter(menu => {

        // add status
        if (name == menu.name) {
          console.log(`compare`, name == menu.name, name, menu.name);
          if (menu.status == true) {
            item.setAttribute('checked', 'true');
          } else {
            item.removeAttribute('checked');
          }
        }

        // event
        item.addEventListener('click', () => {
          if (name == menu.name) {
            if (menu.status == true) {
              item.removeAttribute('checked');
              menu.status = false;
            } else {
              item.setAttribute('checked', 'true');
              menu.status = true;
            }
          }
          
        });

      });
    });
  }

  setStatus(): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {
        
        const msg = this.apiService.alert.create({  
          header: 'Do you want to save this setting state !?',
          subHeader: 'Every menu will change visible by this setting',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.apiService.controlMenuService.CONTROL_MENUList = this.CONTROL_MENUList;
                this.apiService.controlMenuService.CONTROL_MENU.next(this.CONTROL_MENUList);
                localStorage.setItem(this.apiService.controlMenuService.localname, JSON.stringify(this.CONTROL_MENUList));
                this.apiService.simpleMessage(`Saved`);
              }
            },
            'Cancel'
          ]
        });

        (await msg).present();

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }
  close() {
    this.apiService.modal.dismiss();
  }
}
