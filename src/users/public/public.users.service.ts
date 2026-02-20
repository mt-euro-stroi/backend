import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import type { AuthUser } from 'src/common/types/auth-user.type';
import { UserResponse } from '../types/users-response.types';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Role } from 'src/generated/prisma/enums';
import { userFullSelect } from '../prisma/user.select';

@Injectable()
export class PublicUsersService {
  private readonly logger = new Logger(PublicUsersService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findMe(authUser: AuthUser): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User profile request started (userId=${userId}).`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: userFullSelect,
    });

    if (!user) {
      this.logger.warn(
        `User not found for authenticated session (userId=${userId}).`,
      );
      throw new NotFoundException('User not found.');
    }

    this.logger.log(`User profile retrieved successfully (userId=${userId}).`);

    return {
      message: 'User retrieved successfully.',
      data: user,
    };
  }

  async updateMe(
    dto: UpdateUserDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User update request started (userId=${userId}).`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User update failed: not found (userId=${userId}).`);
      throw new NotFoundException('User not found.');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { ...dto },
      select: userFullSelect,
    });

    this.logger.log(`User updated successfully (userId=${userId}).`);

    return {
      message: 'User updated successfully.',
      data: updatedUser,
    };
  }

  async removeMe(authUser: AuthUser): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(`User delete request started (userId=${userId}).`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      this.logger.warn(`User delete failed: not found (userId=${userId}).`);
      throw new NotFoundException('User not found.');
    }

    if (user.role === Role.ADMIN) {
      this.logger.warn(`Admin self-deletion blocked (adminId=${userId}).`);
      throw new ForbiddenException('Admin cannot delete own account.');
    }

    await this.prismaService.user.delete({
      where: { id: userId },
    });

    this.logger.warn(`User account deleted (userId=${userId}).`);

    return { message: 'User deleted successfully.' };
  }
}
