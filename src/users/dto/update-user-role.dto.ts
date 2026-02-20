import { IsEnum } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;
}