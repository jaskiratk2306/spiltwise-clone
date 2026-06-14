import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['avatar-green', 'avatar-orange', 'avatar-purple', 'avatar-blue'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % 4];

const GroupDetail = () => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get(`/groups/${id}`);
        setGroup(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );
  if (!group) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 48 }}>🔍</p>
      <p style={{ color: 'var(--text-secondary)' }}>Group not found</p>
      <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Group info */}
            <div className="card fade-in" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  className={`avatar avatar-lg ${avatarColor(group.name)}`}
                  style={{ borderRadius: 12 }}
                >
                  {group.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{group.name}</h2>
                  {group.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{group.description}</p>
                  )}
                </div>
              </div>
              <Link
                to={`/expenses/new?group_id=${id}`}
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: 8 }}
              >
                + Add expense
              </Link>
              <Link
                to={`/settle?group_id=${id}`}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Settle up ✓
              </Link>
            </div>

            {/* Members */}
            <div className="card fade-in fade-in-delay-1">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Members · {group.members?.length || 0}
                </p>
              </div>
              <div style={{ padding: '8px 0' }}>
                {group.members?.map((m) => (
                  <div
                    key={m.user.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 18px',
                    }}
                  >
                    <div className={`avatar avatar-sm ${avatarColor(m.user.name)}`}>
                      {m.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: m.user.id === user.id ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {m.user.id === user.id ? 'You' : m.user.name}
                      </p>
                    </div>
                    {m.user.is_ghost && (
                      <span className="badge badge-yellow">invited</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Expenses */}
            <div className="card fade-in">
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>💸</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Expenses</span>
                  {group.expenses?.length > 0 && (
                    <span className="badge badge-green">{group.expenses.length}</span>
                  )}
                </div>
              </div>
              <div>
                {group.expenses?.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🧾</span>
                    <p style={{ fontSize: 14, margin: 0, color: 'var(--text-secondary)' }}>No expenses yet</p>
                    <Link to={`/expenses/new?group_id=${id}`} className="btn btn-ghost" style={{ fontSize: 13 }}>
                      Add the first expense
                    </Link>
                  </div>
                ) : (
                  group.expenses.map((e, i) => {
                    const date = new Date(e.created_at);
                    return (
                      <div
                        key={e.id}
                        className="expense-row"
                        style={{ borderBottom: i < group.expenses.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        {/* Date */}
                        <div style={{ textAlign: 'center', minWidth: 36, flexShrink: 0 }}>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>
                            {date.toLocaleString('default', { month: 'short' })}
                          </p>
                          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.2 }}>
                            {date.getDate()}
                          </p>
                        </div>

                        {/* Icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: 'var(--primary-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, flexShrink: 0,
                        }}>
                          💳
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.description}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                            {e.paid_by === user.id ? 'You' : e.payer?.name || 'Someone'} paid{' '}
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {e.currency || '₹'}{parseFloat(e.total_amount).toFixed(2)}
                            </span>
                          </p>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                            {e.paid_by === user.id ? 'you lent' : 'you owe'}
                          </p>
                          <p style={{
                            fontSize: 15, fontWeight: 700, margin: '2px 0 0',
                            color: e.paid_by === user.id ? 'var(--green)' : 'var(--red)',
                          }}>
                            {e.currency || '₹'}{parseFloat(e.total_amount / (group.members?.length || 1)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Balances */}
            <div className="card fade-in fade-in-delay-1">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>⚖️</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Simplified Balances</span>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {group.balances?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ fontSize: 24, margin: '0 0 8px' }}>🎉</p>
                    <p style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, margin: 0 }}>Everything is settled up!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.balances.map((b) => {
                      const fromName = b.user_id_from === user.id ? 'You' : (b.from_user?.name || 'Member');
                      const toName = b.user_id_to === user.id ? 'you' : (b.to_user?.name || 'Member');
                      const isYouFrom = b.user_id_from === user.id;
                      return (
                        <div
                          key={b.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                            <span style={{ fontWeight: 600, color: isYouFrom ? 'var(--red)' : 'var(--text-primary)' }}>{fromName}</span>
                            <span style={{ color: 'var(--text-muted)' }}>owes</span>
                            <span style={{ fontWeight: 600, color: !isYouFrom ? 'var(--green)' : 'var(--text-primary)' }}>{toName}</span>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 15, color: isYouFrom ? 'var(--red)' : 'var(--green)' }}>
                            ₹{parseFloat(b.net_amount).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
