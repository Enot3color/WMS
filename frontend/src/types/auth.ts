export type UserRole = 'WAREHOUSE' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  login: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  WAREHOUSE: 'Кладовщик',
  MANAGER: 'Менеджер',
  ADMIN: 'Руководитель',
};

export function formatUserName(user: Pick<User, 'firstName' | 'lastName'>) {
  return `${user.firstName} ${user.lastName}`.trim();
}
