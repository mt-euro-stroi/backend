import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: true,
    description: 'Активен ли пользователь',
    type: 'boolean',
  })
  @IsBoolean()
  isActive: boolean;
}
