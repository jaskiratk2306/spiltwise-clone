import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const SPLIT_LABELS = { EQUAL: 'Equal', EXACT: 'Exact', PERCENTAGE: 'Percentage', SHARES: 'Shares' };
const SPLIT_ICONS = { EQUAL: '⚖️', EXACT: '💰', PERCENTAGE: '%', SHARES: '🔵' };

const AVATAR_COLORS = ['avatar-green', 'avatar-orange', 'avatar-purple', 'avatar-blue'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % 4];

const NewExpense = () => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group_id');
  const friendId = searchParams.get('friend_id');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [members, setMembers] = useState([]);
  const [splits, setSplits] = useState([]);
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
          const m = res.data.members.map((m) => m.user);
          setMembers(m);
          setPaidBy(user.id);
          setSplits(m.map((member) => ({ user_id: member.id, share_value: 0 })));
        } else if (friendId) {
          const res = await api.get('/friends');
          const friend = res.data.find((f) => f.id === friendId);
          const m = [user, friend].filter(Boolean);
          setMembers(m);
          setPaidBy(user.id);
          setSplits(m.map((member) => ({ user_id: member.id, share_value: 0 })));
        } else {
          const res = await api.get('/friends');
          const m = [user, ...res.data];
          setMembers(m);
          setPaidBy(user.id);
          setSplits(m.map((member) => ({ user_id: member.id, share_value: 0 })));
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
      await api.post('/expenses', {
        description,
        total_amount: parseFloat(amount),
        currency,
        paid_by: paidBy,
        split_type: splitType,
        group_id: groupId,
        friend_id: friendId,
        splits: splits.map((s) => ({
          user_id: s.user_id,
          share_value: splitType === 'EQUAL' ? 0 : parseFloat(s.share_value),
        })),
      });
      navigate(groupId ? `/groups/${groupId}` : friendId ? `/friends/${friendId}` : '/dashboard');
    } catch (error) {
      setError('Failed to add expense. Please check all fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateSplit = (userId, value) => {
    setSplits(splits.map((s) => (s.user_id === userId ? { ...s, share_value: value } : s)));
  };

  const currencySymbols = { INR: '₹', USD: '$', EUR: '€' };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 600 }}>
        <div className="fade-in">
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Add an expense</h1>
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Description
                </label>
                <input
                  type="text"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="e.g. Dinner at Pizza Hut"
                  autoFocus
                />
              </div>

              {/* Amount + Currency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', fontSize: 15, fontWeight: 600, pointerEvents: 'none',
                    }}>
                      {currencySymbols[currency] || currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      style={{ paddingLeft: 32 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Currency
                  </label>
                  <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Paid by */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Paid by
                </label>
                <select className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.id === user.id ? 'You' : m.name}</option>
                  ))}
                </select>
              </div>

              {/* Split type */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Split type
                </label>
                <div className="pill-tabs">
                  {['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSplitType(t)}
                      className={`pill-tab ${splitType === t ? 'active' : ''}`}
                    >
                      {SPLIT_ICONS[t]} {SPLIT_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom splits */}
              {splitType !== 'EQUAL' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    Custom splits
                    {splitType === 'PERCENTAGE' && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (must total 100%)</span>}
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {members.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className={`avatar avatar-sm ${avatarColor(m.name)}`}>
                            {m.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{m.id === user.id ? 'You' : m.name}</span>
                        </div>
                        <div style={{ position: 'relative', width: 120 }}>
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={splits.find((s) => s.user_id === m.id)?.share_value || ''}
                            onChange={(e) => updateSplit(m.id, e.target.value)}
                            placeholder={splitType === 'PERCENTAGE' ? '0%' : '0.00'}
                            style={{ padding: '8px 12px', textAlign: 'right', paddingRight: splitType === 'PERCENTAGE' ? 28 : 12 }}
                          />
                          {splitType === 'PERCENTAGE' && (
                            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '13px', fontSize: 15 }}
              >
                {submitting ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
                ) : 'Save Expense →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewExpense;
