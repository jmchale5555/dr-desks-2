import { useState } from 'react';
import { useApi } from './useApi';
import { bookingService } from '../services/deskService';

export function useBookings() {
  const { data, loading, error, refetch } = useApi(
    () => bookingService.getMyBookings(),
    true
  );

  return {
    bookings: data || [],
    loading,
    error,
    refetch,
  };
}

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bookingService.createBooking(bookingData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createBooking, loading, error };
}