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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-700">Recent Activity</h1>
        <div className="card divide-y divide-gray-100">
            {activities.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No activity yet.</div>
            ) : (
                activities.map(a => (
                    <div key={a.id} className="p-4 flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded shadow-inner flex items-center justify-center text-white font-bold ${a.type === 'EXPENSE' ? 'bg-[#1cc29f]' : 'bg-[#5bc5e7]'}`}>
                            {a.type === 'EXPENSE' ? 'E' : 'S'}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm">
                                <span className="font-bold">{a.payer}</span>
                                {a.type === 'EXPENSE' ? ' added ' : ' settled '}
                                <span className="font-bold">"{a.description}"</span>
                                {a.group && <span> in <span className="font-bold">{a.group}</span></span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-sm text-gray-700">${a.amount.toFixed(2)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default Activity;
