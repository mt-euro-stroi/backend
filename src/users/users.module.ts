import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PublicUsersController } from './controllers/public.users.controller';
import { AdminUsersController } from './controllers/admin.users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicUsersController, AdminUsersController],
  providers: [UsersService],
})
export class UsersModule {}
