import { Module } from '@nestjs/common';
import { PublicBookingsController } from './controllers/public.bookings.controller';
import { AdminBookingsController } from './controllers/admin.bookings.controller';
import { BookingsService } from './bookings.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [PublicBookingsController, AdminBookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
