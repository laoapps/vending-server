import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { gameServiceMenuJSON } from './menu';
import { IVendingGameMenu } from 'src/app/models/vending.model';
import { IENMessage } from 'src/app/models/base.model';
import { FortunewheelPage } from 'src/app/fortunewheel/fortunewheel.page';
import { ScratchingPage } from 'src/app/scratching/scratching.page';
import { environment } from 'src/environments/environment';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-play-games',
  templateUrl: './play-games.page.html',
  styleUrls: ['./play-games.page.scss'],
})
export class PlayGamesPage implements OnInit {

  lists: Array<any> = [];
  prod=environment.production;
  constructor(
    public apiService: ApiService,
    public modal: ModalController

  ) { 
    this.apiService.___PlayGamesPage = this.modal;

  }

  ngOnInit() {
    this.lists = gameServiceMenuJSON;
    this.apiService.soundOtherServices();
  }

  close() {
    this.apiService.modal.dismiss();
  }

  selectMenu(value: IVendingGameMenu): Promise<any> {
    return new Promise<any> (async (resolve, reject) => {
      try {

        // if (this.prod == false) return resolve(IENMessage.success);
        
        if (!Object.keys(IVendingGameMenu).includes(value)) throw new Error(IENMessage.invalidSelectionGameMenu);

        switch (value)
        {
          case IVendingGameMenu.scratching_game:
            this.openScratch();
            break;
          case IVendingGameMenu.fortune_wheel_game:
            this.openFortuneWheel();
            break;
        }

      } catch (error) {
        this.apiService.simpleMessage(error.message);
        resolve(error.message);
      }
    });
  }

  openFortuneWheel(){
    this.apiService.showModal(FortunewheelPage).then(r=>{
      r.present();
    })
  }
  openScratch(){
    this.apiService.showModal(ScratchingPage).then(r=>{
      r.present();
    })
  }
}
