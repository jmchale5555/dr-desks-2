import { api } from './api';

export const deskService = {
  // GET /api/desks/?room=1
  getDesksByRoom: (roomId) => api.get('/desks/', { room: roomId }),
  
  // GET /api/desks/
  getAllDesks: () => api.get('/desks/'),
};