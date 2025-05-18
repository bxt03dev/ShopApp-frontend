export class UpdateUserDTO {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  password?: string;
  retypePassword?: string;
  dateOfBirth?: Date;
  email?: string;
  avatarUrl?: string;
  
  constructor(data: any) {
    this.fullName = data.fullName;
    this.phoneNumber = data.phoneNumber;
    this.address = data.address;
    this.password = data.password;
    this.retypePassword = data.retypePassword;
    this.dateOfBirth = data.dateOfBirth;
    this.email = data.email;
    this.avatarUrl = data.avatarUrl;
  }
} 