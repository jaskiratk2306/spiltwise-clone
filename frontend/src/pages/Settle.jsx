import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['avatar-green', 'avatar-orange', 'avatar-purple', 'avatar-blue'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % 4];

const Settle = () => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group_id');
  const friendId = searchParams.get('friend_id');

  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContext = async () => {
      try {
        if (groupId) {
          const res = await api.get(`/groups/${groupId}`);
          setMembers(res.data.members.map((m) => m.user).filter((m) => m.id !== user.id));
        } else if (friendId) {
          const res = await api.get('/friends');
          const friend = res.data.find((f) => f.id === friendId);
          if (friend) {
            setMembers([friend]);
            setPaidTo(String(friend.id));
          }
        } else {
          const res = await api.get('/balances');
          const uniquePeople = [];
          const seen = new Set();
          res.data.forEach((b) => {
            if (b.user_id_from === user.id && b.to_user && !seen.has(b.to_user.id)) {
              uniquePeople.push(b.to_user);
              seen.add(b.to_user.id);
            }
            if (b.user_id_to === user.id && b.from_user && !seen.has(b.from_user.id)) {
              uniquePeople.push(b.from_user);
              seen.add(b.from_user.id);
            }
          });
          setMembers(uniquePeople);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [groupId, friendId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/settlements', {
        paid_by: user.id,
        paid_to: paidTo,
        amount: parseFloat(amount),
        currency: 'INR',
        group_id: groupId,
      });
      navigate(groupId ? `/groups/${groupId}` : '/dashboard');
    } catch (error) {
      setError('Failed to record settlement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const recipient = members.find((m) => m.id === paidTo);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 480 }}>
        <div className="fade-in">
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.5px' }}>Settle up</h1>

          <div className="card" style={{ padding: '28px' }}>
            {/* Transfer illustration */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  className="avatar avatar-xl avatar-green bounce-in pulse-ring"
                  style={{ margin: '0 auto 8px' }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>You</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 24 }}>→</div>
                {amount && (
                  <div style={{
                    padding: '3px 10px', borderRadius: 20,
                    background: 'var(--primary-subtle)', color: 'var(--primary)',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    ₹{parseFloat(amount || 0).toFixed(2)}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  className={`avatar avatar-xl ${recipient ? avatarColor(recipient.name) : 'avatar-orange'}`}
                  style={{ margin: '0 auto 8px', opacity: recipient ? 1 : 0.4 }}
                >
                  {recipient ? recipient.name?.charAt(0).toUpperCase() : '?'}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>
                  {recipient?.name || 'Select person'}
                </p>
              </div>
            </div>

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
                  Paying to
                </label>
                <select
                  className="input"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  required
                >
                  <option value="">Select a person…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: 16, fontWeight: 600, pointerEvents: 'none',
                  }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    style={{ paddingLeft: 34, fontSize: 18, fontWeight: 600 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '13px', fontSize: 15 }}
              >
                {submitting ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Recording…</>
                ) : '✓ Confirm Payment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settle;
