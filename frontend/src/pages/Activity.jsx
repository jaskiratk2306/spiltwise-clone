import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/activity');
        setActivities(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 700 }}>
        <div className="fade-in" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Activity</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14 }}>
            Your recent transactions and settlements
          </p>
        </div>

        <div className="card fade-in fade-in-delay-1">
          {activities.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>No activity yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Expenses and settlements will appear here
              </p>
            </div>
          ) : (
            activities.map((a, i) => {
              const isExpense = a.type === 'EXPENSE';
              const date = new Date(a.created_at);
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: isExpense ? 'var(--primary-subtle)' : 'rgba(88,166,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {isExpense ? '💳' : '✅'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.payer}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{isExpense ? ' added ' : ' settled '}</span>
                      <span style={{ fontWeight: 600, color: isExpense ? 'var(--primary)' : 'var(--text-primary)' }}>
                        "{a.description}"
                      </span>
                      {a.group && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          {' '}in <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{a.group}</span>
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={isExpense ? 'badge badge-green' : 'badge badge-yellow'} style={{ marginBottom: 4, display: 'block' }}>
                      {isExpense ? 'expense' : 'settled'}
                    </span>
                    <p style={{
                      fontSize: 16, fontWeight: 700, margin: 0,
                      color: isExpense ? 'var(--text-primary)' : 'var(--green)',
                    }}>
                      ₹{parseFloat(a.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Activity;
