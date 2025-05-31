import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../service/user.service';
import { TokenService } from '../../../../service/token.service';
import { UserResponse } from '../../../../response/user/user.response';

@Component({
  selector: 'app-user-admin',
  templateUrl: './user.admin.component.html',
  styleUrls: ['./user.admin.component.scss']
})
export class UserAdminComponent implements OnInit {
  users: UserResponse[] = [];
  loading = false;

  constructor(private userService: UserService, private tokenService: TokenService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const token = this.tokenService.getToken();
    if (!token) return;
    this.userService.getAllUsers(token).subscribe({
      next: (res) => {
        this.users = res.result || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleActive(user: UserResponse): void {
    const token = this.tokenService.getToken();
    if (!token) return;
    this.userService.updateUserActive(user.id, !user.active, token).subscribe({
      next: (res) => {
        user.active = res.result.active;
      }
    });
  }
} 