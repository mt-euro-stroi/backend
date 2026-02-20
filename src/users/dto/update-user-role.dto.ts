import { IsEnum } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'USER',
    description: 'Роль пользователя',
    enum: Role,
  })
  @IsEnum(Role)
  role: Role;
}
