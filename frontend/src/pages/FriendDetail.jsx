import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['avatar-green', 'avatar-orange', 'avatar-purple', 'avatar-blue'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % 4];

const FriendDetail = () => {
  const { id } = useParams();
  const [friend, setFriend] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const [friendRes, expensesRes] = await Promise.all([
          api.get('/friends'),
          api.get(`/expenses?friend_id=${id}`),
        ]);
        const f = friendRes.data.find((f) => f.id === id);
        setFriend(f);
        setExpenses(expensesRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFriendData();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  if (!friend) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 48 }}>🔍</p>
      <p style={{ color: 'var(--text-secondary)' }}>Friend not found</p>
      <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>← Back</button>
    </div>
  );

  const totalYouOwe = expenses.filter(e => e.paid_by !== user.id).reduce((acc, e) => acc + e.total_amount / 2, 0);
  const totalTheyOwe = expenses.filter(e => e.paid_by === user.id).reduce((acc, e) => acc + e.total_amount / 2, 0);
  const net = totalTheyOwe - totalYouOwe;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 800 }}>
        {/* Header card */}
        <div className="card fade-in" style={{ marginBottom: 20, overflow: 'visible' }}>
          <div style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(28,194,159,0.06) 0%, rgba(255,101,47,0.04) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className={`avatar avatar-xl ${avatarColor(friend.name)}`} style={{ boxShadow: '0 0 20px var(--primary-glow)' }}>
                {friend.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>{friend.name}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px' }}>{friend.email}</p>
                {net !== 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: net > 0 ? 'var(--primary-subtle)' : 'rgba(248,81,73,0.1)',
                    color: net > 0 ? 'var(--green)' : 'var(--red)',
                  }}>
                    {net > 0 ? `${friend.name} owes you ₹${net.toFixed(2)}` : `You owe ${friend.name} ₹${Math.abs(net).toFixed(2)}`}
                  </div>
                )}
                {net === 0 && expenses.length > 0 && (
                  <span className="badge badge-green">✓ All settled up</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <Link to={`/expenses/new?friend_id=${id}`} className="btn btn-secondary">+ Add expense</Link>
              <Link to={`/settle?friend_id=${id}`} className="btn btn-primary">Settle up ✓</Link>
            </div>
          </div>
        </div>

        {/* Expenses list */}
        <div className="card fade-in fade-in-delay-1">
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>💸</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Shared Expenses</span>
            {expenses.length > 0 && <span className="badge badge-green">{expenses.length}</span>}
          </div>
          <div>
            {expenses.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🧾</span>
                <p style={{ fontSize: 14, margin: 0, color: 'var(--text-secondary)' }}>No shared expenses yet</p>
                <Link to={`/expenses/new?friend_id=${id}`} className="btn btn-ghost" style={{ fontSize: 13 }}>
                  Add your first expense
                </Link>
              </div>
            ) : (
              expenses.map((e, i) => {
                const date = new Date(e.created_at);
                const youPaid = e.paid_by === user.id;
                return (
                  <div
                    key={e.id}
                    className="expense-row"
                    style={{ borderBottom: i < expenses.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div style={{ textAlign: 'center', minWidth: 36, flexShrink: 0 }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>
                        {date.toLocaleString('default', { month: 'short' })}
                      </p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.2 }}>
                        {date.getDate()}
                      </p>
                    </div>

                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: youPaid ? 'var(--primary-subtle)' : 'rgba(255,101,47,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {youPaid ? '↗️' : '↙️'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.description}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {youPaid ? 'You' : friend.name} paid{' '}
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                          ₹{parseFloat(e.total_amount).toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        {youPaid ? 'you lent' : 'you owe'}
                      </p>
                      <p style={{
                        fontSize: 15, fontWeight: 700, margin: '2px 0 0',
                        color: youPaid ? 'var(--green)' : 'var(--red)',
                      }}>
                        ₹{(parseFloat(e.total_amount) / 2).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendDetail;
