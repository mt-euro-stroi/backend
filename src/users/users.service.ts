import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './types/users-response.types';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);

  constructor(private prismaService: PrismaService) {}

  async findAll(
    query: FindAllUsersDto,
  ): Promise<ServiceDataResponse<PaginatedResult<UserResponse>>> {
    this.logger.log('Users list request started');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { email: { contains: query.search } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
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
          phone: true,
          email: true,
          role: true,
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    this.logger.log(
      `Users list retrieved successfully: items=${users.length}, total=${total}`,
    );

    return {
      message: 'Users retrieved successfully',
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

    this.logger.log(`User profile request started: userId=${userId}`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
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
      },
    });

    if (!user) {
      this.logger.warn(
        `User profile request failed: user not found (userId=${userId})`,
      );
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User profile retrieved successfully: userId=${userId}`);

    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async findOneById(id: number): Promise<ServiceDataResponse<UserResponse>> {
    this.logger.log(`Admin user lookup started: targetUserId=${id}`);

    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
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
      },
    });

    if (!user) {
      this.logger.warn(
        `Admin user lookup failed: user not found (userId=${id})`,
      );
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Admin user retrieved successfully: targetUserId=${id}`);

    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async updateMe(
    authUser: AuthUser,
    updateUserDto: UpdateUserDto,
  ): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User update request started: userId=${userId}`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User update failed: user not found (userId=${userId})`);
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { ...updateUserDto },
    });

    this.logger.log(`User updated successfully: userId=${userId}`);

    const { password, verificationCode, ...safeUser } = updatedUser;

    return {
      message: 'User updated successfully',
      data: safeUser,
    };
  }

  async removeMe(authUser: AuthUser): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(`User delete request started: userId=${userId}`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User delete failed: user not found (userId=${userId})`);
      throw new NotFoundException('User not found');
    }

    await this.prismaService.user.delete({
      where: { id: userId },
    });

    this.logger.warn(`User deleted: userId=${userId}`);

    return { message: 'User deleted successfully' };
  }
}
