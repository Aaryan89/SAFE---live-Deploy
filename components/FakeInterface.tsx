import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface FakeInterfaceProps {
  onTrigger: () => void;
  onExit: () => void;
}

const FakeInterface: React.FC<FakeInterfaceProps> = ({ onTrigger, onExit }) => {
  const [display, setDisplay] = useState('0');
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    // Show entry hint then fade out to secure the disguise
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = (val: string) => {
    if (display === '0') setDisplay(val);
    else setDisplay(prev => prev + val);
  };

  const clear = () => setDisplay('0');

  const calculate = () => {
    // SPECIAL TRIGGERS
    if (display === '911' || display === '0000' || display === '112') {
      onTrigger();
    } else if (display === '1234') {
      // EXIT CODE
      onExit();
    } else {
      try {
        // eslint-disable-next-line no-eval
        setDisplay(String(eval(display))); 
      } catch (e) {
        setDisplay('Error');
      }
    }
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col pb-8 pt-12 px-5 relative">
      
      {/* Secret Exit Area - Double Tap Top */}
      <div 
        className="absolute top-0 left-0 w-full h-16 z-40"
        onDoubleClick={onExit}
        title="Double tap to exit"
      ></div>

      {/* Temporary Hint */}
      <div className={`absolute top-6 left-0 right-0 flex justify-center transition-opacity duration-1000 ${showHint ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-neutral-800 text-neutral-400 text-xs px-3 py-1 rounded-full border border-neutral-700 shadow-lg">
             Type <span className="text-white font-mono">1234 =</span> to Exit
          </div>
      </div>

      {/* Display */}
      <div className="flex-1 flex items-end justify-end mb-6 px-2 overflow-hidden">
        <span className="text-7xl font-light tracking-tight truncate">{display}</span>
      </div>

      {/* Keypad - Mimicking iOS Layout */}
      <div className="grid grid-cols-4 gap-4">
        <CalcButton label="C" type="secondary" onClick={clear} />
        <CalcButton label="±" type="secondary" onClick={() => {}} />
        <CalcButton label="%" type="secondary" onClick={() => {}} />
        <CalcButton label="÷" type="accent" onClick={() => handlePress('/')} />

        <CalcButton label="7" type="primary" onClick={() => handlePress('7')} />
        <CalcButton label="8" type="primary" onClick={() => handlePress('8')} />
        <CalcButton label="9" type="primary" onClick={() => handlePress('9')} />
        <CalcButton label="×" type="accent" onClick={() => handlePress('*')} />

        <CalcButton label="4" type="primary" onClick={() => handlePress('4')} />
        <CalcButton label="5" type="primary" onClick={() => handlePress('5')} />
        <CalcButton label="6" type="primary" onClick={() => handlePress('6')} />
        <CalcButton label="-" type="accent" onClick={() => handlePress('-')} />

        <CalcButton label="1" type="primary" onClick={() => handlePress('1')} />
        <CalcButton label="2" type="primary" onClick={() => handlePress('2')} />
        <CalcButton label="3" type="primary" onClick={() => handlePress('3')} />
        <CalcButton label="+" type="accent" onClick={() => handlePress('+')} />

        <button 
          onClick={() => handlePress('0')} 
          className="col-span-2 h-20 rounded-full bg-neutral-800 text-white text-3xl font-medium flex items-center pl-8 active:bg-neutral-700 transition-colors"
        >
          0
        </button>
        <CalcButton label="." type="primary" onClick={() => handlePress('.')} />
        <CalcButton label="=" type="accent" onClick={calculate} />
      </div>
    </div>
  );
};

const CalcButton: React.FC<{ label: string, type: 'primary' | 'secondary' | 'accent', onClick: () => void }> = ({ label, type, onClick }) => {
  const base = "h-20 w-20 rounded-full text-3xl font-medium flex items-center justify-center transition-all active:scale-95";
  const styles = {
    primary: "bg-neutral-800 text-white active:bg-neutral-700",
    secondary: "bg-neutral-400 text-black active:bg-neutral-300",
    accent: "bg-orange-500 text-white active:bg-orange-400"
  };

  return (
    <button onClick={onClick} className={`${base} ${styles[type]}`}>
      {label}
    </button>
  );
};

export default FakeInterface;