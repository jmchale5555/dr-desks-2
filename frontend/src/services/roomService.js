import { api } from './api';

export const roomService = {
  // GET /api/rooms/
  getAllRooms: () => api.get('/rooms/'),
  
  // GET /api/rooms/{id}/
  getRoom: (id) => api.get(`/rooms/${id}/`),
  
  // POST /api/rooms/ (with image)
  createRoom: (formData) => {
    // formData should be FormData object for file upload
    return api.postFormData('/rooms/', formData);
  },
  
  // PUT /api/rooms/{id}/ (with image)
  updateRoom: (id, formData) => {
    return api.putFormData(`/rooms/${id}/`, formData);
  },
  
  // DELETE /api/rooms/{id}/remove-image/
  removeImage: (id) => api.delete(`/rooms/${id}/remove-image/`),
  
  // DELETE /api/rooms/{id}/
  deleteRoom: (id) => api.delete(`/rooms/${id}/`),
  
  // GET /api/rooms/?search=query
  searchRooms: (query) => api.get('/rooms/', { search: query }),
};
