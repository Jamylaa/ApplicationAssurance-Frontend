import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  user = this.authService.getUser();
  role = this.authService.getRole();

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
