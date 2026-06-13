import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold text-[#1cc29f]">Splitwise</Link>
        <div className="flex items-center space-x-6 text-sm">
          <Link to="/dashboard" className="hover:text-[#1cc29f]">Dashboard</Link>
          <Link to="/activity" className="hover:text-[#1cc29f]">Activity</Link>
          <div className="flex items-center space-x-2">
            <Link to="/profile" className="font-medium hover:text-[#1cc29f]">{user.name}</Link>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
