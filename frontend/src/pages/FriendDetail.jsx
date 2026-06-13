import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const FriendDetail = () => {
  const { id } = useParams();
  const [friend, setFriend] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const [friendRes, expensesRes] = await Promise.all([
          api.get(`/friends`), // This is a bit lazy, should have GET /friends/:id
          api.get(`/expenses?friend_id=${id}`)
        ]);
        const f = friendRes.data.find(f => f.id === id);
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

  if (loading) return <div>Loading...</div>;
  if (!friend) return <div>Friend not found</div>;

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#ff652f] text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {friend.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{friend.name}</h2>
                    <p className="text-gray-500 text-sm">{friend.email}</p>
                </div>
            </div>
            <div className="space-x-3">
                <Link to={`/expenses/new?friend_id=${id}`} className="btn btn-secondary">Add expense</Link>
                <Link to={`/settle?friend_id=${id}`} className="btn btn-primary">Settle up</Link>
            </div>
        </div>

        <div className="card">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-bold text-gray-700">Expenses 1-on-1</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No shared expenses yet.</div>
                ) : (
                    expenses.map(e => (
                        <div key={e.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                            <div className="flex-1 flex items-center space-x-4">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 uppercase">{new Date(e.created_at).toLocaleString('default', { month: 'short' })}</p>
                                    <p className="text-lg font-bold text-gray-500">{new Date(e.created_at).getDate()}</p>
                                </div>
                                <div>
                                    <p className="font-bold">{e.description}</p>
                                    <p className="text-xs text-gray-500">{e.paid_by === user.id ? 'You' : friend.name} paid ${e.total_amount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${e.paid_by === user.id ? 'text-[#1cc29f]' : 'text-[#ff652f]'}`}>
                                    {e.paid_by === user.id ? 'you lent' : 'you owe'} ${(e.total_amount/2).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default FriendDetail;
