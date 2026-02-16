import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListItem, UserResponse } from './types/users-response.types';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prismaService: PrismaService) {}

  private readonly userFullSelect = {
    id: true,
    firstName: true,
    lastName: true,
    phone: true,
    email: true,
    role: true,
    isActive: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async findAll(
    query: FindAllUsersDto,
  ): Promise<ServiceDataResponse<PaginatedResult<UserListItem>>> {
    this.logger.log('Users list request started.');

    const { page = 1, limit = 20, search, isActive } = query;

    const skip = (page - 1) * limit;

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    this.logger.log(
      `Users list retrieved: items=${users.length}, total=${total}, page=${page}.`,
    );

    return {
      message: 'Users retrieved successfully.',
      data: {
        items: users,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findMe(authUser: AuthUser): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User profile request started (userId=${userId}).`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: this.userFullSelect,
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

  async findOneById(id: number): Promise<ServiceDataResponse<UserResponse>> {
    this.logger.log(`Admin user lookup started (targetUserId=${id}).`);

    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: this.userFullSelect,
    });

    if (!user) {
      this.logger.warn(`User lookup failed: not found (userId=${id}).`);
      throw new NotFoundException('User not found.');
    }

    this.logger.log(`Admin user retrieved successfully (targetUserId=${id}).`);

    return {
      message: 'User retrieved successfully.',
      data: user,
    };
  }

  async updateMe(
    updateUserDto: UpdateUserDto,
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
      data: { ...updateUserDto },
      select: this.userFullSelect,
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
    });

    if (!user) {
      this.logger.warn(`User delete failed: not found (userId=${userId}).`);
      throw new NotFoundException('User not found.');
    }

    await this.prismaService.user.delete({
      where: { id: userId },
    });

    this.logger.warn(`User account deleted (userId=${userId}).`);

    return { message: 'User deleted successfully.' };
  }
}
