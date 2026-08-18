import type { UserRole } from './auth';

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  login: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  login: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  login?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}
