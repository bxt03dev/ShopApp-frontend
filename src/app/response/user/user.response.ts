import {Role} from "../../model/role";

export interface UserResponse {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  active: boolean;
  dateOfBirth: Date;
  avatarUrl: string;
  socialAccounts?: SocialAccountResponse[];
  role: Role;
}

export interface SocialAccountResponse {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  pictureUrl: string;
}
