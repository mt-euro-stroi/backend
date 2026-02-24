import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PublicComplexController } from './public/public.complexes.controller';
import { AdminComplexController } from './admin/admin.complexes.controller';
import { PublicComplexService } from './public/public.complexes.service';
import { AdminComplexService } from './admin/admin.complexes.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicComplexController, AdminComplexController],
  providers: [PublicComplexService, AdminComplexService],
})
export class ComplexModule {}
