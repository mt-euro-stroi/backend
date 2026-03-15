import {
  ConflictException,
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
import type { AuthUser } from 'src/common/types/auth-user.type';
import { UserListItem, UserResponse } from './types/users-response.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from 'src/generated/prisma/enums';
import { userFullSelect, userListSelect } from './prisma/user.select';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getMe(authUser: AuthUser): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User profile request started (userId=${userId})`);

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
      select: userFullSelect,
    });

    this.logger.log(`User profile retrieved successfully (userId=${userId})`);

    return {
      message: 'Пользователь успешно получен',
      data: user,
    };
  }

  async updateMe(
    dto: UpdateUserDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User update request started (userId=${userId})`);

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });

    let resetEmailVerified = false;

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

      if (existingEmail) {
        this.logger.warn(
          `User update failed: email already exists (userId=${userId})`,
        );
        throw new ConflictException('Email уже используется');
      }

      resetEmailVerified = true;
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.prismaService.user.findUnique({
        where: { phone: dto.phone },
      });

      if (existingPhone) {
        this.logger.warn(
          `User update failed: phone already exists (userId=${userId})`,
        );
        throw new ConflictException('Номер телефона уже используется');
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...dto,
        ...(resetEmailVerified && { isEmailVerified: false }),
      },
      select: userFullSelect,
    });

    this.logger.log(`User updated successfully (userId=${userId})`);

    return {
      message: 'Пользователь успешно обновлен',
      data: updatedUser,
    };
  }

  async deleteMe(authUser: AuthUser): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(`User delete request started (userId=${userId})`);

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (user.role === Role.ADMIN) {
      this.logger.warn(`Admin self-deletion blocked (adminId=${userId})`);
      throw new ForbiddenException(
        'Админ не может удалить свою учетную запись',
      );
    }

    await this.prismaService.user.delete({
      where: { id: userId },
    });

    this.logger.warn(`User account deleted (userId=${userId})`);

    return { message: 'Пользователь успешно удален' };
  }

  async findAll(
    query: FindAllUsersDto,
  ): Promise<ServiceDataResponse<PaginatedResult<UserListItem>>> {
    this.logger.log('Users list request started');

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
      `Users list retrieved: items=${users.length}, total=${total}, page=${page}`,
    );

    return {
      message: 'Пользователи были успешно получены',
      data: {
        items: users,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<ServiceDataResponse<UserResponse>> {
    this.logger.log(`Admin user lookup started (targetUserId=${id})`);

    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: userFullSelect,
    });

    if (!user) {
      this.logger.warn(`User lookup failed: not found (userId=${id})`);
      throw new NotFoundException('Пользователь не найден');
    }

    this.logger.log(`Admin user retrieved successfully (targetUserId=${id})`);

    return {
      message: 'Пользователь был успешно получен',
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
      `Admin role update started (targetUserId=${id}, newRole=${role})`,
    );

    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      this.logger.warn(
        `Admin role update failed: user not found (targetUserId=${id})`,
      );
      throw new NotFoundException('Пользователь не найден');
    }

    if (id === userId) {
      this.logger.warn(
        `Admin role update blocked: attempt to change own role (adminId=${userId})`,
      );
      throw new ForbiddenException(
        'Вы не можете изменить свою собственную роль',
      );
    }

    if (existingUser.role === Role.ADMIN && role !== Role.ADMIN) {
      const adminsCount = await this.prismaService.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminsCount <= 1) {
        this.logger.warn(
          `Admin role update blocked: attempt to remove last admin (targetUserId=${id})`,
        );
        throw new ForbiddenException(
          'Невозможно изменить роль последнего админа системы',
        );
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: { role },
      select: userFullSelect,
    });

    this.logger.log(`Admin role updated successfully (targetUserId=${id})`);

    return {
      message: 'Роль пользователя успешно обновлена',
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
      `Admin user status update started (targetUserId=${id}, newStatus=${isActive})`,
    );

    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      this.logger.warn(
        `Admin user status update failed: user not found (targetUserId=${id})`,
      );
      throw new NotFoundException('Пользователь не найден');
    }

    if (id === userId && isActive === false) {
      this.logger.warn(
        `Admin status update blocked: attempt to deactivate own account (adminId=${userId})`,
      );
      throw new ForbiddenException(
        'Вы не можете деактивировать свою собственную учетную запись',
      );
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
          `Admin status update blocked: attempt to deactivate last admin (targetUserId=${id})`,
        );
        throw new ForbiddenException(
          'Невозможно деактивировать последнего админа системы',
        );
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: { isActive },
      select: userFullSelect,
    });

    this.logger.log(
      `Admin user status updated successfully (targetUserId=${id}, newStatus=${isActive})`,
    );

    return {
      message: 'Статус пользователя успешно обновлен',
      data: updatedUser,
    };
  }

  async deleteUser(
    id: number,
    authUser: AuthUser,
  ): Promise<ServiceMessageResponse> {
    const adminId = authUser.sub;

    this.logger.log(
      `Admin user delete started (targetUserId=${id}, adminId=${adminId})`,
    );

    const targetUser = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      this.logger.warn(
        `Admin user delete failed: user not found (targetUserId=${id})`,
      );
      throw new NotFoundException('Пользователь не найден');
    }

    if (id === adminId) {
      this.logger.warn(`Admin self-deletion blocked (adminId=${adminId})`);
      throw new ForbiddenException(
        'Вы не можете удалить свою собственную учетную запись',
      );
    }

    if (targetUser.role === Role.ADMIN) {
      const adminsCount = await this.prismaService.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminsCount <= 1) {
        this.logger.warn(
          `Admin delete blocked: attempt to remove last admin (targetUserId=${id})`,
        );
        throw new ForbiddenException(
          'Невозможно удалить последнего админа системы',
        );
      }
    }

    await this.prismaService.user.delete({
      where: { id },
    });

    this.logger.log(
      `Admin user deleted successfully (targetUserId=${id}, adminId=${adminId})`,
    );

    return {
      message: 'Пользователь успешно удален',
    };
  }
}
