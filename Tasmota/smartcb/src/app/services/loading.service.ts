import { Injectable, ViewChild } from '@angular/core';
import { AlertController, IonContent, LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  constructor(public loadingCtrl: LoadingController,
    public modal:ModalController,
    public toast:ToastController,
    public alertController:AlertController) {}

  load: any;
  gettoast:any;

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
      spinner: 'bubbles',
      duration: 10000,
      message: msgCustom ? msgCustom : `ກຳລັງໂຫລດຂໍ້ມູນ${msg}...`,
      translucent: true,
      cssClass: 'custom-class custom-loading',
    });
    (await this.load).present();
  }

  async onDismiss() {
    (await this.load).dismiss();
  }


  async onAlert(text:any){
    const alert = await this.alertController.create({
      header: 'ແຈ້ງເຕືອນ',
      cssClass:'app-alert',
      backdropDismiss: false,
      message: text,
      buttons: ['ຕົກລົງ']
    });
    await alert.present();
  }
  async onAlert2(title: string, text: string) {
    const alert = await this.alertController.create({
      header: title,
      cssClass:'app-alert',
      backdropDismiss: false,
      message: text,
      buttons: ['ຕົກລົງ']
    });

    await alert.present();
  }
  
  async alertError(text:any){
    const alert = await this.alertController.create({
      header: 'ເກີດຂໍ້ຜິດພາດ',
      cssClass:'app-alert',
      backdropDismiss: false,
      message: text,
      buttons: ['OK']
    });
    await alert.present();
  }

  async alertConfirm(text: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve, rejects) => {
      try {
        const alert = await this.alertController.create({
          header: "ແຈ້ງເຕືອນ",
          cssClass:'app-alert',
          backdropDismiss: false,
          message: text,
          buttons: [
            {
              text: "ຍົກເລີກ",
              role: "cancel",
              cssClass: "secondary",
              handler: () => {
                resolve(false);
              },
            },
            {
              text: "ຕົກລົງ",
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
          header: "ແຈ້ງເຕືອນ",
          cssClass:'app-alert',
          backdropDismiss: false,
          message: text,
          buttons: [
            {
              text: "ຕົກລົງ",
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
