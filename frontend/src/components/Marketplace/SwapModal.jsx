import React, { useState, useEffect } from 'react';
import { getEvents, createSwapRequest } from '../../utils/api';

const SwapModal = ({ theirSlot, onClose, onSuccess }) => {
  const [mySlots, setMySlots] = useState([]);
  const [selectedMySlot, setSelectedMySlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMySwappableSlots();
  }, []);

  const fetchMySwappableSlots = async () => {
    try {
      const response = await getEvents();
      const swappableSlots = response.data.filter(
        (event) => event.status === 'SWAPPABLE'
      );
      setMySlots(swappableSlots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMySlot) {
      alert('Please select one of your slots to offer');
      return;
    }

    setSubmitting(true);
    try {
      await createSwapRequest(selectedMySlot, theirSlot._id);
      alert('Swap request sent successfully!');
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create swap request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Swap</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div>
          <h3>Their Slot:</h3>
          <div className="slot-card">
            <h4>{theirSlot.title}</h4>
            <p>Owner: {theirSlot.userId.name}</p>
            <p>
              {formatDateTime(theirSlot.startTime)} -{' '}
              {formatDateTime(theirSlot.endTime)}
            </p>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Select Your Slot to Offer:</h3>
          
          {loading ? (
            <div>Loading your swappable slots...</div>
          ) : mySlots.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any swappable slots.</p>
              <p>Go to your calendar and mark a slot as swappable first.</p>
            </div>
          ) : (
            <div className="my-slots-list">
              {mySlots.map((slot) => (
                <div
                  key={slot._id}
                  className={`my-slot-card ${
                    selectedMySlot === slot._id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedMySlot(slot._id)}
                >
                  <h4>{slot.title}</h4>
                  <p>
                    {formatDateTime(slot.startTime)} -{' '}
                    {formatDateTime(slot.endTime)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {mySlots.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !selectedMySlot}
              style={{ marginTop: '1rem' }}
            >
              {submitting ? 'Sending Request...' : 'Send Swap Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapModal;
