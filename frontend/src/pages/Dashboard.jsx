import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, friendsRes, balancesRes] = await Promise.all([
          api.get('/groups'),
          api.get('/friends'),
          api.get('/balances')
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

  const totalBalance = balances.reduce((acc, b) => {
    // This is simplified; real logic needs currency conversion
    return acc + b.net_amount;
  }, 0);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Summary */}
        <div className="md:col-span-3 flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h2 className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Total Balance</h2>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalBalance >= 0 ? '+' : ''}${totalBalance.toFixed(2)}
            </p>
          </div>
          <div className="space-x-4">
            <Link to="/expenses/new" className="btn btn-secondary">Add an expense</Link>
            <Link to="/settle" className="btn btn-primary">Settle up</Link>
          </div>
        </div>

        {/* Groups */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-700">Groups</h3>
            <Link to="/groups/new" className="text-xs text-[#1cc29f] font-bold hover:underline">+ add</Link>
          </div>
          <div className="space-y-4">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No groups yet</p>
            ) : (
              groups.map(g => (
                <Link key={g.id} to={`/groups/${g.id}`} className="block p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition-all">
                  <p className="font-medium text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500">{g._count.members} members</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Friends */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-700">Friends</h3>
            <Link to="/friends/new" className="text-xs text-[#1cc29f] font-bold hover:underline">+ add</Link>
          </div>
          <div className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No friends yet</p>
            ) : (
              friends.map(f => (
                <Link key={f.id} to={`/friends/${f.id}`} className="block p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition-all">
                  <p className="font-medium text-sm">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.email}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Mini */}
        <div className="card p-6">
           <h3 className="font-bold text-lg text-gray-700 mb-4">Recent Activity</h3>
           <p className="text-sm text-gray-500">Go to <Link to="/activity" className="text-[#1cc29f]">Activity</Link> to see more.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
