import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppMode, LocationData, UserProfile, EmergencyContact, GuardianState } from '../types';

interface SafetyContextType {
  mode: AppMode;
  userProfile: UserProfile;
  currentLocation: LocationData | null;
  guardianState: GuardianState;
  
  // Global Audio State
  isListening: boolean;
  lastTranscript: string;
  
  setMode: (mode: AppMode) => void;
  setGuardianState: (state: GuardianState) => void;
  updateUserProfile: (profile: UserProfile) => void;
  updateAudioState: (listening: boolean, transcript: string) => void;
  triggerSOS: (method: string) => void;
  cancelSOS: () => void;
}

const defaultUser: UserProfile = {
  fullName: '',
  safeword: '',
  contacts: [],
  isSetupComplete: false,
};

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export const SafetyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>(AppMode.ONBOARDING);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUser);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [guardianState, setGuardianState] = useState<GuardianState>(GuardianState.MONITORING);
  
  // Shared Audio State
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');

  // Load from LocalStorage and Check URL Triggers
  useEffect(() => {
    const saved = localStorage.getItem('safe-live-user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserProfile(parsed);
      
      // Only default to dashboard if not already set by trigger logic below
      if (parsed.isSetupComplete) {
         setMode(prev => prev === AppMode.ONBOARDING ? AppMode.DASHBOARD : prev);
      }
    }

    // External Hardware Trigger Check
    const params = new URLSearchParams(window.location.search);
    const trigger = params.get('trigger');
    if (trigger === 'SOS') {
      setMode(AppMode.EMERGENCY);
    } else if (trigger === 'ALERT') {
      // Could be a silent alert mode
      setMode(AppMode.DASHBOARD);
      // In a real app, this might trigger a background recording instantly
    }
  }, []);

  // Geolocation Tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (err) => console.error("Geo Error", err),
      { enableHighAccuracy: mode === AppMode.EMERGENCY, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mode]);

  // Wake Lock for "Background" Persistence
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock skipped:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (mode === AppMode.DASHBOARD || mode === AppMode.EMERGENCY)) {
        requestWakeLock();
      }
    };

    if (mode === AppMode.DASHBOARD || mode === AppMode.EMERGENCY) {
      requestWakeLock();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mode]);

  const updateUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('safe-live-user', JSON.stringify(profile));
    if (profile.isSetupComplete && mode === AppMode.ONBOARDING) {
      setMode(AppMode.DASHBOARD);
    }
  };

  const updateAudioState = (listening: boolean, transcript: string) => {
    setIsListening(listening);
    setLastTranscript(transcript);
  };

  const triggerSOS = (method: string) => {
    console.log(`SOS Triggered via: ${method}`);
    setMode(AppMode.EMERGENCY);
    setGuardianState(GuardianState.MONITORING); // Reset guardian on trigger
  };

  const cancelSOS = () => {
    setMode(AppMode.DASHBOARD);
  };

  return (
    <SafetyContext.Provider 
      value={{ 
        mode, 
        setMode, 
        userProfile, 
        currentLocation, 
        guardianState,
        setGuardianState,
        updateUserProfile,
        updateAudioState,
        isListening,
        lastTranscript,
        triggerSOS, 
        cancelSOS 
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (!context) throw new Error("useSafety must be used within SafetyProvider");
  return context;
};