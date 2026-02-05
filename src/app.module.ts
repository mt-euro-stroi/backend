import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MailService } from './mail/mail.service';
import { ResidentialComplexModule } from './residential-complex/residential-complex.module';

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
    ResidentialComplexModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
