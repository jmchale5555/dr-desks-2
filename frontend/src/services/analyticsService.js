import { api } from './api';

export const analyticsService = {
  /**
   * Get comprehensive analytics data
   * GET /api/analytics/
   */
  getAnalytics: async () => {
    return api.get('/analytics/');
  },

  /**
   * Get analytics for a specific date range
   * GET /api/analytics/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  getAnalyticsByDateRange: async (startDate, endDate) => {
    return api.get('/analytics/', { 
      start_date: startDate, 
      end_date: endDate 
    });
  },

  /**
   * Get bookings grouped by day of week
   * GET /api/analytics/by-day/
   */
  getBookingsByDay: async () => {
    return api.get('/analytics/by-day/');
  },

  /**
   * Get bookings grouped by user
   * GET /api/analytics/by-user/
   */
  getBookingsByUser: async (limit = 10) => {
    return api.get('/analytics/by-user/', { limit });
  },

  /**
   * Get bookings grouped by room
   * GET /api/analytics/by-room/
   */
  getBookingsByRoom: async () => {
    return api.get('/analytics/by-room/');
  },

  /**
   * Get bookings grouped by period (AM/PM/Full)
   * GET /api/analytics/by-period/
   */
  getBookingsByPeriod: async () => {
    return api.get('/analytics/by-period/');
  },

  /**
   * Get booking trend over time
   * GET /api/analytics/trend/?days=7
   */
  getBookingTrend: async (days = 7) => {
    return api.get('/analytics/trend/', { days });
  },
};