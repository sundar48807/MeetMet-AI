
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import MeetingDetails from './components/MeetingDetails';
import UploadMeeting from './components/UploadMeeting';
import LiveCoPilot from './components/LiveCoPilot';
import MeetingRoom from './components/MeetingRoom';
import Archives from './components/Archives';
import Sidebar from './components/Sidebar';
import VoiceAssistant from './components/VoiceAssistant';
import { Meeting } from './types';

const MOCK_MEETINGS: Meeting[] = [
  {
    id: '1',
    meetingId: 'product-sync-2023',
    title: 'Product Strategy Sync',
    date: 'Oct 12, 2023',
    duration: '45 mins',
    participants: ['Alice', 'Bob', 'Charlie'],
    category: 'Product',
    tags: ['Roadmap', 'Q4', 'AI'],
    transcript: 'Alice: Welcome everyone. Today we discuss the Q4 roadmap. Bob: I think we should prioritize the AI integration. Charlie: Agreed, we need a solid API provider.',
    summary: {
      overview: 'Strategic discussion on Q4 product goals focusing on AI integration.',
      keyPoints: ['AI integration prioritized', 'Budget allocation for Q4'],
      decisions: ['Selected Gemini as the AI provider']
    },
    actionItems: [
      { task: 'Set up Google Cloud project', assignee: 'Bob', deadline: 'Friday' }
    ],
    analytics: {
      talkTime: { Alice: 40, Bob: 35, Charlie: 25 },
      sentiment: 'Positive',
      productivityScore: 92,
      topics: ['AI', 'Roadmap'],
      emotions: [{ label: 'Optimism', score: 85 }, { label: 'Curiosity', score: 60 }]
    }
  }
];

const MainHeader = () => {
  const navigate = useNavigate();
  const startInstantMeeting = () => {
    const roomId = Math.random().toString(36).substring(2, 12).toUpperCase();
    navigate(`/room/${roomId}`);
  };

  return (
    <header className="flex justify-between items-center mb-10">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter">MEETMET <span className="text-indigo-500">INTEL</span></h1>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">Enterprise Meeting OS</p>
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={startInstantMeeting}
          className="accent-gradient px-8 py-3 rounded-2xl font-bold text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:translate-y-[-2px] transition-all active:translate-y-[1px]"
        >
          Start New Meeting
        </button>
        <Link to="/upload" className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all">
          Upload Recording
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center shadow-lg group cursor-pointer hover:border-indigo-500/50 transition-all">
          <span className="text-sm font-black text-indigo-400 group-hover:scale-110 transition-transform">JD</span>
        </div>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const addMeeting = (newMeeting: Meeting) => setMeetings([newMeeting, ...meetings]);

  return (
    <HashRouter>
      <div className="flex h-screen bg-[#0a0a0c] overflow-hidden text-gray-200">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative p-8">
          <Routes>
            <Route path="/room/:roomId" element={<MeetingRoom />} />
            <Route path="*" element={
              <div className="max-w-7xl mx-auto">
                <MainHeader />
                <Routes>
                  <Route path="/" element={<Dashboard meetings={meetings} />} />
                  <Route path="/archives" element={<Archives meetings={meetings} />} />
                  <Route path="/meeting/:id" element={<MeetingDetails meetings={meetings} />} />
                  <Route path="/upload" element={<UploadMeeting onUpload={addMeeting} />} />
                  <Route path="/live" element={<LiveCoPilot />} />
                </Routes>
              </div>
            } />
          </Routes>
        </main>
        <VoiceAssistant />
      </div>
    </HashRouter>
  );
};

export default App;
