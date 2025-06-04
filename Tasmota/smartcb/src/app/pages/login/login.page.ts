import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  phoneNumber: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  login() {
    this.apiService.login(this.phoneNumber).subscribe(
      (response) => {
        localStorage.setItem('token', response.token);
        const route = response.role === 'admin' ? '/admin-dashboard' : response.role === 'owner' ? '/owner-dashboard' : '/user-dashboard';
        this.router.navigate([route]);
      },
      (error) => {
        console.error('Login failed', error);
      }
    );
  }
}