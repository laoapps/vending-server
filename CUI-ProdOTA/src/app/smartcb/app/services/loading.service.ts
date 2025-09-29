import { Injectable, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  constructor(public loadingCtrl: LoadingController,
    public modal:ModalController,
    public toast:ToastController,
    public alertController:AlertController,
    public router:Router
  ) {}

  load: any;
  gettoast:any;

  async logout(){
    const alert = await this.alertController.create({
      header: 'Confirm logout',
      message: 'Are you sure you want logout?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'ok',
          handler: () => {
            // localStorage.removeItem('token');
            // localStorage.removeItem('uuid');
            // localStorage.removeItem('id_owner');
            // localStorage.removeItem('ownerHeader');
            this.router.navigate(['tabs/tab1']);
          },
        },
      ],
    });
    await alert.present();
  }

  async ontoast(txt:string,time:number) {
    const toast = await this.toast.create({
      message: txt,
      duration: time,
      position: 'bottom',
      mode: 'ios',
      color: 'dark',
      // icon: 'information-circle',
    });
    toast.present();
  }

  async ontoast_fix(txt:string) {
      this.gettoast = await this.toast.create({
      message: txt,
      position: 'bottom',
      mode: 'ios',
      color: 'dark'
    });
      this.gettoast.present();
  }

  async onDismiss_toast() {
    this.gettoast.dismiss();
  }

  async onLoading(msg: string, msgCustom?: string) {
    this.load = this.loadingCtrl.create({
      spinner: null,
      duration: 10000,
      // message: msgCustom ? msgCustom : `On Lodding${msg}...`,
      message: msgCustom ? '<div class="loader"></div>' + msgCustom : '<div class="loader"></div>' + `On lodding${msg}...`,
      translucent: true,
      cssClass: 'loading-wraper',
    });
    (await this.load).present();
  }

  async onDismiss() {
    (await this.load).dismiss();
  }


  async onAlert(text:any){
    const alert = await this.alertController.create({
      header: 'Alert',
      cssClass:'app-alert',
      backdropDismiss: false,
      message: text,
      buttons: ['Ok']
    });
    await alert.present();
  }
  async onAlert2(title: string, text: string) {
    const alert = await this.alertController.create({
      header: title,
      cssClass:'app-alert',
      backdropDismiss: false,
      message: text,
      buttons: ['Ok']
    });

    await alert.present();
  }
  
  async alertError(text:any){
    const alert = await this.alertController.create({
      header: 'Error',
      cssClass:'app-alert',
      backdropDismiss: false,
      message: text,
      buttons: ['Ok']
    });
    await alert.present();
  }

  async alertConfirm(text: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, rejects) => {
      try {
        const alert = await this.alertController.create({
          header: "Alert",
          cssClass:'app-alert',
          backdropDismiss: false,
          message: text,
          buttons: [
            {
              text: "Cancel",
              role: "cancel",
              cssClass: "secondary",
              handler: () => {
                resolve(false);
              },
            },
            {
              text: "Ok",
              handler: () => {
                resolve(true);
              },
            },
          ],
        });
        await alert.present();
      } catch (error) {
        rejects(error);
      }
    });
  }

  async alert_justOK(text: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, rejects) => {
      try {
        const alert = await this.alertController.create({
          header: "Alert",
          cssClass:'app-alert',
          backdropDismiss: false,
          message: text,
          buttons: [
            {
              text: "Ok",
              handler: () => {
                resolve(true);
              },
            },
          ],
        });
        await alert.present();
      } catch (error) {
        rejects(error);
      }
    });
  }

  // async showModal(component: any, d: any = {},cssClass:string='') {
  //   try {
  //     return await this.modal.create({ 
  //       component,
  //       componentProps: d,
  //       cssClass: cssClass||'full-modal',
  //       // backdropDismiss:false
  //     });
  //   } catch (error) {
  //     console.log('ERROR', error);
  //     this.toast.create({ message: 'Error' }).then(r => {
  //       r.present();
  //     });
  //   }
  // }

  async showModal(component: any, d: any = {}, cssClass: string = '') {
  try {
    return await this.modal.create({ 
      component,
      componentProps: d,
      cssClass: cssClass || 'full-modal',
      backdropDismiss:false
    });
  } catch (error) {
    console.log('ERROR', error);
    this.toast.create({ message: 'Error' }).then(r => r.present());
    return null;
  }
}

  closeModal(data: any = null) {
    this.modal.getTop().then(r => {
      r ? r.dismiss(data) : null;
    })
  }
}
