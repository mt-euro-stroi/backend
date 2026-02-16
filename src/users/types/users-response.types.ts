import { Role } from 'src/generated/prisma/enums';

export interface UserListItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface UserResponse extends UserListItem {
  phone: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
