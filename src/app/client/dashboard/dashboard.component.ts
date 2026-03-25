import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  isAdmin = false;

  constructor(private authService: AuthService) {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
  }

  logout() {
    this.authService.logout();
  }
}
