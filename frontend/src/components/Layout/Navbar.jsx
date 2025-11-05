import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          SlotSwapper
        </Link>

        {isAuthenticated ? (
          <ul className="navbar-nav">
            <li>
              <Link to="/calendar" className="nav-link">
                My Calendar
              </Link>
            </li>
            <li>
              <Link to="/marketplace" className="nav-link">
                Marketplace
              </Link>
            </li>
            <li>
              <Link to="/requests" className="nav-link">
                Swap Requests
              </Link>
            </li>
            <li>
              <span className="user-name">{user?.name}</span>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          </ul>
        ) : (
          <ul className="navbar-nav">
            <li>
              <Link to="/login" className="nav-link">
                Login
              </Link>
            </li>
            <li>
              <Link to="/signup" className="nav-link">
                Sign Up
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
