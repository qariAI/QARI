
import React, { useState, useEffect, useRef } from 'react';
import { FeedbackData, Mistake, MistakeCategory } from '../types';

interface FeedbackProps {
  data: FeedbackData;
  onReset: () => void;
  xpGained?: number;
  userAudioUrl?: string | null;
  onAddToHifz?: (data: FeedbackData) => void;
  isHifzMode?: boolean;
  isAutoSaved?: boolean;
}

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
    let colorClass = "bg-slate-100 text-slate-700";
    if (category === 'Makharij') colorClass = "bg-red-100 text-red-700 border-red-200";
    else if (category === 'Timing') colorClass = "bg-blue-100 text-blue-700 border-blue-200";
    else if (category === 'Sifaat') colorClass = "bg-purple-100 text-purple-700 border-purple-200";
    else if (category === 'Memory') colorClass = "bg-amber-100 text-amber-700 border-amber-200";

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {category}
        </span>
    );
};

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max, colorClass }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mb-2" dir="ltr">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-bold text-slate-700 dark:text-slate-200">{Math.round(value)}/{max}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${colorClass}`} 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const CoachingDetailCard = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3 transition-colors" dir="ltr">
    <span className="text-lg bg-white dark:bg-slate-800 p-1.5 rounded-md shadow-sm border border-emerald-50 dark:border-emerald-900/20 select-none">{icon}</span>
    <div>
      <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide mb-0.5">
        {label}
      </span>
      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed block">{value}</span>
    </div>
  </div>
);

const Feedback: React.FC<FeedbackProps> = ({ data, onReset, xpGained, userAudioUrl, onAddToHifz, isHifzMode, isAutoSaved }) => {
  const [selectedMistake, setSelectedMistake] = useState<number | null>(null);
  const [hifzSaved, setHifzSaved] = useState(isAutoSaved || false);
  const [filterCategory, setFilterCategory] = useState<MistakeCategory | 'All'>('All');
  const [isTextRevealed, setIsTextRevealed] = useState(!isHifzMode);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wordTimings, setWordTimings] = useState<number[][]>([]);
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mistakes = data.mistakes || [];
  const breakdown = data.score_breakdown || {
    makharij: 30, madd_timing: 20, ghunnah: 15, qalqalah: 10,
    tafkheem_tarqeeq: 10, shaddah: 10, flow_breath: 5
  };

  const isNoRecitation = mistakes.some(m => m.issue?.includes("No authentic") || m.verse_word === "N/A");
  const finalScore = isNoRecitation ? 0 : data.tajweed_score;

  const pad = (num: number) => num.toString().padStart(3, '0');
  
  useEffect(() => {
    if (data.surah_number && data.ayah_number && !isNoRecitation) {
      const fetchAudioData = async () => {
        try {
          const response = await fetch(`https://api.quran.com/api/v4/recitations/7/by_ayah/${data.surah_number}:${data.ayah_number}`);
          const json = await response.json();
          if (json.audio_files?.length > 0) {
            const file = json.audio_files[0];
            let url = file.url.startsWith('http') ? file.url : `https:${file.url}`;
            setAudioUrl(url);
            if (file.segments) setWordTimings(file.segments.map((s: any) => [s[0], s[1]]));
          } else {
            setAudioUrl(`https://everyayah.com/data/Mishary_Rashid_Alafasy_128kbps/${pad(data.surah_number)}${pad(data.ayah_number)}.mp3`);
          }
        } catch (err) {
          setAudioUrl(`https://everyayah.com/data/Mishary_Rashid_Alafasy_128kbps/${pad(data.surah_number)}${pad(data.ayah_number)}.mp3`);
        }
      };
      fetchAudioData();
    }
  }, [data.surah_number, data.ayah_number, isNoRecitation]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || wordTimings.length === 0) return;
    const currentTimeMs = audioRef.current.currentTime * 1000;
    const idx = wordTimings.findIndex(([start, end]) => currentTimeMs >= start && currentTimeMs <= end);
    if (idx !== -1) setActiveWordIdx(idx);
  };

  const playReferenceFromWord = (idx: number) => {
    if (audioRef.current) {
        audioRef.current.pause();
        if (wordTimings[idx]) {
            audioRef.current.currentTime = wordTimings[idx][0] / 1000;
        } else {
            audioRef.current.currentTime = 0;
        }
        audioRef.current.play().catch(e => console.error("Audio Play Error:", e));
        setActiveWordIdx(idx);
    }
  };

  const renderArabicText = () => {
    if (!data.quran_text_arabic || isNoRecitation) return null;
    const tokens = data.quran_text_arabic.split(' ');

    return (
      <div className={`text-center mb-6 px-4 transition-all duration-700 ${!isTextRevealed ? 'filter blur-md select-none opacity-50' : 'filter-none opacity-100'}`} dir="rtl">
        <div className="inline-block text-3xl md:text-4xl leading-loose font-arabic text-slate-900 dark:text-white">
          {tokens.map((word, wordIdx) => {
            const wordMistakes = mistakes.filter(m => m.verse_word === word);
            const primaryMistake = wordMistakes[0];
            const isActive = activeWordIdx === wordIdx;

            let className = "relative inline-block rounded transition-all duration-200 cursor-pointer select-none mx-1 px-1.5 ";

            if (isActive) {
                className += "text-emerald-700 bg-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-900/30 scale-105 font-bold ";
            }

            if (primaryMistake) {
                if (primaryMistake.category === 'Memory') {
                    if (primaryMistake.hifz_error_type === 'OMISSION') {
                        className += "bg-red-50 dark:bg-red-950/40 text-red-600 underline decoration-red-400 decoration-wavy ";
                    } else {
                        className += "bg-amber-50 dark:bg-amber-950/40 text-amber-600 underline decoration-amber-400 ";
                    }
                } else {
                    let tajweedColor = "decoration-blue-400 text-blue-600";
                    if (primaryMistake.category === 'Makharij') tajweedColor = "decoration-red-400 text-red-600";
                    className += `underline decoration-2 underline-offset-8 ${tajweedColor} `;
                }
            }

            return (
              <span
                key={wordIdx}
                className={className}
                onClick={(e) => {
                    e.stopPropagation();
                    if (wordMistakes.length > 0) {
                        const mIdx = mistakes.indexOf(primaryMistake);
                        setSelectedMistake(mIdx);
                    }
                    playReferenceFromWord(wordIdx);
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8 pb-20 animate-fade-in-up" dir="ltr">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setActiveWordIdx(null)}
          className="hidden"
          crossOrigin="anonymous"
        />
      )}

      <div className="flex justify-between items-center px-4">
        <button onClick={onReset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">✕</button>
        <h2 className="text-xl font-serif font-bold text-emerald-900 dark:text-emerald-500">Analysis Result</h2>
        <div className="flex gap-2">
           {isHifzMode && onAddToHifz && (
             <button
               onClick={() => { onAddToHifz(data); setHifzSaved(true); }}
               disabled={hifzSaved}
               className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${hifzSaved ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
             >
               {hifzSaved ? '✓ Saved' : '💾 Save'}
             </button>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 p-6 md:p-8 relative overflow-hidden">
          {!isTextRevealed && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 dark:bg-slate-950/30 backdrop-blur-[2px] cursor-pointer" onClick={() => setIsTextRevealed(true)}>
               <div className="bg-teal-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transform hover:scale-105 transition-transform">👁️ Reveal Correct Ayah</div>
            </div>
          )}
          {renderArabicText()}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 italic mt-4">💡 Tap words to compare with reference audio</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
         <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">📊 Tajweed Accuracy</h3>
             <div className="text-right"><span className="text-3xl font-bold text-emerald-600">{finalScore}</span><span className="text-sm text-slate-400">/100</span></div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <ProgressBar label="Makharij (Exit Points)" value={breakdown.makharij} max={30} colorClass="bg-red-500" />
            <ProgressBar label="Madd & Timing" value={breakdown.madd_timing} max={20} colorClass="bg-blue-500" />
            <ProgressBar label="Ghunnah (Nasalization)" value={breakdown.ghunnah} max={15} colorClass="bg-indigo-500" />
            <ProgressBar label="Qalqalah (Echoing)" value={breakdown.qalqalah} max={10} colorClass="bg-purple-500" />
         </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-2 flex items-center gap-2">
          <span>🎯</span> Detailed Coaching
        </h3>
        {isNoRecitation ? (
          <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-center">
            <p className="text-red-700 dark:text-red-400 font-bold mb-1">Could Not Hear Recitation</p>
            <p className="text-red-600/80 dark:text-red-500/80 text-sm italic">Please recite clearly in a quiet environment.</p>
          </div>
        ) : (
          mistakes.map((mistake, idx) => (
            <div key={idx} id={`mistake-${idx}`} className={`bg-white dark:bg-slate-900 border transition-all duration-300 rounded-xl p-5 shadow-sm ${selectedMistake === idx ? 'ring-2 ring-emerald-500 border-transparent shadow-lg' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <span className="font-arabic text-2xl text-slate-900 dark:text-white" dir="rtl">{mistake.verse_word}</span>
                    <div dir="ltr"><CategoryBadge category={mistake.category} /></div>
                </div>
                <div className={`w-3 h-3 rounded-full ${mistake.severity === 'Major' ? 'bg-red-500' : 'bg-orange-400'}`}></div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-4">"{mistake.issue}"</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <CoachingDetailCard icon="👄" label="Mouth Shape" value={mistake.coaching_details?.mouth_shape || "Follow drill below"} />
                <CoachingDetailCard icon="👅" label="Tongue Position" value={mistake.coaching_details?.tongue_position || "Follow drill below"} />
              </div>
              <div className="bg-emerald-900 text-white p-4 rounded-xl text-sm leading-relaxed" dir="ltr">
                 <span className="font-bold text-emerald-400 uppercase text-[10px] block mb-1 tracking-widest">Correction Drill</span>
                 {mistake.practice_tip}
              </div>
            </div>
          ))
        )}
      </div>

      <button onClick={onReset} className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all transform active:scale-95">Recite Another Ayah</button>
    </div>
  );
};

export default Feedback;
