import { PartialType } from '@nestjs/mapped-types';
import { CreateResidentialComplexDto } from './create-residential-complex.dto';

export class UpdateResidentialComplexDto extends PartialType(
  CreateResidentialComplexDto,
) {}
