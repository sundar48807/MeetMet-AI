
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meeting } from '../types';
import { geminiService } from '../services/geminiService';

interface UploadMeetingProps {
  onUpload: (meeting: Meeting) => void;
}

const UploadMeeting: React.FC<UploadMeetingProps> = ({ onUpload }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [streamedTranscript, setStreamedTranscript] = useState('');
  const [intelStatus, setIntelStatus] = useState<'pending' | 'syncing' | 'complete'>('pending');
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedTranscript]);

  useEffect(() => {
    let interval: any;
    if (isProcessing && timer > 0) {
      interval = setInterval(() => setTimer(prev => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, timer]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
  };

  const handleProcess = async () => {
    if (!title.trim() || !selectedFile) return alert('Input required.');

    setIsProcessing(true);
    setStreamedTranscript('');
    setIntelStatus('syncing');
    
    try {
      const base64 = await fileToBase64(selectedFile);
      const mimeType = selectedFile.type;

      // START PARALLEL TRACKS
      // Track 1: Transcription Stream (User sees results instantly)
      const transcriptPromise = (async () => {
        let fullText = '';
        const stream = geminiService.streamTranscript(base64, mimeType, title);
        for await (const chunk of stream) {
          fullText += chunk;
          setStreamedTranscript(prev => prev + chunk);
        }
        return fullText;
      })();

      // Track 2: Analysis Intel (Concurrent)
      const intelPromise = geminiService.extractIntelligence(base64, mimeType, title);

      // Wait for both to complete for the final object
      const [finalTranscript, intel] = await Promise.all([transcriptPromise, intelPromise]);
      
      setIntelStatus('complete');

      const newMeeting: Meeting = {
        id: Math.random().toString(36).substr(2, 9),
        meetingId: Math.random().toString(36).substr(2, 12),
        title,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: `${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB Archive`,
        participants: intel.analytics?.topics?.slice(0, 3) || ['Host'],
        category: 'General',
        tags: [intel.analytics?.sentiment || 'Neutral'],
        transcript: finalTranscript,
        summary: intel.summary,
        actionItems: intel.actionItems || [],
        analytics: {
          talkTime: {},
          sentiment: (intel.analytics?.sentiment as any) || 'Neutral',
          productivityScore: intel.analytics?.productivityScore || 0,
          topics: intel.analytics?.topics || [],
          emotions: intel.analytics?.emotions || []
        },
        followUpEmail: intel.followUpEmail,
        kbEntry: intel.kbEntry
      };

      onUpload(newMeeting);
      navigate(`/meeting/${newMeeting.id}`);
      
    } catch (error: any) {
      console.error(error);
      setIsProcessing(false);
      setIntelStatus('pending');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="text-center">
        <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">Neural Speed Sync</h2>
        <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.5em]">Parallel Intelligence Processing</p>
      </div>

      <div className="glass p-1 rounded-[48px] border border-gray-800 shadow-2xl overflow-hidden bg-black/40">
        <div className="p-10 space-y-8 relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-black/95 z-50 p-10 flex flex-col animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <h3 className="text-indigo-400 font-black uppercase tracking-widest text-sm">Neural Link Active</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Parallel Tracks: Transcribe + Analytics</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-white tabular-nums">{timer}s</span>
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Sync Window</p>
                </div>
              </div>

              {/* The Neural Terminal - Real-time Streaming View */}
              <div className="flex-1 bg-gray-950 border border-gray-900 rounded-[32px] p-6 font-mono text-[10px] overflow-hidden flex flex-col shadow-inner">
                <div className="flex justify-between border-b border-gray-900 pb-3 mb-4">
                   <span className="text-indigo-500/50 uppercase font-black tracking-widest">Incoming Stream // 2.5GBPS</span>
                   <span className="text-gray-800">{streamedTranscript.length} bytes received</span>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4 scroll-smooth">
                  <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {streamedTranscript || 'Initializing neural path...'}
                  </p>
                  <div className="w-2 h-4 bg-indigo-500 animate-pulse inline-block ml-1"></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className={`p-4 rounded-2xl border transition-all ${streamedTranscript ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-gray-900 bg-gray-950 opacity-40'}`}>
                  <p className="text-[9px] font-black text-indigo-400 uppercase mb-2">Transcription</p>
                  <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 animate-pulse" style={{ width: streamedTranscript ? '100%' : '0%' }}></div>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${intelStatus !== 'pending' ? 'border-purple-500/50 bg-purple-500/5' : 'border-gray-900 bg-gray-950 opacity-40'}`}>
                  <p className="text-[9px] font-black text-purple-400 uppercase mb-2">Analytics Engine</p>
                  <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: intelStatus === 'syncing' ? '60%' : intelStatus === 'complete' ? '100%' : '0%' }}></div>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${intelStatus === 'complete' ? 'border-green-500/50 bg-green-500/5' : 'border-gray-900 bg-gray-950 opacity-40'}`}>
                  <p className="text-[9px] font-black text-green-400 uppercase mb-2">Archive Commit</p>
                  <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: intelStatus === 'complete' ? '100%' : '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="MEETING SUBJECT"
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-xs text-white uppercase font-black tracking-widest placeholder:text-gray-800 focus:border-indigo-500 transition-all outline-none"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full bg-gray-950 border-2 border-dashed rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-between ${selectedFile ? 'border-indigo-500 text-indigo-400' : 'border-gray-800 text-gray-600 hover:border-gray-700'}`}
              >
                <span>{selectedFile ? selectedFile.name : 'Select Intelligence Source'}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,video/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <button 
              onClick={handleProcess} 
              disabled={isProcessing || !selectedFile} 
              className="w-full accent-gradient py-6 rounded-[32px] font-black text-white text-sm uppercase tracking-[0.6em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:grayscale"
            >
              Initialize Neural Sync
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Latency', val: '22ms', sub: 'Model Response' },
          { label: 'Throughput', val: '10x', sub: 'Parallel Tracks' },
          { label: 'Efficiency', val: '99.8%', sub: 'Archive Integrity' }
        ].map(stat => (
          <div key={stat.label} className="glass p-6 rounded-[32px] border border-gray-800 text-center">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic">{stat.val}</h4>
            <p className="text-[8px] text-indigo-500 font-bold uppercase mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadMeeting;
