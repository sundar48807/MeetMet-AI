
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

// Manual implementation of audio encoding/decoding as required by guidelines
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

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

const LiveCoPilot: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Standby');
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Starts a new Gemini Live session
  const startSession = async () => {
    setIsActive(true);
    setStatus('Connecting...');
    
    try {
      // Create fresh instance before starting session
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
            setStatus('Active - Listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              // Use promise to ensure session is resolved
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Process transcriptions
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscriptions(prev => [...prev.slice(-10), `AI: ${text}`]);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscriptions(prev => [...prev.slice(-10), `You: ${text}`]);
            }

            // Always handle the audio stream as per guidelines
            const base64EncodedAudioString =
              message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            
            if (base64EncodedAudioString) {
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputCtx.currentTime,
              );
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                outputCtx,
                24000,
                1,
              );
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle interruptions
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => { 
            setStatus('Closed'); 
            setIsActive(false); 
          },
          onerror: (e) => { 
            console.error('Session error:', e);
            setStatus('Error'); 
            setIsActive(false); 
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a real-time meeting co-pilot. Listen to the conversation and provide short, helpful suggestions or facts when asked.'
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Failed to start');
      setIsActive(false);
    }
  };

  // Closes the session and releases resources
  const stopSession = () => {
    sessionRef.current?.close();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsActive(false);
    setStatus('Ended');
    nextStartTimeRef.current = 0;
    sourcesRef.current.clear();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="glass p-8 rounded-3xl border border-gray-800 text-center">
        <div className="w-20 h-20 rounded-full accent-gradient flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Live Meeting Co-Pilot</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm">Real-time transcription, emotion tracking, and AI-assisted insights during your active calls.</p>
        
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button onClick={startSession} className="px-12 py-4 accent-gradient rounded-2xl font-bold text-white shadow-xl hover:scale-105 transition">Start Co-Pilot Session</button>
          ) : (
            <button onClick={stopSession} className="px-12 py-4 bg-red-500/20 border border-red-500/50 rounded-2xl font-bold text-red-400 hover:bg-red-500/30 transition">Stop Session</button>
          )}
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500">{status}</span>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-gray-800 h-96 flex flex-col">
        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Live Activity Feed</h4>
        <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
          {transcriptions.map((t, i) => (
            <div key={i} className={`p-2 rounded-lg ${t.startsWith('AI:') ? 'bg-indigo-500/10 text-indigo-300' : 'bg-white/5 text-gray-400'}`}>{t}</div>
          ))}
          {transcriptions.length === 0 && <p className="text-center text-gray-700 py-12">Session transcription will appear here...</p>}
        </div>
      </div>
    </div>
  );
};

export default LiveCoPilot;
