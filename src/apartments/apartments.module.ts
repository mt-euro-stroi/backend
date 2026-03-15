import { Module } from '@nestjs/common';
import { PublicApartmentController } from './controllers/public.apartments.controller';
import { AdminApartmentController } from './controllers/admin.apartments.controller';
import { ApartmentService } from './apartments.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicApartmentController, AdminApartmentController],
  providers: [ApartmentService],
})
export class ApartmentModule {}
