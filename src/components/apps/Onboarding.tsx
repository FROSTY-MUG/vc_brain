import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Onboarding({ onComplete }: { onComplete: (profile: any) => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ name: '', title: '', goal: '' });

  const steps = [
    { key: 'name', label: 'What is your name?', field: 'name' },
    { key: 'title', label: 'What is your title/tagline?', field: 'title' },
    { key: 'goal', label: 'How much do you want to invest (or raise)?', field: 'goal' },
  ];

  const handleNext = (val: string) => {
    const newProfile = { ...profile, [steps[step].field]: val };
    setProfile(newProfile);
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(newProfile); // Data is now fully dynamic and synced
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 rounded-b-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center w-full max-w-md px-6"
        >
          <h2 className="text-xl font-mono mb-8 text-emerald-400 tracking-wider uppercase">{steps[step].label}</h2>
          <input
            autoFocus
            className="w-full bg-transparent border-b-2 border-emerald-500/30 focus:border-emerald-500 text-center text-2xl text-slate-100 outline-none pb-2 transition-colors font-sans"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                handleNext(e.currentTarget.value);
              }
            }}
          />
          <p className="text-xs text-slate-500 font-mono mt-6 uppercase tracking-widest animate-pulse">Press Enter to continue</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
