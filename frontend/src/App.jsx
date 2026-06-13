import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import FriendDetail from './pages/FriendDetail';
import NewExpense from './pages/NewExpense';
import Activity from './pages/Activity';
import Settle from './pages/Settle';
import Profile from './pages/Profile';
import CreateGroup from './pages/CreateGroup';
import AddFriend from './pages/AddFriend';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/groups/new" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
            <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
            <Route path="/friends/new" element={<ProtectedRoute><AddFriend /></ProtectedRoute>} />
            <Route path="/friends/:id" element={<ProtectedRoute><FriendDetail /></ProtectedRoute>} />
            <Route path="/expenses/new" element={<ProtectedRoute><NewExpense /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
            <Route path="/settle" element={<ProtectedRoute><Settle /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
