import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/api';

const AVATAR_COLORS = ['avatar-green', 'avatar-orange', 'avatar-purple', 'avatar-blue'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % 4];

const Profile = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [baseCurrency, setBaseCurrency] = useState(user?.base_currency || 'INR');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/users/me', { name, base_currency: baseCurrency });
      setMessage('success:Profile updated successfully!');
    } catch (error) {
      setMessage('error:Failed to update profile.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const isSuccess = message.startsWith('success:');
  const isError = message.startsWith('error:');
  const msgText = message.replace(/^(success|error):/, '');

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 520 }}>
        {/* User Avatar Header */}
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            className={`avatar avatar-xl ${avatarColor(user?.name)}`}
            style={{ margin: '0 auto 14px', boxShadow: '0 0 30px var(--primary-glow)', fontSize: 30 }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>{user?.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>{user?.email}</p>
        </div>

        <div className="card fade-in fade-in-delay-1" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Profile Settings</h2>

          {message && (
            <div style={{
              background: isSuccess ? 'rgba(28,194,159,0.12)' : 'rgba(248,81,73,0.12)',
              border: `1px solid ${isSuccess ? 'rgba(28,194,159,0.3)' : 'rgba(248,81,73,0.3)'}`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              fontSize: 13, color: isSuccess ? 'var(--green)' : 'var(--red)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {isSuccess ? '✓' : '⚠️'} {msgText}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Email Address
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>(read-only)</span>
              </label>
              <input
                type="text"
                className="input"
                value={user?.email}
                disabled
                style={{ opacity: 0.5 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Full Name
              </label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Base Currency
              </label>
              <select className="input" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: 15 }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Updating…</>
              ) : 'Save Changes'}
            </button>
          </form>

          <div style={{ height: 1, background: 'var(--border)', margin: '28px 0' }} />

          <button
            onClick={logout}
            className="btn btn-danger"
            style={{ width: '100%', padding: '11px', fontSize: 14 }}
          >
            🚪 Sign out of Splitwise
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
