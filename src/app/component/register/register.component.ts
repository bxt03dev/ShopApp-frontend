import {Component, OnInit, ViewChild} from '@angular/core';
import {NgForm} from "@angular/forms";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router} from "@angular/router";
import {UserService} from "../../service/user.service";
import {RegisterDTO} from "../../dto/user/register.dto";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  @ViewChild('registerForm') registerForm!: NgForm;
  phoneNumber: string;
  password: string;
  retypePassword: string;
  fullName: string;
  address: string;
  isAccepted: boolean;
  dateOfBirth: Date;

  constructor(private router: Router, private userService: UserService) {
    this.phoneNumber = '';
    this.password = '';
    this.retypePassword = '';
    this.fullName = '';
    this.address = '';
    this.isAccepted = true;
    this.dateOfBirth = new Date();
    this.dateOfBirth.setFullYear(this.dateOfBirth.getFullYear() - 18);
  }

  ngOnInit(): void {
  }

  onPhoneNumberChange() {
    console.log(`phone type: ${this.phoneNumber}`)
  }

  onRegister() {
    //alert("Register success");
    debugger
    const RegisterDTO: RegisterDTO = {
      "fullName": this.fullName,
      "phoneNumber": this.phoneNumber,
      "address": this.address,
      "password": this.password,
      "retypePassword": this.retypePassword,
      "dateOfBirth": this.dateOfBirth,
      "facebookAccountId": 0,
      "googleAccountId": 0,
      "roleId": 1
    }
    this.userService.register(RegisterDTO).subscribe({
      next: (response: any) => {
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        const errorMessage = error.error?.message || 'server error';
        alert(`Register failed: ${errorMessage}`);
      }
    })
  }

  onDateOfBirthChange() {

  }

  checkPasswordMatch() {
    if (this.password !== this.retypePassword) {
      this.registerForm.form.controls['retypePassword'].setErrors({'passwordMisMatch': true});
    } else {
      this.registerForm.form.controls['retypePassword'].setErrors(null);
    }
  }

  checkAge() {
    if (this.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(this.dateOfBirth);
      if (birthDate > today) {
        this.registerForm.controls['dateOfBirth'].setErrors({'futureDate': true});
        return;
      }
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        this.registerForm.controls['dateOfBirth'].setErrors({'invalidAge': true});
      } else {
        this.registerForm.controls['dateOfBirth'].setErrors(null);
      }
    }
  }

}
