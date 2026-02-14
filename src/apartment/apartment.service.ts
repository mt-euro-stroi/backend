import { Injectable, Logger } from '@nestjs/common';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApartmentService {
  private readonly logger = new Logger(ApartmentService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(createApartmentDto: CreateApartmentDto, files: string[]) {
    return 'This action adds a new apartment';
  }

  async findAll() {
    return `This action returns all apartment`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} apartment`;
  }

  async update(id: number, updateApartmentDto: UpdateApartmentDto, newFiles: string[]) {
    return `This action updates a #${id} apartment`;
  }

  async remove(id: number) {
    return `This action removes a #${id} apartment`;
  }
}
