
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Meeting, ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';

interface MeetingDetailsProps {
  meetings: Meeting[];
}

const MeetingDetails: React.FC<MeetingDetailsProps> = ({ meetings }) => {
  const { id } = useParams<{ id: string }>();
  const meeting = meetings.find(m => m.id === id);
  
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'analytics' | 'followup' | 'kb'>('summary');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (searchTerm && searchMatches.length > 0) {
      const activeElement = document.getElementById(`transcript-match-${currentSearchIndex}`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSearchIndex, searchTerm]);

  const searchMatches = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const regex = new RegExp(searchTerm, 'gi');
    const matches: { lineIndex: number; start: number }[] = [];
    const lines = meeting?.transcript.split('\n').filter(l => l.trim() !== '') || [];
    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({ lineIndex, start: match.index });
      }
    });
    return matches;
  }, [searchTerm, meeting?.transcript]);

  useEffect(() => {
    setCurrentSearchIndex(0);
  }, [searchTerm]);

  if (!meeting) return <div className="p-8 text-center text-gray-400">Meeting archive not found.</div>;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    try {
      const response = await geminiService.askQuestion(meeting.transcript, userInput);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: response, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) { console.error(error); } finally { setIsTyping(false); }
  };

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentSearchIndex((prev) => (prev + 1) % searchMatches.length);
  };

  const goToPrevMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentSearchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
  };

  const renderTranscript = () => {
    const lineRegex = /^\[(\d{2}:\d{2})\]\s+([^:]+):\s*(.*)$/i;
    const lines = meeting.transcript.split('\n').filter(l => l.trim() !== '');
    let globalMatchCounter = 0;

    return (
      <div 
        ref={transcriptContainerRef}
        className="space-y-4 max-h-[650px] overflow-y-auto pr-6 animate-in fade-in duration-300 relative scroll-smooth scrollbar-thin scrollbar-thumb-gray-800"
      >
        {lines.map((line, i) => {
          const match = line.match(lineRegex);
          let timestamp = null;
          let speaker = null;
          let content = line;

          if (match) {
            timestamp = match[1];
            speaker = match[2];
            content = match[3];
          } else {
            // Check for non-timestamped speaker format
            const fallback = line.match(/^([^:]+):\s*(.*)$/i);
            if (fallback) {
              speaker = fallback[1];
              content = fallback[2];
            }
          }

          const parts = searchTerm.trim() ? content.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')) : [content];

          return (
            <div key={i} className="group flex gap-5 p-4 rounded-[32px] hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all">
              <div className="flex flex-col items-center shrink-0 w-12 pt-1">
                {timestamp && <span className="text-[10px] font-black text-gray-700 bg-black px-2 py-0.5 rounded-lg border border-gray-900 group-hover:text-indigo-400 group-hover:border-indigo-900 transition-colors uppercase tabular-nums">{timestamp}</span>}
              </div>
              <div className="flex-1">
                {speaker && <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                  {speaker}
                </p>}
                <p className={`text-sm leading-relaxed font-medium ${speaker ? 'text-gray-300' : 'text-gray-500 italic'}`}>
                  {parts.map((part, index) => {
                    if (searchTerm && part.toLowerCase() === searchTerm.toLowerCase()) {
                      const matchId = globalMatchCounter++;
                      const isActive = matchId === currentSearchIndex;
                      return (
                        <mark 
                          key={index} 
                          id={`transcript-match-${matchId}`} 
                          className={`transition-all duration-300 rounded px-1 ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.7)] font-black scale-110' : 'bg-indigo-500/30 text-indigo-100'}`}
                        >
                          {part}
                        </mark>
                      );
                    }
                    return part;
                  })}
                </p>
              </div>
            </div>
          );
        })}
        {lines.length === 0 && <div className="text-center py-32 text-gray-700 italic font-black uppercase tracking-widest">Awaiting AI Transcript Sync...</div>}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-6 duration-700">
      <div className="lg:col-span-8 space-y-8">
        <div className="glass p-10 rounded-[48px] border border-gray-800 shadow-2xl">
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{meeting.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{meeting.date} • {meeting.duration}</p>
                <div className="flex gap-2">
                  {meeting.tags?.map((tag) => (
                    <span key={tag} className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/10 uppercase tracking-widest">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-gray-800 mb-10 overflow-x-auto whitespace-nowrap scrollbar-none">
            {(['summary', 'transcript', 'analytics', 'followup', 'kb'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                  activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-gray-600 hover:text-gray-300'
                }`}
              >
                {tab === 'kb' ? 'Archive KB' : tab === 'followup' ? 'Sync Email' : tab}
              </button>
            ))}
          </div>

          <div className="min-h-[500px]">
            {activeTab === 'summary' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <section>
                  <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Executive Brief</h4>
                  <p className="text-gray-300 leading-relaxed text-base font-medium">{meeting.summary?.overview}</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section>
                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Critical Takeaways</h4>
                    <ul className="space-y-4">
                      {meeting.summary?.keyPoints.map((pt, i) => (
                        <li key={i} className="flex gap-4 text-sm text-gray-400 font-bold leading-relaxed">
                          <span className="text-indigo-500 font-black">→</span> {pt}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4 className="text-[11px] font-black text-green-400 uppercase tracking-[0.3em] mb-6">Strategic Decisions</h4>
                    <ul className="space-y-4">
                      {meeting.summary?.decisions.map((dec, i) => (
                        <li key={i} className="flex gap-4 text-sm text-gray-200 font-black leading-relaxed p-4 bg-green-500/5 rounded-[24px] border border-green-500/10 shadow-sm">
                          <span className="text-green-500">✓</span> {dec}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center gap-5 p-5 bg-gray-950/80 backdrop-blur-md rounded-[32px] border border-gray-800 shadow-2xl">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-700 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search archive intel..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.shiftKey ? goToPrevMatch() : goToNextMatch();
                        }
                      }}
                      className="w-full bg-gray-900 border border-gray-800 rounded-[20px] pl-14 pr-6 py-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold tracking-tight"
                    />
                  </div>
                  
                  {searchTerm && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] bg-gray-900 px-5 py-3 rounded-2xl border border-gray-800 shadow-lg">
                        {searchMatches.length > 0 ? (
                          <><span className="text-indigo-400 font-black">{currentSearchIndex + 1}</span> OF {searchMatches.length}</>
                        ) : 'ZERO MATCHES'}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={goToPrevMatch} disabled={searchMatches.length === 0} className="p-3 bg-gray-900 hover:bg-gray-800 text-gray-600 hover:text-white rounded-2xl border border-gray-800 transition shadow-md disabled:opacity-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg></button>
                        <button onClick={goToNextMatch} disabled={searchMatches.length === 0} className="p-3 bg-gray-900 hover:bg-gray-800 text-gray-600 hover:text-white rounded-2xl border border-gray-800 transition shadow-md disabled:opacity-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
                      </div>
                    </div>
                  )}
                </div>
                {renderTranscript()}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-8 rounded-[40px] bg-gray-950 border border-gray-800 shadow-xl">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3">Sync Sentiment</p>
                    <p className={`font-black text-2xl tracking-tighter ${meeting.analytics.sentiment === 'Positive' ? 'text-green-400' : 'text-indigo-400'}`}>{meeting.analytics.sentiment}</p>
                  </div>
                  <div className="p-8 rounded-[40px] bg-gray-950 border border-gray-800 shadow-xl">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3">Utility Score</p>
                    <p className="font-black text-2xl text-white tracking-tighter">{meeting.analytics.productivityScore}%</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="glass p-10 rounded-[40px] border border-gray-800 shadow-2xl">
                    <h4 className="text-[11px] font-black text-gray-600 mb-8 uppercase tracking-[0.3em]">Participation Map</h4>
                    <div className="space-y-6">
                      {Object.entries(meeting.analytics.talkTime).map(([name, pct]) => (
                        <div key={name}>
                          <div className="flex justify-between text-[11px] text-gray-400 mb-3 font-black uppercase tracking-[0.2em]">
                            <span>{name}</span>
                            <span className="text-indigo-400">{pct}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass p-10 rounded-[40px] border border-gray-800 shadow-2xl">
                    <h4 className="text-[11px] font-black text-gray-600 mb-8 uppercase tracking-[0.3em]">Emotional Index</h4>
                    <div className="space-y-6">
                      {meeting.analytics.emotions?.map(em => (
                        <div key={em.label}>
                          <div className="flex justify-between text-[11px] text-gray-400 mb-3 font-black uppercase tracking-[0.2em]">
                            <span>{em.label}</span>
                            <span className="text-purple-400">{em.score}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${em.score}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'followup' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em]">Neural Post-Meeting Email</h4>
                  <button onClick={() => navigator.clipboard.writeText(meeting.followUpEmail || '')} className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-5 py-2.5 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg">Copy Knowledge</button>
                </div>
                <div className="bg-gray-950/90 p-10 rounded-[40px] border border-gray-800 font-mono text-xs text-gray-400 leading-relaxed whitespace-pre-wrap shadow-2xl min-h-[350px]">
                  {meeting.followUpEmail || "Intelligence Synthesis in Progress..."}
                </div>
              </div>
            )}

            {activeTab === 'kb' && (
              <div className="animate-in fade-in duration-500">
                <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-8">Long-term Strategic Knowledge</h4>
                <div className="bg-gray-950/80 p-12 rounded-[56px] border border-gray-800 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap shadow-2xl min-h-[450px]">
                  {meeting.kbEntry || "Knowledge Extraction Engaged..."}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-12 rounded-[64px] border border-gray-800 shadow-2xl">
          <h3 className="text-base font-black text-white mb-10 uppercase tracking-[0.4em] flex items-center gap-4">
            <span className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]"></span>
            Extracted Directives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meeting.actionItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-[32px] bg-white/[0.03] border border-gray-800 hover:border-indigo-500/40 transition-all group shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-tight mb-1.5">{item.task}</p>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{item.assignee}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Deadline</p>
                   <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/10 shadow-sm">{item.deadline}</span>
                </div>
              </div>
            ))}
            {meeting.actionItems.length === 0 && <p className="text-xs text-gray-700 font-black uppercase tracking-widest px-6">Zero Action Items Extracted</p>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 h-[calc(100vh-140px)] sticky top-8">
        <div className="glass flex flex-col h-full rounded-[64px] border border-gray-800 shadow-2xl overflow-hidden">
          <div className="p-10 border-b border-gray-800 bg-gray-950/90 backdrop-blur-xl flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-[0.3em] text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)] animate-pulse"></div>
                Archive Intel
              </h3>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-2">Context: {meeting.title}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-none">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30">
                <div className="w-20 h-20 rounded-[40px] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-2xl">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em] leading-relaxed">Query the meeting archives for <br/> specific details, owners, or logic.</p>
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-400`}>
                <div className={`max-w-[95%] p-6 rounded-[40px] text-xs font-bold leading-relaxed shadow-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-[0_10px_20px_rgba(79,70,229,0.4)]' : 'bg-gray-900 text-gray-300 rounded-bl-none border border-gray-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-4 text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] animate-pulse ml-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                AI Logic Active
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-10 bg-gray-950 border-t border-gray-800 shadow-2xl">
            <div className="relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask intelligence archive..."
                className="w-full bg-gray-900 border border-gray-800 rounded-[32px] px-8 py-5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-inner transition-all placeholder:text-gray-800 font-bold"
              />
              <button 
                type="submit" 
                disabled={!userInput.trim() || isTyping}
                className="absolute right-2.5 top-2.5 bottom-2.5 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all disabled:opacity-20 shadow-xl"
              >
                Query
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;
