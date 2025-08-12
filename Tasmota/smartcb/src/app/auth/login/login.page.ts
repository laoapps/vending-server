import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { AuthServiceService } from 'src/app/services/authService/auth-service.service';
import { LoadingService } from 'src/app/services/loading.service';
import { RegisterPage } from '../register/register.page';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  public phonenumber:any;
  public password:any;
  role: string | null = null;
  isOwner: boolean = false;
  isUser: boolean = false;

  constructor(
    public auth:AuthServiceService,
    private apiService: ApiService,
    private router: Router,
    public alertController:AlertController,
    public m: LoadingService,
  ) { }

  ngOnInit() {
  }

  async onClick_login(){
    const selectedRole = this.isOwner ? 'Owner' : 'User';

    console.log('====================================');
    console.log(selectedRole);
    console.log('====================================');

    if (!this.phonenumber  || !this.password) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Please fill in all fields with valid values.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (!this.isOwner && !this.isUser) {
      this.showAlert('Alert', 'Please select a role');
      return;
    }

    let a = JSON.parse(JSON.stringify(this.phonenumber));
    if (a?.toString().length == 8) {
      a = '+85620' + a
    }
    let data = {
      phonenumber: a,
      password: this.password
    }
    console.log('====================================');
    console.log(data);
    console.log('====================================');
    this.auth.login(data).subscribe(async (res:any) => {
      console.log('login res',res);
      if (res.status == 1) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('uuid', res.data.uuid);
        this.phonenumber = '';
        this.password = '';
        this.loadRole();
        // this.navigateTo('/home')
      } else {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Login fail please check phonenumber and password',
          buttons: ['OK'],
        });
        await alert.present();
        return;
      }
    },async (error:any) => {
      console.log('====================================');
      console.log(error);
      console.log('====================================');
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Login fail please check phonenumber and password',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    });
  }

  onClick_Register(){
    this.m.showModal(RegisterPage).then((r) => {
          if (r) {
            r.present();
            r.onDidDismiss().then((res) => {
              if (res.data.dismiss) {
           
              }
            });
          }
        });
  }

  loadRole() {
    this.apiService.getUserRole().subscribe(
      (response) => {
        const selectedRole = this.isOwner ? 'Owner' : 'User';
        console.log('loadRole',response.role);
        console.log('selectedRole',selectedRole);

        this.role = response.role;
        if (selectedRole == 'Owner' && this.role == 'owner') {
          this.isOwner = false;
          this.isUser = false;
          localStorage.setItem('ownerHeader','true')
          this.load_owner_detail();
          this.navigateTo('/owner')
        }else{
          this.isOwner = false;
          this.isUser = false;
          this.navigateTo('/user')
        }
        
        // if (this.role == 'admin') {
          
        // }else if(this.role == 'owner'){

        // }else if(this.role == 'user'){
        // }
      },
      () => {
        // this.role = 'user'; // Default to client user if token is invalid
      }
    );
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  load_owner_detail(){
    this.apiService.owners_detail().subscribe((r)=>{
      console.log('====================================');
      console.log('owner detail',r);
      console.log('====================================');
      localStorage.setItem('id_owner',r.id)
    },error=>{
      console.log('====================================');
      console.log(error);
      console.log('====================================');
    })
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

}
