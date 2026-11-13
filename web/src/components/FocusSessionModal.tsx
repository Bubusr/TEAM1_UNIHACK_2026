'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mangnon } from '@/lib/app-state';
import { SoundEngine } from '@/lib/sound-engine';
import {
  Clock,
  Play,
  Square,
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  X,
  BookOpen,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FocusSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangnon: Mangnon | null;
  onCompleteSession: (rewardLeaves: number, note: string) => void;
}

export default function FocusSessionModal({
  isOpen,
  onClose,
  mangnon,
  onCompleteSession,
}: FocusSessionModalProps) {
  // 1: setup, 2: focusing, 3: show-and-tell, 4: completed feedback
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [studyNote, setStudyNote] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if student
  const [isStudent, setIsStudent] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mangnon_user_account');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.isStudent) setIsStudent(true);
      } catch {}
    }
  }, []);

  // Timer loop
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen) return null;

  const handleStartTimer = (mins: number) => {
    SoundEngine.playBambooKnock();
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setStep(2);
  };

  const handleStartDemoSeconds = (secs: number) => {
    SoundEngine.playBambooKnock();
    setDurationMinutes(1);
    setSecondsRemaining(secs);
    setStep(2);
  };

  const handleFinishTimer = () => {
    SoundEngine.playBlessingChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#CFA85B', '#7E9A85', '#5C4D43'],
    });
    setStep(3);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitShowAndTell = () => {
    setIsAnalyzing(true);
    SoundEngine.playBambooKnock();

    setTimeout(() => {
      const note = studyNote.trim() || 'Studied quietly and completed fresh notes';
      let reply = 'You did wonderfully! Seeing your notes tells me how deeply you focused today.';
      if (mangnon?.personality === 'tomo') {
        reply = `Oh wow! You just finished this? These lines look so curious and magical, thank you for showing me!`;
      } else if (mangnon?.personality === 'haohung') {
        reply = `Brilliant effort, my friend!! That was such a fruitful focus session, I am beaming with joy for you!`;
      } else if (mangnon?.personality === 'diemtinh') {
        reply = `These quiet hours are truly precious. Every stroke of your pen breathes new life into the grove.`;
      } else if (mangnon?.personality === 'nhutnhat') {
        reply = `...You worked so diligently today. Seeing your quiet patience gives me courage too...`;
      }

      setAiFeedback(reply);
      setIsAnalyzing(false);
      setStep(4);
      SoundEngine.playBlessingChime();
    }, 700);
  };

  const handleCompleteAndClose = () => {
    const baseLeaves = 5;
    const finalLeaves = isStudent ? Math.round(baseLeaves * 1.5) : baseLeaves;
    onCompleteSession(finalLeaves, studyNote);
    onClose();
    setStep(1);
    setPhotoPreview(null);
    setStudyNote('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 animate-fade-in">
      <div className="relative w-full max-w-sm bamboo-card p-6 text-[#26292B]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#26292B]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏳</span>
            <h3 className="text-sm font-bold text-[#26292B]">
              Quiet Focus Sanctuary
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-dongho-paper/60 hover:text-dongho-paper transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: SETUP FOCUS DURATION */}
        {step === 1 && (
          <div className="mt-5 space-y-4">
            <div className="text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-forest-darker border border-warm-amber/50 flex items-center justify-center text-2xl shadow mb-2">
                📖
              </div>
              <h4 className="text-xs font-bold text-warm-glow">
                Shall we study quietly together?
              </h4>
              <p className="text-[11px] text-dongho-paper/70 mt-1 leading-relaxed">
                No noisy alarms, no penalties for checking references. Măng Non will sit quietly by your side.
              </p>
            </div>

            {/* Duration Options */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { mins: 15, label: '15 Min', desc: 'Gentle Read' },
                { mins: 25, label: '25 Min', desc: 'Pomodoro' },
                { mins: 45, label: '45 Min', desc: 'Deep Focus' },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  onClick={() => handleStartTimer(opt.mins)}
                  className="p-3 rounded-2xl bg-forest-darker hover:bg-forest-mist border border-warm-amber/40 hover:border-warm-amber text-center transition flex flex-col items-center justify-center"
                >
                  <span className="font-bold text-warm-glow">{opt.label}</span>
                  <span className="text-[9px] text-dongho-paper/60 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Fast Demo Button for Judges */}
            <button
              onClick={() => handleStartDemoSeconds(10)}
              className="w-full py-2 px-3 rounded-xl bg-warm-amber/20 hover:bg-warm-amber/30 border border-warm-amber/50 text-[11px] font-bold text-warm-amber flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-warm-amber" />
              <span>Quick 10-second trial (For Judges)</span>
            </button>

            {isStudent && (
              <div className="p-2.5 rounded-xl bg-bamboo-soft/10 border border-bamboo-soft/30 text-[10px] text-bamboo-soft flex items-center gap-2">
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Active <strong>Student Boost 1.5x Mam Luc</strong> for this study session!</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SILENCE FOCUS MODE */}
        {step === 2 && (
          <div className="mt-6 text-center space-y-6">
            <div className="relative w-44 h-44 mx-auto rounded-full bg-forest-darker border-4 border-warm-amber/40 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,209,102,0.15)]">
              <span className="text-3xl font-mono font-extrabold text-warm-glow tracking-wider">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[10px] text-dongho-paper/60 uppercase tracking-widest mt-1">
                Quiet Silence Mode
              </span>
            </div>

            <p className="text-xs text-dongho-paper/75 italic max-w-xs mx-auto">
              &quot;The bamboo grove breathes softly. Every quiet effort you make is woven into the earth...&quot;
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow hover:brightness-105 transition"
              >
                Conclude early
              </button>
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-2xl bg-forest-darker border border-bamboo-mid/40 text-dongho-paper/60 text-xs font-medium hover:text-dongho-paper transition"
              >
                Pause
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SHOW & TELL (PROOF OF OUTPUT) */}
        {step === 3 && (
          <div className="mt-4 space-y-4">
            <div className="text-center py-1">
              <span className="text-2xl">🎉</span>
              <h4 className="text-xs font-bold text-warm-glow mt-1">
                Session completed peacefully!
              </h4>
              <p className="text-[11px] text-dongho-paper/70">
                Show your notes or code snippet to Măng Non (Optional).
              </p>
            </div>

            {/* Photo Snapshot / Diff preview */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-warm-amber/60 bg-forest-darker">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Work output" className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-forest-abyss/80 text-dongho-paper"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-3 rounded-2xl bg-forest-darker hover:bg-forest-mist border border-dashed border-warm-amber/50 text-xs text-warm-glow flex flex-col items-center justify-center gap-1 transition"
                >
                  <Camera className="w-4 h-4 text-warm-amber" />
                  <span className="text-[10px] font-semibold">Snap photo of notes or code</span>
                </button>
              </div>
            )}

            {/* Note input */}
            <div>
              <label className="block text-[10px] text-dongho-paper/60 uppercase tracking-wider mb-1">
                A whisper to Măng Non (short note):
              </label>
              <input
                type="text"
                value={studyNote}
                onChange={(e) => setStudyNote(e.target.value)}
                placeholder="e.g. Solved 3 calculus questions / wrote sorting logic..."
                className="w-full px-3 py-2.5 rounded-xl bg-forest-darker border border-bamboo-mid/40 text-xs text-dongho-paper placeholder:text-dongho-paper/40 outline-none focus:border-warm-amber"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCompleteAndClose}
                className="flex-1 py-3 rounded-2xl bg-forest-darker border border-bamboo-mid/40 text-xs font-semibold text-dongho-paper/70"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitShowAndTell}
                disabled={isAnalyzing}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow hover:brightness-105 transition"
              >
                {isAnalyzing ? 'Looking warmly...' : 'Show Măng Non'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETED & COMPANION FEEDBACK */}
        {step === 4 && (
          <div className="mt-4 space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-forest-darker border-2 border-warm-amber flex items-center justify-center p-1 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mangnon?.imageUri || '/presets/figure1.png'}
                alt={mangnon?.name || 'Măng Non'}
                className="w-12 h-12 object-contain animate-bounce"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/40 shadow text-left">
              <span className="text-[10px] text-warm-amber font-bold uppercase tracking-wider block mb-1">
                {mangnon?.name || 'Măng Non'} whispers:
              </span>
              <p className="text-xs text-dongho-paper leading-relaxed italic">
                &quot;{aiFeedback}&quot;
              </p>
            </div>

            {/* Reward Badge */}
            <div className="p-3 rounded-2xl bg-forest-deep border border-bamboo-soft/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-warm-glow font-bold">
                <span>🍃</span>
                <span>+{isStudent ? '7.5' : '5'} Mam Luc</span>
              </div>
              <span className="text-[10px] text-bamboo-soft">Gifted to the Village Tree</span>
            </div>

            <button
              onClick={handleCompleteAndClose}
              className="w-full py-3 btn-woodblock text-xs"
            >
              Return to Bamboo Grove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

