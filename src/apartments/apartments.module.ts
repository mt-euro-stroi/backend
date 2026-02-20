import { Module } from '@nestjs/common';
import { PublicApartmentController } from './public/public.apartments.controller';
import { AdminApartmentController } from './admin/admin.apartments.controller';
import { PublicApartmentService } from './public/public.apartments.service';
import { AdminApartmentService } from './admin/admin.apartments.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicApartmentController, AdminApartmentController],
  providers: [PublicApartmentService, AdminApartmentService],
})
export class ApartmentModule {}
