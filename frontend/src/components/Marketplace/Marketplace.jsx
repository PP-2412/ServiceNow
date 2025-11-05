import React, { useState, useEffect } from 'react';
import SwapModal from './SwapModal';
import { getSwappableSlots } from '../../utils/api';

const Marketplace = () => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await getSwappableSlots();
      setSlots(response.data);
    } catch (err) {
      setError('Failed to load swappable slots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSwapSuccess = () => {
    setSelectedSlot(null);
    fetchSlots();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Marketplace</h1>
        <p>Browse and request swaps with other users' available slots</p>
      </div>

      <div className="events-container">
        {loading ? (
          <div>Loading swappable slots...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <p>No swappable slots available at the moment.</p>
            <p>Check back later!</p>
          </div>
        ) : (
          <div className="marketplace-grid">
            {slots.map((slot) => (
              <div key={slot._id} className="slot-card">
                <div className="slot-owner">
                  Offered by: {slot.userId.name}
                </div>
                <h3 className="event-title">{slot.title}</h3>
                <div className="event-time">
                  <div>
                    <strong>Start:</strong> {formatDateTime(slot.startTime)}
                  </div>
                  <div>
                    <strong>End:</strong> {formatDateTime(slot.endTime)}
                  </div>
                </div>
                <button
                  className="btn btn-info"
                  onClick={() => setSelectedSlot(slot)}
                >
                  Request Swap
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && (
        <SwapModal
          theirSlot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleSwapSuccess}
        />
      )}
    </div>
  );
};

export default Marketplace;
