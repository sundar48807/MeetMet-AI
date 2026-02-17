
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
    )},
    { label: 'Archives', path: '/archives', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
    )},
    { label: 'Live Co-Pilot', path: '/live', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" /></svg>
    )},
    { label: 'Intelligence', path: '/', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
    )}
  ];

  return (
    <aside className="w-64 border-r border-gray-800 flex flex-col p-6 bg-[#0a0a0c] relative z-20">
      <div className="flex items-center gap-3 px-2 py-6 mb-10">
        <div className="w-10 h-10 rounded-2xl accent-gradient flex items-center justify-center shadow-[0_5px_20px_rgba(99,102,241,0.4)]">
          <span className="text-white font-black italic text-lg">M</span>
        </div>
        <span className="text-2xl font-black tracking-tighter text-white">MeetMet</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${
              location.pathname === item.path 
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg' 
              : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto p-5 glass rounded-[32px] border border-gray-800 shadow-2xl group cursor-pointer hover:border-indigo-500/40 transition-all">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 group-hover:text-indigo-400">System Status</h4>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <p className="text-[10px] text-gray-300 font-bold">GEMINI 2.5 ACTIVE</p>
        </div>
        <p className="text-[10px] text-gray-600 font-medium">12.4 GB Archive Stored</p>
      </div>
    </aside>
  );
};

export default Sidebar;
