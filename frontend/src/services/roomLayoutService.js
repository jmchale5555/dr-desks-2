import { api } from './api';

export const roomLayoutService = {
  getRoomLayout: (roomId) => api.get(`/room-layouts/${roomId}/`),
  updateRoomLayout: (roomId, payload) => api.put(`/room-layouts/${roomId}/`, payload),
  autosaveRoomLayout: (roomId, payload) => api.post(`/room-layouts/${roomId}/autosave/`, payload),
  generateFromDesks: (roomId) => api.post(`/room-layouts/${roomId}/generate-from-desks/`, {}),
};
