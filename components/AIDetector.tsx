import React, { useState, useEffect, useRef } from 'react';
import { Mic, Zap, PlayCircle, MicOff } from 'lucide-react';
import { analyzeThreatAudio } from '../services/geminiService';
import { ThreatLevel } from '../types';

interface AIDetectorProps {
  onThreatDetected: (type: 'movement' | 'audio', level: ThreatLevel, reasoning?: string) => void;
  onTranscript?: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  
  isArmed: boolean;
  safeword: string;
  
  minimal?: boolean; // If true, hides the UI (Logic Only)
  passive?: boolean; // If true, disables Logic (UI Only), relies on external props
  
  externalIsListening?: boolean; // For passive mode
  externalTranscript?: string;   // For passive mode
}

const AIDetector: React.FC<AIDetectorProps> = ({ 
  onThreatDetected, 
  onTranscript, 
  onListeningChange,
  isArmed, 
  safeword, 
  minimal = false,
  passive = false,
  externalIsListening = false,
  externalTranscript = ''
}) => {
  const [localIsListening, setLocalIsListening] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  
  // For demo/simulation
  const [simInput, setSimInput] = useState('');

  // Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const lastAnalysisTime = useRef<number>(0);
  
  // LOCAL DETECTION REFS
  const recentHistoryRef = useRef<string>('');
  const lastTriggerRef = useRef<ThreatLevel>(ThreatLevel.NONE);
  const resetTimerRef = useRef<number | null>(null);

  // Computed State (Passive vs Local)
  const isListening = passive ? externalIsListening : localIsListening;
  const transcript = passive ? externalTranscript : localTranscript;
  
  // Start/Stop Logic (Only if NOT passive)
  useEffect(() => {
    if (passive) return;

    if (isArmed) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [isArmed, passive]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log("Speech API not supported in this browser.");
      if (onListeningChange) onListeningChange(false);
      return;
    }

    try {
      if (recognitionRef.current) return;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setLocalIsListening(true);
        if (onListeningChange) onListeningChange(true);
      };

      recognition.onend = () => {
        setLocalIsListening(false);
        if (onListeningChange) onListeningChange(false);
        
        // Auto-restart if still armed (persistent listening)
        if (isArmed && !passive) {
            setTimeout(() => {
                try { recognition.start(); } catch(e) { /* ignore restart error */ }
            }, 100);
        } 
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
            setLocalIsListening(false);
            if (onListeningChange) onListeningChange(false);
        }
      };

      recognition.onresult = (event: any) => {
        // Reset the "silence" timer whenever we get results
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = window.setTimeout(() => {
           // Clear history after 5 seconds of silence to prevent stale triggers
           recentHistoryRef.current = '';
           lastTriggerRef.current = ThreatLevel.NONE;
           setLocalTranscript(''); 
        }, 5000);

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Update History
        if (finalTranscript) {
            recentHistoryRef.current += (" " + finalTranscript);
            // Keep history manageable (last 300 chars)
            if (recentHistoryRef.current.length > 300) {
                recentHistoryRef.current = recentHistoryRef.current.slice(-300);
            }
        }

        // Combine for Detection
        const effectiveText = (recentHistoryRef.current + " " + interimTranscript).trim();
        
        // 1. Broadcast to UI / Parent
        if (onTranscript) onTranscript(effectiveText);
        
        // 2. Update Local UI
        setLocalTranscript(effectiveText.slice(-100));
        
        // 3. FAST LOCAL DETECTION (Regex)
        // This runs on every frame of speech, ensuring "Smooth" and "Immediate" response.
        detectSafeWordLocal(effectiveText);

        // 4. AI Fallback (Optional, Throttled)
        // We still use AI for sentiment or complex phrases, but NOT for the primary safe word trigger anymore.
        // detectThreatAI(effectiveText); 
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Mic Error", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setLocalIsListening(false);
    if (onListeningChange) onListeningChange(false);
  };

  const detectSafeWordLocal = (text: string) => {
     if (!safeword) return;
     
     const lowerText = text.toLowerCase();
     const lowerSafe = safeword.toLowerCase();

     // Robust counting
     // We split by spaces to handle "pineapplepineapple" vs "pineapple pineapple" loosely if needed, 
     // but regex global match is safest for exact phrases.
     // Escape special regex chars in safeword just in case
     const escapedSafe = lowerSafe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     const matcher = new RegExp(escapedSafe, 'g');
     const matches = lowerText.match(matcher);
     const count = matches ? matches.length : 0;

     // TRIGGER LOGIC
     // We check if we are escalating (None -> Danger -> Critical)
     
     if (count >= 3) {
         if (lastTriggerRef.current !== ThreatLevel.CRITICAL) {
             lastTriggerRef.current = ThreatLevel.CRITICAL;
             onThreatDetected('audio', ThreatLevel.CRITICAL, "Local Detection: 3x Safe Word");
             
             // After a critical trigger, we essentially "consume" the event. 
             // We don't clear history immediately to allow the user to finish their sentence, 
             // but the App.tsx logic will likely switch modes.
             // Clearing buffer here ensures we don't re-trigger immediately.
             recentHistoryRef.current = ''; 
         }
     } else if (count === 2) {
         if (lastTriggerRef.current !== ThreatLevel.DANGER && lastTriggerRef.current !== ThreatLevel.CRITICAL) {
             lastTriggerRef.current = ThreatLevel.DANGER;
             onThreatDetected('audio', ThreatLevel.DANGER, "Local Detection: 2x Safe Word");
             // We do NOT clear history here, because the user might say the 3rd word in 500ms.
         }
     }
  };

  // Fallback AI Analysis (Throttled) - Only used for non-safe-word threats now
  const handleAnalysis = async (textToAnalyze: string) => {
    const now = Date.now();
    if (analyzing || now - lastAnalysisTime.current < 2000) return;
    lastAnalysisTime.current = now;
    setAnalyzing(true);
    
    // Only send if we haven't already triggered locally (optimization)
    if (lastTriggerRef.current === ThreatLevel.NONE) {
        const result = await analyzeThreatAudio(textToAnalyze, safeword);
        if (result.level !== ThreatLevel.NONE) {
            onThreatDetected('audio', result.level, result.reasoning);
        }
    }
    setAnalyzing(false);
  };

  const handleSimulation = () => {
    // Inject into the processing pipeline as if spoken
    if (simInput.toLowerCase().includes('stop') && onTranscript) {
       onTranscript(simInput);
    } else {
       // Append to history for simulation
       recentHistoryRef.current += (" " + simInput);
       const combined = recentHistoryRef.current;
       if (onTranscript) onTranscript(combined);
       if (!passive) detectSafeWordLocal(combined); 
    }
    setSimInput('');
  };

  // Render Logic
  if (!isArmed && !passive) return null;
  
  if (minimal) return (
     <div className="hidden"></div>
  );

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 bg-white/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
          <Zap size={16} className="text-purple-600 fill-current" />
          AI Guardian Active
        </h3>
        <div className="flex gap-2 items-center">
            {analyzing && <span className="text-[10px] text-purple-600 animate-pulse font-bold">AI SCAN...</span>}
            <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Live Audio Visualizer */}
        <div className="bg-slate-900 rounded-lg p-3 h-16 flex items-center justify-center relative overflow-hidden transition-all">
           {isListening ? (
               <div className="flex items-center gap-1 h-full">
                  {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-1 bg-purple-500 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }}></div>
                  ))}
               </div>
           ) : (
               <div className="text-xs text-slate-500 flex items-center gap-2">
                 <MicOff size={12}/> 
                 {passive ? "Connecting..." : "Mic Off / Not Supported"}
               </div>
           )}
           <div className="absolute bottom-1 left-2 right-2 text-[9px] text-slate-400 truncate font-mono opacity-60">
             {transcript || "Listening..."}
           </div>
        </div>

        {/* Simulation Input */}
        <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
             <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    placeholder={`"${safeword}" or "Stop"`}
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-purple-500 text-slate-700"
                 />
                 <button 
                    onClick={handleSimulation}
                    disabled={!simInput}
                    className="bg-purple-600 text-white px-2 rounded hover:bg-purple-700 disabled:opacity-50"
                 >
                    <PlayCircle size={14}/>
                 </button>
             </div>
             <p className="text-[9px] text-slate-400 mt-1 pl-1">
                 Simulate: "{safeword}" 3x = SOS, 2x = Alert.
             </p>
        </div>
      </div>
    </div>
  );
};

export default AIDetector;