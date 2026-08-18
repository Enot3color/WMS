import { api } from './client';

export const referencesApi = {
  categories: {
    list: () => api.get('/references/categories').then((r) => r.data),
    create: (data: { name: string }) => api.post('/references/categories', data).then((r) => r.data),
    update: (id: string, data: { name?: string }) =>
      api.patch(`/references/categories/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/references/categories/${id}`).then((r) => r.data),
  },
  units: {
    list: () => api.get('/references/units').then((r) => r.data),
    create: (data: { name: string; shortName: string }) =>
      api.post('/references/units', data).then((r) => r.data),
    update: (id: string, data: { name?: string; shortName?: string }) =>
      api.patch(`/references/units/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/references/units/${id}`).then((r) => r.data),
  },
  statuses: {
    list: (group?: string) =>
      api.get('/references/statuses', { params: group ? { group } : undefined }).then((r) => r.data),
    create: (data: { group: string; code: string; label: string; sortOrder?: number }) =>
      api.post('/references/statuses', data).then((r) => r.data),
    update: (
      id: string,
      data: { label?: string; sortOrder?: number; isActive?: boolean },
    ) => api.patch(`/references/statuses/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/references/statuses/${id}`).then((r) => r.data),
  },
};
