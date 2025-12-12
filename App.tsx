import React, { useEffect, useState, useRef } from 'react';
import { SafetyProvider, useSafety } from './context/SafetyContext';
import { AppMode, GuardianState, ThreatLevel } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import EmergencyMode from './components/EmergencyMode';
import FakeInterface from './components/FakeInterface';
import AIDetector from './components/AIDetector';

// Global Guardian Controller
// Handles persistent listening and verification state machine
const GlobalGuardian: React.FC = () => {
  const { mode, userProfile, triggerSOS, guardianState, setGuardianState, updateAudioState } = useSafety();
  const processingRef = useRef(false);
  
  // Text-to-Speech Helper
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
       // Cancel previous to prevent overlapping
       window.speechSynthesis.cancel();
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.rate = 1.0;
       window.speechSynthesis.speak(utterance);
    }
  };

  // 0. Auto-Confirm Timer (10 Seconds)
  // If user says nothing, we assume distress and auto-send.
  useEffect(() => {
    let timeoutId: number;

    if (guardianState === GuardianState.VERIFYING_SOS || guardianState === GuardianState.VERIFYING_SILENT) {
      timeoutId = window.setTimeout(() => {
         const action = guardianState === GuardianState.VERIFYING_SOS ? 'AUTO_TIMEOUT_SOS' : 'AUTO_TIMEOUT_SILENT';
         speak("Time expired. Sending signal now.");
         triggerSOS(action);
      }, 10000); // 10 seconds
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [guardianState, triggerSOS]);

  // 1. Handle AI/Local-Detected Threats
  const handleThreatDetected = (type: 'movement' | 'audio', level: ThreatLevel, reasoning?: string) => {
     // ESCALATION LOGIC:
     // If we are already verifying a Silent Alert (2 words), and the user says the word again (reaching 3 words/CRITICAL),
     // we must upgrade to SOS immediately.
     if (guardianState === GuardianState.VERIFYING_SILENT && level === ThreatLevel.CRITICAL) {
         setGuardianState(GuardianState.VERIFYING_SOS);
         speak("Escalating to Emergency SOS.");
         return;
     }

     // Standard Trigger Logic
     if (guardianState !== GuardianState.MONITORING) return; // Already verifying and not escalating

     if (level === ThreatLevel.CRITICAL) {
        // 3x Repetition -> Potential SOS
        setGuardianState(GuardianState.VERIFYING_SOS);
        // Minimal feedback, waiting patiently
        speak("Emergency detected.");
     } else if (level === ThreatLevel.DANGER) {
        // 2x Repetition -> Potential Silent Alert
        setGuardianState(GuardianState.VERIFYING_SILENT);
        // Minimal feedback, waiting patiently
        speak("Alert detected.");
     }
  };

  // 2. Handle Raw Transcript (Verification / Cancellation) AND Update Global Context
  const handleTranscript = (text: string) => {
     // Broadcast to UI
     updateAudioState(true, text);

     // Prevent action processing if already executing one (debounce mechanism)
     if (processingRef.current) return;

     const cleanText = text.toLowerCase();
     const safe = userProfile.safeword.toLowerCase();

     // If in Verification Mode
     if (guardianState !== GuardianState.MONITORING) {
        
        // CONFIRMATION: User repeats safe word -> Trigger Immediately
        if (cleanText.includes(safe)) {
           processingRef.current = true;
           const action = guardianState === GuardianState.VERIFYING_SOS ? 'VOICE_SOS' : 'VOICE_SILENT';
           speak(guardianState === GuardianState.VERIFYING_SOS ? "Confirmed. Activating." : "Confirmed. Sent.");
           
           triggerSOS(action);
           
           setTimeout(() => { processingRef.current = false; }, 2000);
           return;
        }

        // CANCELLATION: User says "Stop" or "Cancel" -> Abort
        if (cleanText.match(/stop|cancel|wait|no/)) {
           processingRef.current = true;
           speak("Cancelled.");
           setGuardianState(GuardianState.MONITORING);
           
           setTimeout(() => { processingRef.current = false; }, 2000);
           return;
        }
     }
  };

  const handleListeningChange = (isListening: boolean) => {
    updateAudioState(isListening, isListening ? "Listening..." : "Paused");
  };

  // Determine if Armed: Active in Dashboard, Discreet, Pre-Alert. Not in Onboarding or Emergency (already triggered).
  const isArmed = userProfile.isSetupComplete && mode !== AppMode.ONBOARDING && mode !== AppMode.EMERGENCY;

  return (
    <>
       {/* Global Background Detector - Minimal/Invisible Mode */}
       {isArmed && (
         <div className="fixed bottom-0 left-0 right-0 z-0 opacity-0 pointer-events-none">
            <AIDetector 
              isArmed={true}
              safeword={userProfile.safeword}
              onThreatDetected={handleThreatDetected}
              onTranscript={handleTranscript}
              onListeningChange={handleListeningChange}
              minimal={true} 
            />
         </div>
       )}
    </>
  );
};

const AppContent: React.FC = () => {
  const { mode, setMode, triggerSOS } = useSafety();

  const getComponent = () => {
    switch (mode) {
      case AppMode.ONBOARDING:
        return <Onboarding />;
      case AppMode.EMERGENCY:
        return <EmergencyMode />;
      case AppMode.DISCREET:
        return <FakeInterface onTrigger={() => triggerSOS('DISCREET_CODE')} onExit={() => setMode(AppMode.DASHBOARD)} />;
      case AppMode.DASHBOARD:
      case AppMode.PRE_ALERT: 
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <GlobalGuardian />
      {getComponent()}
    </>
  );
};

const App: React.FC = () => {
  return (
    <SafetyProvider>
      <AppContent />
    </SafetyProvider>
  );
};

export default App;