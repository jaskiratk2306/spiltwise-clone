import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['avatar-green', 'avatar-orange', 'avatar-purple', 'avatar-blue'];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % 4];

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, friendsRes, balancesRes] = await Promise.all([
          api.get('/groups'),
          api.get('/friends'),
          api.get('/balances'),
        ]);
        setGroups(groupsRes.data);
        setFriends(friendsRes.data);
        setBalances(balancesRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalBalance = balances.reduce((acc, b) => acc + (b.net_amount || 0), 0);
  const totalOwed = balances.filter(b => b.user_id_from === user?.id).reduce((acc, b) => acc + b.net_amount, 0);
  const totalOwing = balances.filter(b => b.user_id_to === user?.id).reduce((acc, b) => acc + b.net_amount, 0);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px', borderWidth: 3 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">

        {/* Hero balance card */}
        <div className="slide-up" style={{ marginBottom: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(28,194,159,0.12) 0%, rgba(108,99,255,0.08) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                  Net Balance
                </p>
                <p style={{
                  fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: '-1px',
                  color: totalBalance >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {totalBalance >= 0 ? '+' : ''}₹{Math.abs(totalBalance).toFixed(2)}
                </p>
              </div>
              <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>You owe</p>
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--red)' }}>₹{totalOwed.toFixed(2)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Owed to you</p>
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--green)' }}>₹{totalOwing.toFixed(2)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/expenses/new" className="btn btn-secondary">+ Add expense</Link>
              <Link to="/settle" className="btn btn-primary">Settle up ✓</Link>
            </div>
          </div>
        </div>

        {/* 3-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

          {/* Groups */}
          <div className="card slide-up slide-up-1">
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--primary-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>👥</div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Groups</span>
                {groups.length > 0 && (
                  <span className="badge badge-green">{groups.length}</span>
                )}
              </div>
              <Link
                to="/groups/new"
                style={{
                  fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none',
                  padding: '4px 10px', borderRadius: 6, background: 'var(--primary-subtle)',
                  transition: 'all 0.15s',
                }}
              >
                + New
              </Link>
            </div>
            <div>
              {groups.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <span className="empty-icon">🏕️</span>
                  <p style={{ fontSize: 14, margin: 0 }}>No groups yet</p>
                  <Link to="/groups/new" className="btn btn-ghost" style={{ fontSize: 13, marginTop: 4 }}>Create your first group</Link>
                </div>
              ) : (
                groups.map((g, i) => (
                  <Link
                    key={g.id}
                    to={`/groups/${g.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px', textDecoration: 'none',
                      borderBottom: i < groups.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div
                      className={`avatar avatar-sm ${avatarColor(g.name)}`}
                      style={{ borderRadius: 7, flexShrink: 0 }}
                    >
                      {g.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {g._count?.members || 0} members
                      </p>
                    </div>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Friends */}
          <div className="card slide-up slide-up-2">
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--secondary-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>🤝</div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Friends</span>
                {friends.length > 0 && (
                  <span className="badge badge-red">{friends.length}</span>
                )}
              </div>
              <Link
                to="/friends/new"
                style={{
                  fontSize: 13, color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none',
                  padding: '4px 10px', borderRadius: 6, background: 'var(--secondary-subtle)',
                  transition: 'all 0.15s',
                }}
              >
                + Add
              </Link>
            </div>
            <div>
              {friends.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <span className="empty-icon">👋</span>
                  <p style={{ fontSize: 14, margin: 0 }}>No friends added yet</p>
                  <Link to="/friends/new" className="btn btn-ghost" style={{ fontSize: 13, marginTop: 4 }}>Add a friend</Link>
                </div>
              ) : (
                friends.map((f, i) => (
                  <Link
                    key={f.id}
                    to={`/friends/${f.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px', textDecoration: 'none',
                      borderBottom: i < friends.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className={`avatar avatar-sm ${avatarColor(f.name)}`}>
                      {f.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.email}
                      </p>
                    </div>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Activity peek */}
          <div className="card slide-up slide-up-3">
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(108,99,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>⚡</div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Quick Stats</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active groups</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>{groups.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Friends connected</span>
                  <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: 18 }}>{friends.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Open balances</span>
                  <span style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: 18 }}>{balances.length}</span>
                </div>
                <Link
                  to="/activity"
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 4 }}
                >
                  View full activity →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
