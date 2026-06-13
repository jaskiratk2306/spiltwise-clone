import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Settle = () => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group_id');
  const friendId = searchParams.get('friend_id');
  
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContext = async () => {
      try {
        if (groupId) {
          const res = await api.get(`/groups/${groupId}`);
          setMembers(res.data.members.map(m => m.user).filter(m => m.id !== user.id));
        } else if (friendId) {
          const res = await api.get(`/friends`);
          const friend = res.data.find(f => f.id === friendId);
          if (friend) {
            setMembers([friend]);
            setPaidTo(String(friend.id));
          }
        } else {
            // Fetch all people we owe from balances
            const res = await api.get('/balances');
            const uniquePeople = [];
            const seen = new Set();
            res.data.forEach(b => {
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
    try {
      await api.post('/settlements', {
        paid_by: user.id,
        paid_to: paidTo,
        amount: parseFloat(amount),
        currency: 'INR',
        group_id: groupId
      });
      navigate(groupId ? `/groups/${groupId}` : `/dashboard`);
    } catch (error) {
      alert('Failed to record settlement');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto p-6 mt-10">
        <div className="card p-8 text-center">
            <h1 className="text-2xl font-bold mb-6 text-gray-700">Settle up</h1>
            
            <div className="flex items-center justify-center space-x-4 mb-8">
                <div className="w-16 h-16 bg-[#1cc29f] text-white rounded-full flex items-center justify-center text-2xl font-bold">You</div>
                <div className="text-gray-400">➔</div>
                <div className="w-16 h-16 bg-[#ff652f] text-white rounded-full flex items-center justify-center text-2xl font-bold">
                    {paidTo ? members.find(m => m.id === paidTo)?.name.charAt(0) || '?' : '?'}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1 text-left">Recipient</label>
                    <select className="input" value={paidTo} onChange={e => setPaidTo(e.target.value)} required>
                        <option value="">Select a person</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div>
                   <label className="block text-sm font-medium mb-1 text-left">Amount</label>
                   <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                       <input type="number" step="0.01" className="input pl-8" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
                   </div>
                </div>

                <button type="submit" className="btn btn-primary w-full py-3">Confirm Payment</button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Settle;
