import { api } from './api';

export const bookingService = {

  getMyBookings: () => api.get('/bookings/my-bookings/'),
  
  getBookings: (params) => api.get('/bookings/', params),

  checkAvailability: (roomId, date, period) =>
    api.get('/bookings/availability/', { room: roomId, date, period }),

  async createBooking(data) {
    const booking = data[0];
  
    try {
      const created = await api.post('/bookings/', booking);
      return { created: [created], errors: [] };
  
    } catch (err) {
      return {
        created: [],
        errors: [
          {
            booking,
            error: err.data || err.message  // <- use backend data if available
          }
        ]
      };
    }
  },

  async bulkCreate(bookingsData) {
    try {
      const result = await api.post('/bookings/bulk-create/', { bookings: bookingsData });

      // Ensure consistent structure coming back:
      return {
        created: result.created || [],
        errors: result.errors || []
      };

    } catch (err) {
      return {
        created: [],
        errors: [
          {
            booking: null,
            error: err.message || 'Unknown error'
          }
        ]
      };
    }
  },

  cancelBooking: (id) => api.delete(`/bookings/${id}/`),
};
