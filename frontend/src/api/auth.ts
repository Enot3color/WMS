import { api } from '../api/client';
import type { AuthResponse, LoginRequest, User } from '../types/auth';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function getMe(): Promise<{ user: User }> {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data;
}
