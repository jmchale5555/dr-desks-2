import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';
import { deskService } from '../services/deskService';
import { bookingService } from '../services/bookingService';

export function useBookingData() {
  const [rooms, setRooms] = useState([]);
  const [desks, setDesks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDesk, setSelectedDesk] = useState('');
  const [loading, setLoading] = useState({
    rooms: false,
    desks: false,
    bookings: false,
  });
  const [error, setError] = useState(null);

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Load desks when room changes
  useEffect(() => {
    if (selectedRoom) {
      loadDesks(selectedRoom);
      loadBookings(selectedRoom);
    } else {
      setDesks([]);
      setBookings([]);
    }
    setSelectedDesk(''); // Reset desk selection
  }, [selectedRoom]);

  const loadRooms = async () => {
    setLoading(prev => ({ ...prev, rooms: true }));
    try {
      const data = await roomService.getAllRooms();
      setRooms(data);
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  };

  const loadDesks = async (roomId) => {
    setLoading(prev => ({ ...prev, desks: true }));
    try {
      const data = await deskService.getDesksByRoom(roomId);
      setDesks(data);
    } catch (err) {
      setError('Failed to load desks');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, desks: false }));
    }
  };

  const loadBookings = async (roomId) => {
    setLoading(prev => ({ ...prev, bookings: true }));
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 20);
      const end = endDate.toISOString().split('T')[0];
      
      const data = await bookingService.getBookings({
        room: roomId,
        start_date: today,
        end_date: end,
      });
      
      // FIX: Handle paginated response - extract the results array
      // If data has a 'results' property (paginated), use that, otherwise use data directly
      const bookingsArray = data.results ? data.results : data;
      setBookings(bookingsArray);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  return {
    rooms,
    desks,
    bookings,
    selectedRoom,
    setSelectedRoom,
    selectedDesk,
    setSelectedDesk,
    loading,
    error,
    refresh: () => {
      loadRooms();
      if (selectedRoom) {
        loadDesks(selectedRoom);
        loadBookings(selectedRoom);
      }
    },
  };
}