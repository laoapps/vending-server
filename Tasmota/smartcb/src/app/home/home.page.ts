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
      this.loadRole();
    }
  }

  loadRole() {
    this.apiService.getUserRole().subscribe(
      (response) => {
        this.role = response.role;
      },
      () => {
        this.role = 'user'; // Default to client user if token is invalid
      }
    );
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