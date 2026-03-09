import { Role } from 'src/generated/prisma/enums';

export interface AuthUser {
  sub: number;
  email: string;
  role: Role;
}
