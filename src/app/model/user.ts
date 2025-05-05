import { Role } from './role'

export interface User {
  id: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  password: string;
  active: boolean;
  dateOfBirth: Date;
  facebookAccountId: number;
  googleAccountId: number;
  role: Role;
}
