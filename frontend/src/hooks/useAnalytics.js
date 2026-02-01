import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

/**
 * Custom hook for fetching and managing analytics data
 * @param {Object} options - Configuration options
 * @param {string} options.startDate - Start date for analytics (YYYY-MM-DD)
 * @param {string} options.endDate - End date for analytics (YYYY-MM-DD)
 * @param {boolean} options.autoLoad - Whether to load data automatically on mount
 * @returns {Object} Analytics data and loading state
 */
export const useAnalytics = ({ startDate, endDate, autoLoad = true } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let analytics;
      if (startDate && endDate) {
        analytics = await analyticsService.getAnalyticsByDateRange(startDate, endDate);
      } else {
        analytics = await analyticsService.getAnalytics();
      }

      setData(analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (autoLoad) {
      loadAnalytics();
    }
  }, [autoLoad, loadAnalytics]);

  const refresh = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};

/**
 * Custom hook for fetching bookings by day
 */
export const useBookingsByDay = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await analyticsService.getBookingsByDay();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
};

/**
 * Custom hook for fetching bookings by user
 */
export const useBookingsByUser = (limit = 10) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await analyticsService.getBookingsByUser(limit);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [limit]);

  return { data, loading, error };
};

/**
 * Custom hook for fetching bookings by room
 */
export const useBookingsByRoom = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await analyticsService.getBookingsByRoom();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
};

/**
 * Custom hook for fetching booking trend
 */
export const useBookingTrend = (days = 7) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getBookingTrend(days);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
};