import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PublicUsersController } from './public/public.users.controller';
import { AdminUsersController } from './admin/admin.users.controller';
import { PublicUsersService } from './public/public.users.service';
import { AdminUsersService } from './admin/admin.users.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicUsersController, AdminUsersController],
  providers: [PublicUsersService, AdminUsersService],
})
export class UsersModule {}
