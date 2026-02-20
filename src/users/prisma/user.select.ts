export const userListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isActive: true,
} as const;

export const userFullSelect = {
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
