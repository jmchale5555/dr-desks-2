import { useState } from 'react';
import RoomManagement from './pages/RoomManagement';

export default function AdminApp() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage rooms, desks, and system settings
        </p>
      </div>

      <RoomManagement />
    </div>
  );
}

