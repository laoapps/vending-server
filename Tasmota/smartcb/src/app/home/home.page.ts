import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  role: string | null = null;
  token: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
    }
  }

 

  registerOwner() {
    this.apiService.registerOwner(this.token).subscribe(
      (response) => {
        localStorage.setItem('token', response.token);
        this.role = 'owner';
      },
      (error) => {
        console.error('Registration failed:', error);
      }
    );
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}