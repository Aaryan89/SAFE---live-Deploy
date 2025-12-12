import React, { useEffect, useState } from 'react';
import { useSafety } from '../context/SafetyContext';
import { generateEmergencyReport } from '../services/geminiService';
import { Phone, Navigation, Loader2, X, Radio, ShieldAlert, CheckCircle2, Battery, Signal } from 'lucide-react';

const EmergencyMode: React.FC = () => {
  const { cancelSOS, userProfile, currentLocation } = useSafety();
  const [countdown, setCountdown] = useState(5);
  const [statusStep, setStatusStep] = useState(0);
  const [aiReport, setAiReport] = useState<string>('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && statusStep === 0) {
      startEmergencySequence();
    }
  }, [countdown, statusStep]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    }
  }, [])

  const startEmergencySequence = async () => {
    setStatusStep(1); // Call
    setStatusStep(2); // Generating Packet
    const report = await generateEmergencyReport(
        userProfile, 
        currentLocation, 
        "Panic Button Triggered. Immediate assistance required."
    );
    setAiReport(report);
    setStatusStep(3); // Contacts
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col relative overflow-hidden font-mono">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black z-0"></div>
      <div className="absolute inset-0 emergency-stripes opacity-10 z-0"></div>
      
      {/* Top HUD Bar */}
      <div className="z-10 flex justify-between items-center p-4 border-b border-red-900/50 bg-black/50 backdrop-blur-md">
         <div className="flex items-center gap-2 text-red-500 animate-pulse">
           <ShieldAlert size={20} />
           <span className="font-bold tracking-widest text-sm">EMERGENCY PROTOCOL</span>
         </div>
         <div className="flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1"><Signal size={12}/> LTE</div>
            <div className="flex items-center gap-1"><Battery size={12}/> 85%</div>
         </div>
      </div>

      <div className="z-10 flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        
        {/* Countdown / Status Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {countdown > 0 ? (
             <div className="text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse"></div>
                  <div className="text-[120px] font-black leading-none text-white tracking-tighter tabular-nums">
                    {countdown}
                  </div>
                </div>
                <div className="text-red-500 font-bold tracking-[0.2em] animate-pulse">INITIATING SOS</div>
             </div>
          ) : (
             <div className="w-full space-y-6">
                {/* Live Status Board */}
                <div className="border border-red-500/30 bg-red-950/20 rounded-lg p-6 space-y-4">
                  <h3 className="text-xs text-red-400 font-bold uppercase tracking-wider border-b border-red-900 pb-2 mb-2">Operation Log</h3>
                  
                  <TacticalItem 
                    label="911 Auto-Dial" 
                    status="completed" 
                    icon={<Phone size={14}/>} 
                  />
                  <TacticalItem 
                    label="Live GPS Uplink" 
                    status="completed" 
                    value={currentLocation ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : "Acquiring..."}
                    icon={<Navigation size={14}/>} 
                  />
                  <TacticalItem 
                    label="AI Incident Report" 
                    status={statusStep >= 2 ? (aiReport ? "completed" : "active") : "pending"} 
                    icon={<Radio size={14}/>} 
                  />
                   <TacticalItem 
                    label="Contact Broadcast" 
                    status={statusStep >= 3 ? "completed" : "pending"} 
                    value={`${userProfile.contacts.length} notified`}
                    icon={<Signal size={14}/>} 
                  />
                </div>

                {/* AI Packet Display */}
                {aiReport && (
                  <div className="bg-slate-900 border-l-2 border-yellow-500 p-4 rounded-r-lg shadow-lg">
                    <div className="text-[10px] text-yellow-500 uppercase tracking-widest mb-1">Generated Dispatch Packet</div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiReport}</p>
                  </div>
                )}
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8">
           {countdown > 0 ? (
             <button 
               onClick={cancelSOS}
               className="w-full py-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 font-bold tracking-wider hover:bg-slate-700 hover:text-white transition-colors"
             >
               CANCEL ALERT
             </button>
           ) : (
             <button 
               onDoubleClick={cancelSOS}
               className="group w-full py-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all flex flex-col items-center justify-center gap-1"
             >
               <span className="flex items-center gap-2"><X size={20}/> DOUBLE TAP TO DEACTIVATE</span>
               <span className="text-[10px] opacity-70 font-normal">Requires security confirmation</span>
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

const TacticalItem: React.FC<{ label: string, status: 'pending' | 'active' | 'completed', value?: string, icon: React.ReactNode }> = ({ label, status, value, icon }) => {
  const getStatusColor = () => {
    if (status === 'completed') return 'text-emerald-400';
    if (status === 'active') return 'text-yellow-400';
    return 'text-slate-600';
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded bg-slate-900 border border-slate-800 ${getStatusColor()}`}>
          {status === 'active' ? <Loader2 size={14} className="animate-spin"/> : (status === 'completed' ? <CheckCircle2 size={14}/> : icon)}
        </div>
        <div>
          <div className={`text-sm font-bold ${status === 'pending' ? 'text-slate-500' : 'text-slate-200'}`}>{label}</div>
          {value && <div className="text-[10px] text-slate-400">{value}</div>}
        </div>
      </div>
      <div className={`text-[10px] uppercase font-bold tracking-wider ${getStatusColor()}`}>
        {status}
      </div>
    </div>
  );
}

export default EmergencyMode;