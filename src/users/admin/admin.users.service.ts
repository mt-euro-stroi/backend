import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import { UserListItem, UserResponse } from '../types/users-response.types';
import { FindAllUsersDto } from '../dto/find-all-users.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { Role } from 'src/generated/prisma/enums';
import { userFullSelect, userListSelect } from '../prisma/user.select';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(private readonly prismaService: PrismaService) {}

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
        select: userListSelect,
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

  async findOneById(id: number): Promise<ServiceDataResponse<UserResponse>> {
    this.logger.log(`Admin user lookup started (targetUserId=${id}).`);

    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: userFullSelect,
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

  async updateRole(
    id: number,
    dto: UpdateUserRoleDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<UserResponse>> {
    const { role } = dto;
    const userId = authUser.sub;

    this.logger.log(
      `Admin role update started (targetUserId=${id}, newRole=${role}).`,
    );

    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      this.logger.warn(
        `Admin role update failed: user not found (targetUserId=${id}).`,
      );
      throw new NotFoundException('User not found.');
    }

    if (id === userId) {
      this.logger.warn(
        `Admin role update blocked: attempt to change own role (adminId=${userId}).`,
      );
      throw new ForbiddenException('You cannot change your own role.');
    }

    if (existingUser.role === Role.ADMIN && role !== Role.ADMIN) {
      const adminsCount = await this.prismaService.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminsCount <= 1) {
        this.logger.warn(
          `Admin role update blocked: attempt to remove last admin (targetUserId=${id}).`,
        );
        throw new ForbiddenException(
          'Cannot remove the last admin in the system.',
        );
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: { role },
      select: userFullSelect,
    });

    this.logger.log(`Admin role updated successfully (targetUserId=${id}).`);

    return {
      message: 'User role updated successfully.',
      data: updatedUser,
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateUserStatusDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<UserResponse>> {
    const { isActive } = dto;
    const userId = authUser.sub;

    this.logger.log(
      `Admin user status update started (targetUserId=${id}, newStatus=${isActive}).`,
    );

    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      this.logger.warn(
        `Admin user status update failed: user not found (targetUserId=${id}).`,
      );
      throw new NotFoundException('User not found.');
    }

    if (id === userId && isActive === false) {
      this.logger.warn(
        `Admin status update blocked: attempt to deactivate own account (adminId=${userId}).`,
      );
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    if (existingUser.role === Role.ADMIN && isActive === false) {
      const adminsCount = await this.prismaService.user.count({
        where: {
          role: Role.ADMIN,
          isActive: true,
        },
      });

      if (adminsCount <= 1) {
        this.logger.warn(
          `Admin status update blocked: attempt to deactivate last admin (targetUserId=${id}).`,
        );
        throw new ForbiddenException(
          'Cannot deactivate the last admin in the system.',
        );
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: { isActive },
      select: userFullSelect,
    });

    this.logger.log(
      `Admin user status updated successfully (targetUserId=${id}, newStatus=${isActive}).`,
    );

    return {
      message: 'User status updated successfully.',
      data: updatedUser,
    };
  }

  async removeUserByAdmin(
    id: number,
    authUser: AuthUser,
  ): Promise<ServiceMessageResponse> {
    const adminId = authUser.sub;

    this.logger.log(
      `Admin user delete started (targetUserId=${id}, adminId=${adminId}).`,
    );

    const targetUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      this.logger.warn(
        `Admin user delete failed: user not found (targetUserId=${id}).`,
      );
      throw new NotFoundException('User not found.');
    }

    if (id === adminId) {
      this.logger.warn(`Admin self-deletion blocked (adminId=${adminId}).`);
      throw new ForbiddenException('You cannot delete your own account.');
    }

    if (targetUser.role === Role.ADMIN) {
      const adminsCount = await this.prismaService.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminsCount <= 1) {
        this.logger.warn(
          `Admin delete blocked: attempt to remove last admin (targetUserId=${id}).`,
        );
        throw new ForbiddenException(
          'Cannot delete the last admin in the system.',
        );
      }
    }

    await this.prismaService.user.delete({
      where: { id },
    });

    this.logger.log(
      `Admin user deleted successfully (targetUserId=${id}, adminId=${adminId}).`,
    );

    return {
      message: 'User deleted successfully.',
    };
  }
}
