import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';

export function useRooms(autoLoad = true) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomService.getAllRooms();
      setRooms(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const newRoom = await roomService.createRoom(formData);
      setRooms([...rooms, newRoom]);
      return newRoom;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const updateRoom = async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedRoom = await roomService.updateRoom(id, formData);
      setRooms(rooms.map(r => r.id === id ? updatedRoom : r));
      return updatedRoom;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await roomService.deleteRoom(id);
      setRooms(rooms.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadRooms();
    }
  }, [autoLoad]);

  return {
    rooms,
    loading,
    error,
    loadRooms,
    createRoom,
    updateRoom,
    deleteRoom,
  };
}
