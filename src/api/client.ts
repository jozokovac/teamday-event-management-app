import type { Event, Registration } from '../types.ts';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'An unexpected error occurred');
  return data as T;
}

export const api = {
  events: {
    listPublished: () => apiFetch<Event[]>('/events'),
    listAll: () => apiFetch<Event[]>('/events/all'),
    get: (id: string) => apiFetch<Event>(`/events/${id}`),
    create: (data: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'registration_count'>) =>
      apiFetch<Event>('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'registration_count'>) =>
      apiFetch<Event>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/events/${id}`, { method: 'DELETE' }),
  },
  registrations: {
    register: (eventId: string, data: { name: string; email: string }) =>
      apiFetch<Registration>(`/events/${eventId}/registrations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (eventId: string) =>
      apiFetch<Registration[]>(`/events/${eventId}/registrations`),
  },
};
