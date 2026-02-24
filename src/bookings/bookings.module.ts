import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PublicBookingsController } from './public/public.bookings.controller';
import { AdminBookingsController } from './admin/admin.bookings.controller';
import { PublicBookingsService } from './public/public.bookings.service';
import { AdminBookingsService } from './admin/admin.bookings.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicBookingsController, AdminBookingsController],
  providers: [PublicBookingsService, AdminBookingsService],
})
export class BookingsModule {}
