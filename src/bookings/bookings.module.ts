import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PublicBookingsController } from './public/public.bookings.controller';
import { AdminBookingsController } from './controllers/admin.bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicBookingsController, AdminBookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
