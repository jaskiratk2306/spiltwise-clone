import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const GroupDetail = () => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  if (loading) return <div>Loading...</div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-xl mb-4">{group.name}</h2>
            <p className="text-sm text-gray-500 mb-6">{group.description}</p>
            <Link to={`/expenses/new?group_id=${id}`} className="btn btn-secondary w-full block text-center mb-3">Add expense</Link>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">Members</h3>
            <div className="space-y-3">
                {group.members.map(m => (
                    <div key={m.user.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#1cc29f] text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {m.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{m.user.id === user.id ? 'You' : m.user.name}</p>
                            {m.user.is_ghost && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">invited</span>}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="md:col-span-3 space-y-6">
          <div className="card">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700">Expenses</h3>
                <Link to="/settle" className="text-sm text-[#1cc29f] font-bold">Settle up</Link>
            </div>
            <div className="divide-y divide-gray-100">
                {group.expenses.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No expenses recorded yet.</div>
                ) : (
                    group.expenses.map(e => (
                        <div key={e.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                            <div className="flex-1 flex items-center space-x-4">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 uppercase">{new Date(e.created_at).toLocaleString('default', { month: 'short' })}</p>
                                    <p className="text-lg font-bold text-gray-500">{new Date(e.created_at).getDate()}</p>
                                </div>
                                <div>
                                    <p className="font-bold">{e.description}</p>
                                    <p className="text-xs text-gray-500">{e.paid_by === user.id ? 'You' : e.payer?.name} paid ${e.total_amount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase">You lent</p>
                                <p className="font-bold text-[#1cc29f]">$10.00</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>

          <div className="card p-6">
                <h3 className="font-bold text-gray-700 mb-4">Simplified Balances</h3>
                <div className="space-y-3">
                    {group.balances.length === 0 ? (
                        <p className="text-sm text-gray-500">Everything is settled up!</p>
                    ) : (
                        group.balances.map(b => (
                            <div key={b.id} className="text-sm flex items-center space-x-2">
                                <span className="font-medium">{b.user_id_from === user.id ? 'You' : 'Member'}</span>
                                <span className="text-gray-500">owes</span>
                                <span className="font-medium">{b.user_id_to === user.id ? 'You' : 'Member'}</span>
                                <span className="font-bold text-[#ff652f]">${b.net_amount.toFixed(2)}</span>
                            </div>
                        ))
                    )}
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
