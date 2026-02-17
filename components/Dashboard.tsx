
import React from 'react';
import { Link } from 'react-router-dom';
import { Meeting } from '../types';

interface DashboardProps {
  meetings: Meeting[];
}

const Dashboard: React.FC<DashboardProps> = ({ meetings }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border border-gray-800">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Live Efficiency</p>
          <h3 className="text-3xl font-bold text-white">94%</h3>
          <p className="text-[10px] text-green-400 mt-2">+4% from average</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-gray-800">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Engagement</p>
          <h3 className="text-3xl font-bold text-white">High</h3>
          <p className="text-[10px] text-indigo-400 mt-2">Active across 12 items</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-gray-800">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Knowledge Index</p>
          <h3 className="text-3xl font-bold text-white">1,240</h3>
          <p className="text-[10px] text-gray-500 mt-2">Stored decision points</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-gray-800">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Actions</p>
          <h3 className="text-3xl font-bold text-white">8</h3>
          <p className="text-[10px] text-orange-400 mt-2">2 due tomorrow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Recent Intelligence
            <span className="text-[10px] font-normal text-gray-500 px-2 py-1 bg-white/5 rounded">Last 30 days</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {meetings.map((meeting) => (
              <Link 
                to={`/meeting/${meeting.id}`} 
                key={meeting.id}
                className="glass p-5 rounded-3xl border border-gray-800 hover:border-indigo-500/50 hover:bg-white/[0.04] transition group flex items-center justify-between"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg group-hover:text-indigo-400 transition">{meeting.title}</h4>
                    <div className="flex gap-4 mt-1 items-center">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                        {meeting.date}
                      </span>
                      <div className="flex gap-1.5">
                        {meeting.tags?.map((tag) => (
                          <span key={tag} className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase font-bold tracking-tighter">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Sentiment</p>
                    <span className={`text-xs font-bold ${meeting.analytics.sentiment === 'Positive' ? 'text-green-400' : 'text-orange-400'}`}>
                      {meeting.analytics.sentiment}
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-gray-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Global Topic Flow</h3>
            <div className="flex flex-wrap gap-2">
              {['AI Strategy', 'Q4 Goals', 'Cloud Migration', 'Hiring', 'UI/UX', 'Gemini API', 'Market Fit'].map(topic => (
                <span key={topic} className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium hover:bg-indigo-500/20 cursor-pointer transition">
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div className="glass p-6 rounded-3xl border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Team Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span className="font-bold">Alice Smith</span>
                  <span className="text-indigo-400">88% participation</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span className="font-bold">Bob Johnson</span>
                  <span className="text-green-400">72% participation</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '72%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
