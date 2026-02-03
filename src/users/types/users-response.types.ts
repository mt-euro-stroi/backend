export interface UserResponse {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string;
  role: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
