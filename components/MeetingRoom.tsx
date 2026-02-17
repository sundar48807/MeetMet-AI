
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { geminiService } from '../services/geminiService';
import { LiveEvent, ChatMessage, PeerConnection } from '../types';

const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [userName, setUserName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'copilot' | 'participants'>('copilot');
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Media access denied:", err);
      }
    };
    initLocalMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleJoin = () => {
    if (!userName.trim()) return alert("Please enter your name to join.");
    setIsJoined(true);
    // Simulation of others joining
    setTimeout(() => {
      simulateRemotePeer("Sarah Miller");
    }, 1500);
  };

  const simulateRemotePeer = (name: string) => {
    const dummyStream = new MediaStream(); 
    setPeers(prev => [...prev, {
      peerId: Math.random().toString(),
      name,
      stream: dummyStream,
      connection: {} as RTCPeerConnection,
      isAudioMuted: false,
      isVideoOff: false
    }]);
  };

  // Fix: Added missing toggleRecording function to handle recording state toggle
  const toggleRecording = () => {
    setIsRecording(prev => !prev);
  };

  const copyMeetingLink = () => {
    // FIX: Explicitly include /#/ for HashRouter to prevent 404 on shared links
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}#/room/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Link Copied! Send this to participants: " + link);
    });
  };

  const getGridLayout = () => {
    const total = peers.length + 1;
    if (total === 1) return 'grid-cols-1';
    if (total <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-in fade-in duration-700">
        <div className="glass p-10 rounded-[48px] border border-gray-800 w-full max-w-lg text-center shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Meeting Setup</h2>
          <p className="text-gray-500 text-sm mb-8 uppercase font-bold tracking-widest">Room: {roomId}</p>
          
          <div className="aspect-video bg-gray-950 rounded-[32px] overflow-hidden mb-8 border border-gray-800 relative group">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            {isVideoOff && <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-gray-400 font-bold uppercase tracking-widest">Video Disabled</div>}
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <div className="flex gap-3">
               <button onClick={() => {
                const videoTrack = localStreamRef.current?.getVideoTracks()[0];
                if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!isVideoOff);
              }} className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                {isVideoOff ? 'Cam Off' : 'Cam On'}
              </button>
              <button onClick={() => {
                const audioTrack = localStreamRef.current?.getAudioTracks()[0];
                if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!isMuted);
              }} className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                {isMuted ? 'Mic Off' : 'Mic On'}
              </button>
            </div>
            <button onClick={handleJoin} className="w-full accent-gradient py-4 rounded-2xl font-bold text-white text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              Join Live Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col gap-4 relative">
        <div className={`flex-1 grid gap-4 ${getGridLayout()}`}>
          <div className="relative rounded-[40px] bg-gray-950 border border-gray-800 overflow-hidden group shadow-2xl">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl text-xs font-bold text-white border border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
              {userName} (You)
            </div>
          </div>

          {peers.map((peer) => (
            <div key={peer.peerId} className="relative rounded-[40px] bg-gray-950 border border-gray-800 overflow-hidden shadow-2xl">
              <div className="w-full h-full flex items-center justify-center bg-indigo-500/5">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-3xl font-black text-indigo-400 shadow-2xl">
                    {peer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{peer.name}</p>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl text-xs font-bold text-white border border-white/10">
                {peer.name}
              </div>
            </div>
          ))}
        </div>

        <div className="h-24 glass rounded-[40px] border border-gray-800 flex items-center justify-between px-10 shadow-2xl">
          <div className="flex items-center gap-6">
            <button onClick={copyMeetingLink} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-xs font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Copy Link
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className={`p-5 rounded-3xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
            <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-5 rounded-3xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={toggleRecording} className={`flex items-center gap-3 px-8 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all ${isRecording ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xl'}`}>
              <div className={`w-2.5 h-2.5 rounded-full bg-white ${isRecording ? 'animate-pulse' : ''}`}></div>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button onClick={() => navigate('/')} className="px-8 py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all">Leave</button>
          </div>

          <div className="flex -space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">+{peers.length}</div>
          </div>
        </div>
      </div>

      <div className="w-96 flex flex-col gap-4">
        <div className="flex-1 glass rounded-[40px] border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
          <div className="flex border-b border-gray-800">
            {['copilot', 'chat', 'participants'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            {activeTab === 'copilot' && (
              <>
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6 shadow-inner">
                  <p className="text-[10px] text-indigo-300 leading-relaxed font-bold text-center italic tracking-tight">AI CO-PILOT IS MONITORING CONTEXT...</p>
                </div>
                {liveEvents.length === 0 && <p className="text-center text-gray-700 py-20 text-xs italic">Waiting for meeting intelligence...</p>}
                {liveEvents.map((event, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-white/5 border border-gray-800 animate-in slide-in-from-right-4 shadow-sm">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md mb-2 inline-block ${event.type === 'decision' ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{event.type}</span>
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">{event.content}</p>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-gray-600 mb-1 ml-1 font-bold uppercase tracking-widest">{msg.sender}</span>
                    <div className={`max-w-[90%] p-4 rounded-3xl text-xs font-medium ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-900 text-gray-300 rounded-bl-none border border-gray-800'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">JD</div>
                    <span className="text-xs font-black text-white uppercase tracking-tight">{userName} (Host)</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                {peers.map(p => (
                   <div key={p.peerId} className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-400">{p.name[0]}</div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{p.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'chat' && (
            <div className="p-6 bg-gray-950 border-t border-gray-800 shadow-2xl">
              <input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && userInput.trim()) { setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userInput, sender: userName, timestamp: new Date() }]); setUserInput(''); }}}
                type="text" 
                placeholder="Message the room..."
                className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
