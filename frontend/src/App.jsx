import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import EventList from './components/Calendar/EventList';
import Marketplace from './components/Marketplace/Marketplace';
import SwapRequests from './components/Notifications/SwapRequests';
import Navbar from './components/Layout/Navbar';
import PrivateRoute from './components/Layout/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/calendar"
                element={
                  <PrivateRoute>
                    <EventList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <PrivateRoute>
                    <Marketplace />
                  </PrivateRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <PrivateRoute>
                    <SwapRequests />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/calendar" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
