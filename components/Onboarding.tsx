import React, { useState } from 'react';
import { useSafety } from '../context/SafetyContext';
import { ShieldCheck, User, ArrowRight, Plus, X, Smartphone, Zap, Check, KeyRound } from 'lucide-react';
import { EmergencyContact } from '../types';

const Onboarding: React.FC = () => {
  const { updateUserProfile, userProfile } = useSafety();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(userProfile.fullName || '');
  const [safeword, setSafeword] = useState(userProfile.safeword || '');
  const [contacts, setContacts] = useState<EmergencyContact[]>(userProfile.contacts || []);
  
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const addContact = () => {
    if (cName && cPhone) {
      setContacts([...contacts, { id: Date.now().toString(), name: cName, phone: cPhone, relation: 'Family' }]);
      setCName('');
      setCPhone('');
    }
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleFinish = () => {
    updateUserProfile({
      fullName: name,
      safeword,
      contacts,
      isSetupComplete: true,
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-white">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-900/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      
      <div className="flex-1 flex flex-col justify-center p-8 max-w-md mx-auto w-full z-10">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
           <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
           <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
           <div className={`h-1 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
        </div>

        <div className="mb-6">
           <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
             <ShieldCheck size={24} />
           </div>
           <h1 className="text-2xl font-bold tracking-tight">System Initialization</h1>
           <p className="text-slate-400 text-sm mt-1">Configure your personal security protocols.</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">User Identity</label>
                  <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:bg-slate-800 transition-all">
                    <User size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter Full Name"
                        className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 font-medium"
                    />
                  </div>
                </div>

                {/* Safe Word Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <KeyRound size={14} /> Secret Safe Word
                  </label>
                  <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus-within:border-purple-500 focus-within:bg-slate-800 transition-all">
                    <Zap size={18} className="text-purple-400" />
                    <input 
                        type="text" 
                        value={safeword}
                        onChange={(e) => setSafeword(e.target.value)}
                        placeholder="e.g. 'Pineapple' or 'Red'"
                        className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    This word will trigger alarms when spoken. <br/>
                    <span className="text-slate-300">2x = Silent Alert, 3x = Emergency SOS.</span>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!name || !safeword}
                  className="w-full bg-white hover:bg-slate-200 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Proceed <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Emergency Contacts</label>
              
              <div className="space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                         {c.name.charAt(0)}
                       </div>
                       <div>
                         <div className="font-semibold text-slate-200 text-sm">{c.name}</div>
                         <div className="text-xs text-slate-400">{c.phone}</div>
                       </div>
                    </div>
                    <button onClick={() => removeContact(c.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700 space-y-3">
                 <input 
                   type="text" 
                   placeholder="Contact Name"
                   value={cName}
                   onChange={(e) => setCName(e.target.value)}
                   className="w-full bg-transparent border-b border-slate-700 p-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                 />
                 <div className="flex gap-2">
                    <input 
                      type="tel" 
                      placeholder="Phone Number"
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      className="flex-1 bg-transparent border-b border-slate-700 p-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                    />
                    <button 
                      onClick={addContact}
                      disabled={!cName || !cPhone}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700"
                    >
                      <Plus size={16} />
                    </button>
                 </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-slate-400 font-medium hover:text-white transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={contacts.length < 1}
                  className="flex-1 bg-white text-black hover:bg-slate-200 font-bold py-3 rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Smartphone size={14} /> Hardware Triggers
                  </label>
                  <p className="text-xs text-slate-400">
                    Connect your phone's physical buttons (Action Button, Back Tap) to these magic links for instant background access.
                  </p>
                </div>

                <div className="space-y-3">
                    {/* Emergency Link */}
                    <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-red-400 text-sm flex items-center gap-2">
                                <Zap size={14} /> Emergency SOS
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-black/40 text-[10px] p-2 rounded text-slate-400 border border-slate-800 font-mono truncate">
                                {window.location.origin}?trigger=SOS
                            </code>
                            <button 
                                onClick={() => copyToClipboard(`${window.location.origin}?trigger=SOS`, 'SOS')}
                                className={`text-xs px-3 rounded font-medium transition-all ${copiedLink === 'SOS' ? 'bg-green-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                            >
                                {copiedLink === 'SOS' ? <Check size={14}/> : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Alert Link */}
                    <div className="bg-yellow-900/10 border border-yellow-500/20 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-yellow-400 text-sm flex items-center gap-2">
                                <ShieldCheck size={14} /> Silent Alert
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-black/40 text-[10px] p-2 rounded text-slate-400 border border-slate-800 font-mono truncate">
                                {window.location.origin}?trigger=ALERT
                            </code>
                            <button 
                                onClick={() => copyToClipboard(`${window.location.origin}?trigger=ALERT`, 'ALERT')}
                                className={`text-xs px-3 rounded font-medium transition-all ${copiedLink === 'ALERT' ? 'bg-green-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                            >
                                {copiedLink === 'ALERT' ? <Check size={14}/> : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button 
                        onClick={() => setStep(2)}
                        className="px-6 py-3 text-slate-400 font-medium hover:text-white transition-colors"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleFinish}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                        <ShieldCheck size={18} /> ACTIVATE
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;