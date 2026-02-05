import { http, HttpResponse } from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const handlers = [
  http.get(`${API_BASE_URL}/rooms/`, () => HttpResponse.json([])),
  http.get(`${API_BASE_URL}/desks/`, () => HttpResponse.json([])),
  http.get(`${API_BASE_URL}/bookings/`, () => HttpResponse.json({ results: [] })),
  http.get(`${API_BASE_URL}/auth/me/`, () => HttpResponse.json({ id: 1, username: 'test-user' })),
];
