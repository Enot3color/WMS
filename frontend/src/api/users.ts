import { api } from './client';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserRecord,
} from '../types/user';

export async function fetchUsers(): Promise<UserRecord[]> {
  const response = await api.get<UserRecord[]>('/users');
  return response.data;
}

export async function createUser(data: CreateUserRequest): Promise<UserRecord> {
  const response = await api.post<UserRecord>('/users', data);
  return response.data;
}

export async function updateUser(
  id: string,
  data: UpdateUserRequest,
): Promise<UserRecord> {
  const response = await api.patch<UserRecord>(`/users/${id}`, data);
  return response.data;
}
