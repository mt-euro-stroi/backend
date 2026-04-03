import { Module } from '@nestjs/common';
import { PublicUsersController } from './controllers/public.users.controller';
import { AdminUsersController } from './controllers/admin.users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [PublicUsersController, AdminUsersController],
  providers: [UsersService],
})
export class UsersModule {}
