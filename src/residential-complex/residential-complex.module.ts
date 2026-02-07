import { Module } from '@nestjs/common';
import { ResidentialComplexService } from './residential-complex.service';
import { ResidentialComplexController } from './residential-complex.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResidentialComplexController],
  providers: [ResidentialComplexService],
})
export class ResidentialComplexModule {}
