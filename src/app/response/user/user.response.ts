import {Role} from "../../model/role";

export interface UserResponse {
  id: number;
  fullName: string;
  address: string;
  isActive: boolean;
  dateOfBirth: Date;
  facebookAccountId: number;
  googleAccountId: number;
  role: Role;
}
