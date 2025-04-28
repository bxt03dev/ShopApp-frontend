import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsDate
}from 'class-validator'
export class RegisterDTO {
  @IsString()
  fullName: string;
  @IsPhoneNumber()
  phoneNumber: string;
  @IsString()
  address: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsString()
  @IsNotEmpty()
  retypePassword: string;
  @IsDate()
  dateOfBirth: Date;
  facebookAccountId: number = 0;
  googleAccountId: number = 0;
  roleId: number = 1;
  constructor(data : any) {
    this.fullName = data.fullName;
    this.phoneNumber = data.phoneNumber;
    this.address = data.address;
    this.password = data.password;
    this.retypePassword = data.retypePassword;
    this.dateOfBirth = data.dateOfBirth;
    this.facebookAccountId = data.facebookAccountId || 0;
    this.googleAccountId = data.googleAccountId || 0;
    this.roleId = data.roleId || 1;
  }
}
