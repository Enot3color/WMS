import { UserRole } from '@generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  login: string;
  role: UserRole;
}

export function formatUserName(user: Pick<AuthUser, 'firstName' | 'lastName'>) {
  return `${user.firstName} ${user.lastName}`.trim();
}
