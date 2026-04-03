import { Module } from '@nestjs/common';
import { PublicComplexController } from './controllers/public.complexes.controller';
import { AdminComplexController } from './controllers/admin.complexes.controller';
import { ComplexService } from './complexes.service';

@Module({
  controllers: [PublicComplexController, AdminComplexController],
  providers: [ComplexService],
})
export class ComplexModule {}
