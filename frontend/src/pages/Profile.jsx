import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [baseCurrency, setBaseCurrency] = useState(user?.base_currency || 'INR');
  const [message, setMessage] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/me', { name, base_currency: baseCurrency });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto p-6 mt-10">
        <div className="card p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-700 text-center">Your Profile</h1>
            {message && <div className={`p-3 rounded mb-4 text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
            
            <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input type="text" className="input bg-gray-50 cursor-not-allowed" value={user?.email} disabled />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Base Currency</label>
                    <select className="input" value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary w-full mt-4">Update Profile</button>
            </form>

            <div className="mt-10 pt-6 border-t border-gray-100">
                <button 
                  onClick={logout}
                  className="w-full text-center text-red-500 font-bold hover:underline"
                >
                    Log out of Splitwise
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
