import { api } from './api';

export const myBookingsService = {
  /**
   * Get current user's bookings with pagination
   * GET /api/bookings/my-bookings/?page=1&page_size=10
   */
  getMyBookings: async (page = 1, pageSize = 10) => {
    return api.get('/bookings/my-bookings/', { 
      page, 
      page_size: pageSize 
    });
  },

  /**
   * Get all upcoming bookings for current user (no pagination)
   * GET /api/bookings/my-bookings/
   */
  getAllMyBookings: async () => {
    return api.get('/bookings/my-bookings/');
  },

  /**
   * Cancel a booking
   * DELETE /api/bookings/{id}/
   */
  cancelBooking: async (bookingId) => {
    return api.delete(`/bookings/${bookingId}/`);
  },

  /**
   * Get booking details
   * GET /api/bookings/{id}/
   */
  getBooking: async (bookingId) => {
    return api.get(`/bookings/${bookingId}/`);
  },
};