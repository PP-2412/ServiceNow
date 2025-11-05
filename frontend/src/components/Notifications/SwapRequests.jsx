import React, { useState, useEffect } from 'react';
import { getMyRequests, respondToSwap } from '../../utils/api';

const SwapRequests = () => {
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getMyRequests();
      setRequests(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (requestId, accept) => {
    setResponding(requestId);
    try {
      await respondToSwap(requestId, accept);
      alert(accept ? 'Swap accepted!' : 'Swap rejected');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond to swap');
    } finally {
      setResponding(null);
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

  if (loading) {
    return <div>Loading swap requests...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Swap Requests</h1>
        <p>Manage your incoming and outgoing swap requests</p>
      </div>

      <div className="requests-container">
        {/* Incoming Requests */}
        <div className="requests-section">
          <h2>Incoming Requests ({requests.incoming.length})</h2>
          
          {requests.incoming.length === 0 ? (
            <div className="empty-state">
              <p>No incoming swap requests</p>
            </div>
          ) : (
            requests.incoming.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-info">
                  <div className="request-from">
                    <strong>{request.requester.name}</strong> wants to swap with
                    you
                  </div>
                </div>

                <div className="slots-comparison">
                  <div className="slot-info">
                    <h4>They Offer:</h4>
                    <p>
                      <strong>{request.requesterSlot.title}</strong>
                    </p>
                    <p>{formatDateTime(request.requesterSlot.startTime)}</p>
                    <p>{formatDateTime(request.requesterSlot.endTime)}</p>
                  </div>

                  <div className="swap-arrow">⇄</div>

                  <div className="slot-info">
                    <h4>For Your:</h4>
                    <p>
                      <strong>{request.requesteeSlot.title}</strong>
                    </p>
                    <p>{formatDateTime(request.requesteeSlot.startTime)}</p>
                    <p>{formatDateTime(request.requesteeSlot.endTime)}</p>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleResponse(request._id, true)}
                    disabled={responding === request._id}
                  >
                    {responding === request._id ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleResponse(request._id, false)}
                    disabled={responding === request._id}
                  >
                    {responding === request._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Outgoing Requests */}
        <div className="requests-section">
          <h2>Outgoing Requests ({requests.outgoing.length})</h2>
          
          {requests.outgoing.length === 0 ? (
            <div className="empty-state">
              <p>No outgoing swap requests</p>
            </div>
          ) : (
            requests.outgoing.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-info">
                  <div className="request-to">
                    Waiting for <strong>{request.requestee.name}</strong> to
                    respond
                  </div>
                </div>

                <div className="slots-comparison">
                  <div className="slot-info">
                    <h4>You Offered:</h4>
                    <p>
                      <strong>{request.requesterSlot.title}</strong>
                    </p>
                    <p>{formatDateTime(request.requesterSlot.startTime)}</p>
                    <p>{formatDateTime(request.requesterSlot.endTime)}</p>
                  </div>

                  <div className="swap-arrow">⇄</div>

                  <div className="slot-info">
                    <h4>For Their:</h4>
                    <p>
                      <strong>{request.requesteeSlot.title}</strong>
                    </p>
                    <p>{formatDateTime(request.requesteeSlot.startTime)}</p>
                    <p>{formatDateTime(request.requesteeSlot.endTime)}</p>
                  </div>
                </div>

                <div className="request-actions">
                  <button className="btn" disabled>
                    Pending Response...
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapRequests;
