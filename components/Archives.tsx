
import React from 'react';
import { Link } from 'react-router-dom';
import { Meeting } from '../types';

interface ArchivesProps {
  meetings: Meeting[];
}

const Archives: React.FC<ArchivesProps> = ({ meetings }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">VIDEO ARCHIVES</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Access all your meeting intelligence</p>
        </div>
        <div className="flex gap-4">
          <input type="text" placeholder="Search archive..." className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 shadow-lg" />
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-xs font-bold hover:text-white transition">Filter</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="glass rounded-[40px] border border-gray-800 overflow-hidden group hover:border-indigo-500/50 transition-all shadow-xl">
            <div className="aspect-video bg-gray-900 relative">
               <div className="absolute inset-0 flex items-center justify-center">
                 <svg className="w-12 h-12 text-gray-800 group-hover:text-indigo-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
               </div>
               <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 rounded-lg text-[9px] font-bold text-white uppercase tracking-tighter">
                 {meeting.duration}
               </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight">{meeting.title}</h4>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-6">{meeting.date}</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {meeting.tags?.map(t => (
                  <span key={t} className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-md border border-indigo-500/10">#{t}</span>
                ))}
              </div>

              <Link to={`/meeting/${meeting.id}`} className="block w-full text-center py-4 bg-gray-900 border border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-md">
                View Intelligence
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Archives;
