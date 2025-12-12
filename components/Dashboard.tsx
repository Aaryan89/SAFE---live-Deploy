import React, { useState, useEffect, useRef } from 'react';
import { useSafety } from '../context/SafetyContext';
import LiveMap from './LiveMap';
import AIDetector from './AIDetector';
import { Calculator, ShieldCheck, Siren, Settings, ChevronRight, Eye, EyeOff, Lock, AlertTriangle, Volume2, Zap, Mic } from 'lucide-react';
import { AppMode, GuardianState } from '../types';

const Dashboard: React.FC = () => {
  const { setMode, triggerSOS, currentLocation, userProfile, guardianState, setGuardianState, isListening, lastTranscript } = useSafety();
  const [sentinelMode, setSentinelMode] = useState(false);
  
  // Siren State
  const [isSirenActive, setIsSirenActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Siren Logic (Web Audio API)
  const toggleSiren = () => {
    if (isSirenActive) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  const startSiren = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.value = 800; 

      const lfo = ctx.createOscillator();
      lfo.type = 'sawtooth';
      lfo.frequency.value = 4;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 600;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setIsSirenActive(true);
    } catch (e) {
      console.error("Audio API Error", e);
    }
  };

  const stopSiren = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsSirenActive(false);
  };

  useEffect(() => {
    return () => stopSiren();
  }, []);

  // Sentinel Mode (Fake "Screen Off")
  if (sentinelMode) {
      return (
          <div 
            className="h-screen w-screen bg-black text-neutral-800 flex flex-col items-center justify-center relative cursor-pointer"
            onClick={() => setSentinelMode(false)}
          >
             <div className="absolute top-10 flex flex-col items-center gap-2 opacity-50">
                 <Lock size={24} className="text-neutral-700"/>
                 <span className="text-[10px] font-mono tracking-widest">SENTINEL ACTIVE</span>
             </div>
             <div className="w-2 h-2 bg-emerald-900 rounded-full animate-pulse"></div>
             <div className="absolute bottom-10 text-neutral-800 text-xs font-medium animate-pulse">
                Tap to Wake
             </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-slate-900 rounded-b-[40px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 px-6 pt-8 pb-24 max-w-md mx-auto flex flex-col h-full min-h-screen">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-white">
             <div className="text-xs font-semibold tracking-wider opacity-70 uppercase mb-1">Status: Secure</div>
             <h1 className="text-2xl font-bold flex items-center gap-2">
               SAFE-Live <ShieldCheck size={20} className="text-emerald-400" />
             </h1>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setSentinelMode(true)}
                className="p-2 bg-white/10 rounded-full hover:bg-emerald-500/20 text-white transition-colors"
                title="Sentinel Mode (Screen Off)"
            >
                <EyeOff size={20} />
            </button>
            <button 
                onClick={() => setMode(AppMode.ONBOARDING)}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
            >
                <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Live Map Widget */}
        <div className="mb-8 shadow-xl rounded-2xl overflow-hidden border border-slate-100 bg-white">
          <LiveMap location={currentLocation} isActive={true} />
        </div>

        {/* Main Trigger Section */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-radar"></div>
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-radar" style={{ animationDelay: '1s' }}></div>
            
            <button
              onClick={() => triggerSOS('BUTTON_PRESS')}
              className="relative w-48 h-48 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-[0_10px_40px_rgba(220,38,38,0.5)] border-4 border-red-400/50 flex flex-col items-center justify-center group active:scale-95 transition-all duration-200 z-10"
            >
              <Siren size={48} className="text-white mb-2 drop-shadow-md" />
              <span className="text-white font-black text-3xl tracking-widest drop-shadow-md">SOS</span>
              <span className="text-red-200 text-xs font-medium uppercase tracking-wider mt-1">Press for Help</span>
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-6 font-medium text-center max-w-[200px]">
            Triggers Location Sharing, Audio Recording & Police Alert
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 gap-4">
           {/* Loud Siren Card */}
           <button 
             onClick={toggleSiren}
             className={`glass-panel p-4 rounded-2xl flex flex-col items-start gap-2 active:scale-95 transition-all group text-left border-2 ${isSirenActive ? 'bg-orange-500 border-orange-400' : 'hover:border-orange-300'}`}
            >
             <div className={`p-2 rounded-lg transition-colors ${isSirenActive ? 'bg-white text-orange-600' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'}`}>
               <Volume2 size={20} className={isSirenActive ? 'animate-pulse' : ''} />
             </div>
             <div>
                <div className={`font-semibold ${isSirenActive ? 'text-white' : 'text-slate-700'}`}>
                    {isSirenActive ? 'STOP SIREN' : 'Loud Siren'}
                </div>
                <div className={`text-xs ${isSirenActive ? 'text-orange-100' : 'text-slate-500'}`}>
                    {isSirenActive ? 'Click to silence' : 'Deterrent Alarm'}
                </div>
             </div>
           </button>

           {/* Fake Mode Card */}
           <button 
             onClick={() => setMode(AppMode.DISCREET)} 
             className="glass-panel p-4 rounded-2xl flex flex-col items-start gap-2 active:bg-slate-50 transition-all hover:border-slate-300 group text-left"
            >
             <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-700 group-hover:text-white transition-colors">
               <Calculator size={20} />
             </div>
             <div>
                <div className="font-semibold text-slate-700">Discreet Mode</div>
                <div className="text-xs text-slate-500">Calculator Disguise</div>
             </div>
           </button>
        </div>

        {/* AI Guardian Status (Visual Only - Logic is Global) */}
        <div className="mt-4">
           {/* Use PASSIVE mode so it doesn't try to access Mic */}
           <AIDetector 
             onThreatDetected={() => {}} // Logic handled globally
             isArmed={true} 
             safeword={userProfile.safeword}
             minimal={false} 
             passive={true} // VITAL: Disables internal mic logic
             externalIsListening={isListening}
             externalTranscript={lastTranscript}
             // For simulation to work, we need to pass a callback if we want the SIM input to go somewhere
             // But since Global handles it, we can just leave onTranscript empty or pass a handler that sends data to Global if needed.
             // For now, visual feedback of "Listening" is what matters.
           />
        </div>
      </div>

      {/* Voice Verification Overlay */}
      {guardianState !== GuardianState.MONITORING && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-pulse ${guardianState === GuardianState.VERIFYING_SOS ? 'bg-red-600' : 'bg-yellow-600'}`}>
              <Mic size={40} className="text-white" />
           </div>
           
           <h2 className="text-2xl font-bold text-white mb-2">
             {guardianState === GuardianState.VERIFYING_SOS ? "SOS DETECTED" : "ALERT DETECTED"}
           </h2>
           
           <p className="text-slate-300 text-lg max-w-xs mb-8">
             Auto-sending in 10s...
             <br/>
             <span className="text-sm font-light">Repeat <strong>"{userProfile.safeword}"</strong> to send immediately.</span>
             <br/><br/>
             <span className="text-sm opacity-60">Say "Stop" or "Cancel" to abort.</span>
           </p>

           <button 
             onClick={() => setGuardianState(GuardianState.MONITORING)}
             className="px-8 py-3 rounded-full border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
           >
             Cancel Manual
           </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;