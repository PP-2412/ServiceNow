import React, { useState, useEffect } from 'react';
import CreateEvent from './CreateEvent';
import { getEvents, updateEventStatus, deleteEvent } from '../../utils/api';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents();
      setEvents(response.data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await updateEventStatus(eventId, newStatus);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update event status');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        fetchEvents();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

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

  return (
    <div>
      <div className="page-header">
        <h1>My Calendar</h1>
        <p>Manage your events and mark them as swappable</p>
      </div>

      <div className="events-container">
        <CreateEvent onEventCreated={fetchEvents} />

        {loading ? (
          <div>Loading events...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <p>No events yet. Create your first event above!</p>
          </div>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                <div className="event-header">
                  <h3 className="event-title">{event.title}</h3>
                  <span className={`event-status status-${event.status}`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="event-time">
                  <div>
                    <strong>Start:</strong> {formatDateTime(event.startTime)}
                  </div>
                  <div>
                    <strong>End:</strong> {formatDateTime(event.endTime)}
                  </div>
                </div>

                <div className="event-actions">
                  {event.status === 'BUSY' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusChange(event._id, 'SWAPPABLE')}
                    >
                      Make Swappable
                    </button>
                  )}

                  {event.status === 'SWAPPABLE' && (
                    <button
                      className="btn btn-warning"
                      onClick={() => handleStatusChange(event._id, 'BUSY')}
                    >
                      Mark as Busy
                    </button>
                  )}

                  {event.status === 'SWAP_PENDING' && (
                    <button className="btn" disabled>
                      Swap Pending...
                    </button>
                  )}

                  {event.status !== 'SWAP_PENDING' && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(event._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
