import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';

const AddFriend = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/friends', { email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add friend. Make sure the email is correct.');
    } finally {
      setLoading(false);
    }
  };

  const initials = name ? name.charAt(0).toUpperCase() : null;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 460 }}>
        <div className="fade-in">
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>Add a friend</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px' }}>
            Enter their email to invite them and track expenses together
          </p>

          {/* Preview avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div
              className="avatar avatar-xl"
              style={{
                background: initials
                  ? 'linear-gradient(135deg, var(--secondary) 0%, #e05520 100%)'
                  : 'var(--bg-elevated)',
                border: '2px dashed var(--border)',
                boxShadow: initials ? '0 0 24px var(--secondary-glow)' : 'none',
                fontSize: initials ? 30 : 28,
                transition: 'all 0.3s ease',
              }}
            >
              {initials || '👤'}
            </div>
          </div>

          <div className="card" style={{ padding: '28px' }}>
            {error && (
              <div style={{
                background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.3)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                fontSize: 13, color: 'var(--red)',
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Friend's Name
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>(for display)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required
                />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  If they haven't joined yet, they'll be added as a guest and can merge later.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: 15 }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Adding…</>
                ) : '🤝 Add Friend →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
