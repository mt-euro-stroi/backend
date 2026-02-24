import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateComplexStatusDto {
  @ApiProperty({
    example: true,
    description: 'Опубликовать комплекс',
    type: 'boolean',
  })
  @IsBoolean()
  isPublished: boolean;
}
