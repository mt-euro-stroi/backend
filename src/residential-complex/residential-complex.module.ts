import { Module } from '@nestjs/common';
import { ResidentialComplexService } from './residential-complex.service';
import { ResidentialComplexController } from './residential-complex.controller';

@Module({
  controllers: [ResidentialComplexController],
  providers: [ResidentialComplexService],
})
export class ResidentialComplexModule {}
