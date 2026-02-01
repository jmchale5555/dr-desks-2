import { useState, useEffect, useCallback } from 'react';
import { myBookingsService } from '../services/myBookingsService';

/**
 * Custom hook for managing user's bookings with pagination
 * @param {number} initialPage - Initial page number (default: 1)
 * @param {number} pageSize - Number of items per page (default: 10)
 * @returns {Object} Bookings data, pagination info, and actions
 */
export const useMyBookings = (initialPage = 1, pageSize = 10) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await myBookingsService.getMyBookings(currentPage, pageSize);

      setBookings(response.results || response);
      setTotalCount(response.count || response.length);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevious]);

  const refresh = useCallback(() => {
    loadBookings();
  }, [loadBookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      await myBookingsService.cancelBooking(bookingId);
      
      // Remove booking from local state
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setTotalCount(prev => prev - 1);
      
      // If current page becomes empty and not first page, go to previous page
      if (bookings.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        // Otherwise, refresh the current page
        loadBookings();
      }
      
      return { success: true };
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      return { success: false, error: err.message };
    }
  }, [bookings.length, currentPage, loadBookings]);

  return {
    // Data
    bookings,
    loading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
    pageSize,
    
    // Actions
    goToPage,
    nextPage,
    previousPage,
    refresh,
    cancelBooking,
  };
};

/**
 * Simpler hook for getting all bookings without pagination
 */
export const useAllMyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await myBookingsService.getAllMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      await myBookingsService.cancelBooking(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      return { success: true };
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    bookings,
    loading,
    error,
    refresh: loadBookings,
    cancelBooking,
  };
};