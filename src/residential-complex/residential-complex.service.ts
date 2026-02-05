import { Injectable } from '@nestjs/common';
import { CreateResidentialComplexDto } from './dto/create-residential-complex.dto';
import { UpdateResidentialComplexDto } from './dto/update-residential-complex.dto';

@Injectable()
export class ResidentialComplexService {
  async create(createResidentialComplexDto: CreateResidentialComplexDto) {
    return 'This action adds a new residentialComplex';
  }

  async findAll() {
    return `This action returns all residentialComplex`;
  }

  async findOne(slug: string) {
    return `This action returns a #${slug} residentialComplex`;
  }

  async update(
    id: number,
    updateResidentialComplexDto: UpdateResidentialComplexDto,
  ) {
    return `This action updates a #${id} residentialComplex`;
  }

  async remove(id: number) {
    return `This action removes a #${id} residentialComplex`;
  }
}
