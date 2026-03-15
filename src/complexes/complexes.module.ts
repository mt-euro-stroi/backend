import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PublicComplexController } from './controllers/public.complexes.controller';
import { AdminComplexController } from './controllers/admin.complexes.controller';
import { ComplexService } from './complexes.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicComplexController, AdminComplexController],
  providers: [ComplexService],
})
export class ComplexModule {}
