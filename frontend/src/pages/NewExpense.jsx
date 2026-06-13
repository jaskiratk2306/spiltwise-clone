import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

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

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContext = async () => {
      try {
        if (groupId) {
          const res = await api.get(`/groups/${groupId}`);
          const m = res.data.members.map(m => m.user);
          setMembers(m);
          setPaidBy(user.id);
          setSplits(m.map(member => ({ user_id: member.id, share_value: 0 })));
        } else if (friendId) {
          const res = await api.get(`/users/search?email=`); // This is a bit lazy, should get friend info
          // Mocking friend context for now
          const m = [user, { id: friendId, name: 'Friend' }];
          setMembers(m);
          setPaidBy(user.id);
          setSplits(m.map(member => ({ user_id: member.id, share_value: 0 })));
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
      await api.post('/expenses', {
        description,
        total_amount: parseFloat(amount),
        currency,
        paid_by: paidBy,
        split_type: splitType,
        group_id: groupId,
        friend_id: friendId,
        splits: splits.map(s => ({
            user_id: s.user_id,
            share_value: splitType === 'EQUAL' ? 0 : parseFloat(s.share_value)
        }))
      });
      navigate(groupId ? `/groups/${groupId}` : `/friends/${friendId}`);
    } catch (error) {
      alert('Failed to add expense');
    }
  };

  const updateSplit = (userId, value) => {
    setSplits(splits.map(s => s.user_id === userId ? { ...s, share_value: value } : s));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <div className="card p-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-700">Add an expense</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" className="input" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Enter a description" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input type="number" step="0.01" className="input" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Paid by</label>
              <select className="input" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                {members.map(m => <option key={m.id} value={m.id}>{m.id === user.id ? 'You' : m.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Split Type</label>
              <div className="flex bg-gray-100 p-1 rounded">
                {['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSplitType(t)}
                    className={`flex-1 py-1 text-xs font-bold rounded ${splitType === t ? 'bg-white shadow-sm text-[#1cc29f]' : 'text-gray-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {splitType !== 'EQUAL' && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Splits</p>
                {members.map(m => (
                  <div key={m.id} className="flex justify-between items-center">
                    <span className="text-sm">{m.id === user.id ? 'You' : m.name}</span>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        className="input w-32 py-1"
                        value={splits.find(s => s.user_id === m.id)?.share_value || ''}
                        onChange={e => updateSplit(m.id, e.target.value)}
                        placeholder={splitType === 'PERCENTAGE' ? '%' : 'Amount'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full py-3">Save Expense</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewExpense;
