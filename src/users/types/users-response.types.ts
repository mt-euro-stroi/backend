import { Prisma } from 'src/generated/prisma/client';
import { userFullSelect, userListSelect } from '../prisma/user.select';

export type UserResponse = Prisma.UserGetPayload<{
  select: typeof userFullSelect;
}>;

export type UserListItem = Prisma.UserGetPayload<{
  select: typeof userListSelect;
}>;
