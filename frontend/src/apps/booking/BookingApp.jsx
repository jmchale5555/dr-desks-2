import { useState } from 'react';
import { Calendar, MapPin, Clock, Trash2 } from 'lucide-react';
import { useBookingData } from '../../hooks/useBookingData';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

// Period Button Component
function PeriodButton({ period, label, isSelected, isBooked, bookedBy, isMine, onClick, onCancel, disabled }) {
  const getButtonStyle = () => {
    if (isBooked) {
      if (isMine) {
        return 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400';
      }
      return 'bg-gray-200 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 cursor-not-allowed';
    }
    if (isSelected) {
      return 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400 ring-2 ring-green-300 dark:ring-green-700';
    }
    return 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || (isBooked && !isMine)}
      className={`p-3 rounded-lg transition-all ${getButtonStyle()} ${
        disabled || (isBooked && !isMine) ? 'cursor-not-allowed' : 'cursor-pointer'
      }${period === "full" ? " col-span-2" : ""}`}
    >
      <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
        {label}
      </div>
      {isBooked ? (
        <div className="space-y-1">
          <div className="text-xs text-gray-700 dark:text-gray-300">
            {isMine ? '✓ Your booking' : `Booked by ${bookedBy}`}
          </div>
          {isMine && onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {isSelected ? 'Selected' : 'Available'}
        </div>
      )}
    </button>
  );
}

// Cancel Booking Modal
function CancelBookingModal({ booking, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cancel Booking?
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to cancel your booking for{' '}
          <strong>{new Date(booking.date).toLocaleDateString()}</strong>{' '}
          ({booking.period === 'am' ? 'Morning' : booking.period === 'pm' ? 'Afternoon' : 'Full Day'})?
        </p>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Booking App Component
export default function BookingApp() {
  const { user } = useAuth();
  const {
    rooms,
    desks,
    bookings,
    selectedRoom,
    setSelectedRoom,
    selectedDesk,
    setSelectedDesk,
    loading,
    error: dataError,
    refresh,
  } = useBookingData();

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const getBookingForSlot = (dateStr, period) => {
    return bookings.find(b => 
      b.desk.toString() === selectedDesk && 
      b.date === dateStr && 
      b.period === period  // Just match the exact period!
    );
  };

  const isSlotSelected = (dateStr, period) => {
    return selectedSlots.some(slot => slot.date === dateStr && slot.period === period);
  };

  const toggleSlot = (dateStr, period) => {
    const booking = getBookingForSlot(dateStr, period);
    if (booking) return;

    const slotIndex = selectedSlots.findIndex(
      slot => slot.date === dateStr && slot.period === period
    );

    if (slotIndex > -1) {
      setSelectedSlots(selectedSlots.filter((_, i) => i !== slotIndex));
    } else {
      setSelectedSlots([...selectedSlots, { date: dateStr, period }]);
    }
  };

  const handleBookSlots = async () => {
    if (!selectedRoom || !selectedDesk || selectedSlots.length === 0) {
      setActionError('Please select a room, desk, and at least one time slot');
      return;
    }
  
    setActionLoading(true);
    setActionError(null);
    setSuccessMessage(null);
  
    try {
      const bookingsData = selectedSlots.map(slot => ({
        desk: parseInt(selectedDesk),
        date: slot.date,
        period: slot.period,
      }));
    
      const response = bookingsData.length === 1
        ? await bookingService.createBooking(bookingsData)
        : await bookingService.bulkCreate(bookingsData);
    
        if (response.errors.length > 0) {
          const errorMessages = response.errors
            .map(e => {
              // Single message string formatter
              if (typeof e.error === 'object' && e.error.existing_booking) {
                const ex = e.error.existing_booking;
                const periodName = ex.period.toUpperCase();
                const deskName = `Desk ${ex.desk}`;
                const roomName = ex.room_name || `Room ${ex.room}`;
        
                return `${ex.date} (${periodName}): You already have a booking for this time slot on ${deskName} in ${roomName}`;
              }
        
              // Fallback
              const msg = typeof e.error === 'string'
                ? e.error
                : e.error?.detail || e.error?.error || JSON.stringify(e.error);
        
              return msg;
            })
            .join('\n');
        
          setActionError(`Some bookings failed:\n${errorMessages}`);
        }
    
      if (response.created.length > 0) {
        setSuccessMessage(`Successfully booked ${response.created.length} slot(s)!`);
      }
    
      setSelectedSlots([]);
      await refresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    
    } catch (err) {
      setActionError(err.message || 'Failed to create booking(s)');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await bookingService.cancelBooking(cancelBooking.id);
      setSuccessMessage('Booking cancelled successfully!');
      setCancelBooking(null);
      await refresh();
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setActionError(err.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book a Desk</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Select your preferred desk and time slots
          </p>
        </div>
        
        {selectedSlots.length > 0 && (
          <button
            onClick={handleBookSlots}
            disabled={actionLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium flex items-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Booking...
              </>
            ) : (
              <>Book {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''}</>
            )}
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {(actionError || dataError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg whitespace-pre-line">
          {actionError || dataError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Select Location
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room
                </label>
                {loading.rooms ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading rooms...</p>
                ) : (
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a room...</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name} ({room.number_of_desks} desks)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedRoom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Desk
                  </label>
                  {loading.desks ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading desks...</p>
                  ) : (
                    <select
                      value={selectedDesk}
                      onChange={(e) => setSelectedDesk(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose a desk...</option>
                      {desks.map(desk => (
                        <option key={desk.id} value={desk.id}>
                          Desk {desk.desk_number}
                          {desk.location_description && ` - ${desk.location_description}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {selectedRoom && selectedDesk && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Selected:
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  {rooms.find(r => r.id.toString() === selectedRoom)?.name}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Desk {desks.find(d => d.id.toString() === selectedDesk)?.desk_number}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
              Legend
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">Your Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 rounded"></div>
                <span className="text-gray-700 dark:text-gray-300">Unavailable</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next 20 Days
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                Click to select time slots
              </div>
            </div>

            {!selectedDesk ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Please select a room and desk to view availability
              </div>
            ) : loading.bookings ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Loading availability...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {dates.map((date, index) => {
                  const { day, date: dateNum, month } = formatDate(date);
                  const dateStr = date.toISOString().split('T')[0];
                  const weekend = isWeekend(date);
                  const today = isToday(date);

                  const amBooking = getBookingForSlot(dateStr, 'am');
                  const pmBooking = getBookingForSlot(dateStr, 'pm');
                  const fullBooking = getBookingForSlot(dateStr, 'full');

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border-2 overflow-hidden transition-all ${
                        today 
                          ? 'border-blue-500 dark:border-blue-400 shadow-md' 
                          : 'border-gray-200 dark:border-gray-700'
                      } ${weekend ? 'opacity-60' : ''}`}
                    >
                      <div className={`px-3 py-2 text-center ${
                        today 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <div className="text-xs font-medium">{day}</div>
                        <div className="text-lg font-bold">{dateNum}</div>
                        <div className="text-xs">{month}</div>
                      </div>

                      <div className="p-2 grid grid-cols-2 gap-2">
                        {/* Show AM/PM only if Full Day is not selected or booked */}
                        {!isSlotSelected(dateStr, 'full') && !fullBooking && (
                          <>
                            <PeriodButton
                              period="am"
                              label="AM"
                              isSelected={isSlotSelected(dateStr, 'am')}
                              isBooked={!!amBooking}
                              bookedBy={amBooking?.user_username}
                              isMine={amBooking?.is_mine}
                              onClick={() => !weekend && toggleSlot(dateStr, 'am')}
                              onCancel={amBooking?.is_mine ? () => setCancelBooking(amBooking) : null}
                              disabled={weekend}
                            />

                            <PeriodButton
                              period="pm"
                              label="PM"
                              isSelected={isSlotSelected(dateStr, 'pm')}
                              isBooked={!!pmBooking}
                              bookedBy={pmBooking?.user_username}
                              isMine={pmBooking?.is_mine}
                              onClick={() => !weekend && toggleSlot(dateStr, 'pm')}
                              onCancel={pmBooking?.is_mine ? () => setCancelBooking(pmBooking) : null}
                              disabled={weekend}
                            />
                          </>
                        )}

                        {/* Show Full Day only if AM or PM is not selected or booked */}
                        {!isSlotSelected(dateStr, 'am') && !isSlotSelected(dateStr, 'pm') && !amBooking && !pmBooking && (
                          <PeriodButton
                            period="full"
                            label="Full Day"
                            isSelected={isSlotSelected(dateStr, 'full')}
                            isBooked={!!fullBooking}
                            bookedBy={fullBooking?.user_username}
                            isMine={fullBooking?.is_mine}
                            onClick={() => !weekend && toggleSlot(dateStr, 'full')}
                            onCancel={fullBooking?.is_mine ? () => setCancelBooking(fullBooking) : null}
                            disabled={weekend}
                          />
                        )}

                        {/* Show message if Full Day is booked - why would I show this shit I can't remember ?  commenting */}
                        {/* {fullBooking && (
                          <div className="text-center text-yellow-500 py-2">
                            <PeriodButton
                              period="full"
                              label="Full twerpy Day"
                              isSelected={false}
                              isBooked={true}
                              bookedBy={fullBooking.user_username}
                              isMine={fullBooking.is_mine}
                              onClick={() => {}}
                              onCancel={fullBooking.is_mine ? () => setCancelBooking(fullBooking) : null}
                              disabled={weekend}
                            />
                          </div>
                        )} */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {cancelBooking && (
        <CancelBookingModal
          booking={cancelBooking}
          onConfirm={handleCancelBooking}
          onClose={() => setCancelBooking(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}