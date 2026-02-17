
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

// Audio handling helpers as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startVoiceAI = async () => {
    try {
      setIsActive(true);
      setTranscript('Listening...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscript(message.serverContent.inputTranscription.text);
            }
            if (message.serverContent?.outputTranscription) {
              setAiResponse(message.serverContent.outputTranscription.text);
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: 'You are the MeetMet Voice Assistant. Speak naturally. Help users manage their meetings and answer questions about their workflow.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsActive(false);
    }
  };

  const stopVoiceAI = () => {
    sessionRef.current?.close();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsActive(false);
  };

  return (
    <div className="fixed bottom-10 right-10 z-[100]">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 glass rounded-[40px] border border-gray-800 p-8 shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Voice Assistant</h4>
            <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-6 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.5)] scale-110' : 'bg-gray-800 shadow-xl'}`}>
               {isActive ? (
                 <div className="flex gap-1">
                   {[1,2,3].map(i => <div key={i} className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>)}
                 </div>
               ) : (
                 <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               )}
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{isActive ? 'AI is Listening' : 'Ready to Talk'}</p>
              <div className="h-16 overflow-y-auto">
                <p className="text-xs text-gray-300 italic font-medium">"{transcript || 'Say something...'}"</p>
                {aiResponse && <p className="text-xs text-indigo-400 mt-2 font-bold leading-tight">{aiResponse}</p>}
              </div>
            </div>

            <button 
              onClick={isActive ? stopVoiceAI : startVoiceAI}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'accent-gradient text-white shadow-lg'}`}
            >
              {isActive ? 'Stop Assistant' : 'Start Conversation'}
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-[24px] accent-gradient text-white shadow-[0_10px_30px_rgba(99,102,241,0.5)] flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all active:scale-95"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </button>
    </div>
  );
};

export default VoiceAssistant;
