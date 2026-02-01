import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from 'src/common/types/auth-user.type';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
  UserResponse
} from './types/users-response.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);

  constructor(private prismaService: PrismaService) {}

  async findAll(query: FindAllUsersDto): Promise<ServiceDataResponse<PaginatedResult<UserResponse>>> {
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

    const [ users, total ] = await this.prismaService.$transaction([
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

    this.logger.log(`Users list retrieved successfully: items=${ users.length }, total=${ total }`,);

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


  async findOne(id: number, authUser: AuthUser): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User details request started: userId=${ id }`);

    if (id !== userId) {
      this.logger.warn(`User details access denied: requestedId=${ id }, authUserId=${ userId }`);
      throw new ForbiddenException('Access denied');
    }

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
      this.logger.warn(`User not found: userId=${ id }`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User details retrieved successfully: userId=${ id }`);

    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }


  async update(id: number, authUser: AuthUser, updateUserDto: UpdateUserDto): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User update request started: userId=${ id }`);

    if (id !== userId) {
      this.logger.warn(`User update access denied: requestedId=${ id }, authUserId=${ userId }`);
      throw new ForbiddenException('Access denied');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.warn(`User update failed: user not found (userId=${ id })`);
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: { ...updateUserDto },
    });

    this.logger.log(`User updated successfully: userId=${ id }`);

    const { password, verificationCode, ...safeUser } = updatedUser;

    return {
      message: 'User updated successfully',
      data: safeUser,
    };
  }


  async remove(id: number, authUser: AuthUser): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(`User delete request started: userId=${ id }`);

    if (id !== userId) {
      this.logger.warn(`User delete access denied: requestedId=${ id }, authUserId=${ userId }`);
      throw new ForbiddenException('Access denied');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.warn(`User delete failed: user not found (userId=${ id })`);
      throw new NotFoundException('User not found');
    }

    await this.prismaService.user.delete({
      where: { id },
    });

    this.logger.log(`User deleted successfully: userId=${ id }`);

    return { message: 'User deleted successfully' };
  }

}
