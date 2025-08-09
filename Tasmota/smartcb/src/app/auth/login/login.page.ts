import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { AuthServiceService } from 'src/app/services/authService/auth-service.service';

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

  constructor(
    public auth:AuthServiceService,
    private apiService: ApiService,
    private router: Router,
    public alertController:AlertController
  ) { }

  ngOnInit() {
  }

  async onClick_login(){
    if (!this.phonenumber  || !this.password) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Please fill in all fields with valid values.',
        buttons: ['OK'],
      });
      await alert.present();
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
        // this.load.onDismiss();
        // this.load.alertError('alert_error.message_check_name_password');
      }
    },async (error:any) => {
      console.log('====================================');
      console.log(error);
      console.log('====================================');
      // this.load.onDismiss();
      // this.load.alertError('alert_error.message_something_wrong');
    });
  }

  onClick_Register(){
    
  }

  loadRole() {
    this.apiService.getUserRole().subscribe(
      (response) => {
        console.log('loadRole',response.role);
        
        this.role = response.role;
        if (this.role == 'admin') {
          
        }else if(this.role == 'owner'){
          this.load_owner_detail();
          this.navigateTo('/owner')
        }else if(this.role == 'user'){
          this.navigateTo('/user')
        }
      },
      () => {
        this.role = 'user'; // Default to client user if token is invalid
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

}
