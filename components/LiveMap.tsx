import React, { useEffect, useState } from 'react';
import { LocationData } from '../types';
import { MapPin, Navigation } from 'lucide-react';

interface LiveMapProps {
  location: LocationData | null;
  isActive: boolean;
}

const LiveMap: React.FC<LiveMapProps> = ({ location, isActive }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-40 bg-slate-100 overflow-hidden group">
      {/* Mock Map Grid */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>

      {/* Center Marker */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {isActive && (
            <div className={`absolute -inset-8 rounded-full bg-blue-500/20 ${pulse ? 'scale-150 opacity-0' : 'scale-100 opacity-100'} transition-all duration-1000`}></div>
          )}
          <div className="relative z-10 bg-white text-blue-600 p-2 rounded-full shadow-[0_4px_10px_rgba(37,99,235,0.3)]">
            <Navigation size={18} className="fill-blue-600" />
          </div>
        </div>
      </div>

      {/* Floating Status Badge */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-slate-100 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Live Tracking</span>
      </div>

      {/* Address Bar Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-slate-400 shrink-0" />
          <div className="flex-1 truncate">
             <div className="text-xs font-semibold text-slate-700 truncate">
               {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Locating satellite..."}
             </div>
             <div className="text-[10px] text-slate-400">
               {location ? `Accuracy: within ${location.accuracy.toFixed(0)}m` : "Waiting for GPS..."}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;