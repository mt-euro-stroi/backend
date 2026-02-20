import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ComplexModule } from './complexes/complexes.module';
import { ApartmentModule } from './apartments/apartments.module';
import { FavouritesModule } from './favourites/favourites.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '.', 'uploads'),
      serveRoot: '/uploads',
    }),
    MailModule,
    ComplexModule,
    ApartmentModule,
    FavouritesModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
