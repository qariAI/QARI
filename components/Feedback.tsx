
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
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-700">{Math.round(value)}/{max}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${colorClass}`} 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const CoachingDetailCard = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex items-start gap-3 transition-colors hover:bg-emerald-50/80">
    <span className="text-lg bg-white p-1.5 rounded-md shadow-sm border border-emerald-50 select-none">{icon}</span>
    <div>
      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-0.5">
        {label}
      </span>
      <span className="text-xs text-slate-700 font-medium leading-relaxed block">{value}</span>
    </div>
  </div>
);

const Feedback: React.FC<FeedbackProps> = ({ data, onReset, xpGained, userAudioUrl, onAddToHifz, isHifzMode, isAutoSaved }) => {
  const [selectedMistake, setSelectedMistake] = useState<number | null>(null);
  const [hifzSaved, setHifzSaved] = useState(isAutoSaved || false);
  const [filterCategory, setFilterCategory] = useState<MistakeCategory | 'All'>('All');
  const [isTextRevealed, setIsTextRevealed] = useState(!isHifzMode); // Blur by default in Hifz mode
  
  // Update state if prop changes
  useEffect(() => {
    if (isAutoSaved) setHifzSaved(true);
  }, [isAutoSaved]);

  // Audio Synchronization State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wordTimings, setWordTimings] = useState<number[][]>([]); // Array of [startMs, endMs]
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to pad numbers for EveryAyah URL: e.g. 1 -> 001
  const pad = (num: number) => num.toString().padStart(3, '0');
  
  // Fetch Audio and Timings from Quran.com (Mishary Rashid Alafasy - Reciter 7)
  useEffect(() => {
    if (data.surah_number && data.ayah_number) {
      const fetchAudioData = async () => {
        try {
          const response = await fetch(`https://api.quran.com/api/v4/recitations/7/by_ayah/${data.surah_number}:${data.ayah_number}`);
          const json = await response.json();
          
          if (json.audio_files && json.audio_files.length > 0) {
            const file = json.audio_files[0];
            setAudioUrl(file.url); // Use Quran.com audio to match timings
            
            // Transform segments: [start, end, segmentIdx] -> sort by segmentIdx just in case
            if (file.segments) {
               const timings = file.segments.map((s: any) => [s[0], s[1]]); // Keep ms
               setWordTimings(timings);
            }
          } else {
            // Fallback to EveryAyah
            setAudioUrl(`https://everyayah.com/data/Mishary_Rashid_Alafasy_128kbps/${pad(data.surah_number)}${pad(data.ayah_number)}.mp3`);
          }
        } catch (err) {
          console.error("Failed to fetch audio timings", err);
          setAudioUrl(`https://everyayah.com/data/Mishary_Rashid_Alafasy_128kbps/${pad(data.surah_number)}${pad(data.ayah_number)}.mp3`);
        }
      };
      
      fetchAudioData();
    }
  }, [data.surah_number, data.ayah_number]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || wordTimings.length === 0) return;
    
    const currentTimeMs = audioRef.current.currentTime * 1000;
    
    // Find active word
    const idx = wordTimings.findIndex(([start, end]) => currentTimeMs >= start && currentTimeMs <= end);
    
    if (idx !== -1 && idx !== activeWordIdx) {
      setActiveWordIdx(idx);
    } else if (idx === -1 && activeWordIdx !== null) {
      if (currentTimeMs > wordTimings[wordTimings.length - 1][1] || currentTimeMs < wordTimings[0][0]) {
         setActiveWordIdx(null);
      }
    }
  };

  const handleSaveHifz = () => {
    if (onAddToHifz) {
        onAddToHifz(data);
        setHifzSaved(true);
    }
  };

  const renderArabicText = () => {
    if (!data.quran_text_arabic) return null;

    const text = data.quran_text_arabic;
    // Map each character index to a mistake index (or -1 if no mistake)
    const charMap = new Array(text.length).fill(-1);

    data.mistakes.forEach((mistake, mistakeIndex) => {
      const searchStr = mistake.verse_word.trim();
      if (!searchStr) return;

      let startIndex = 0;
      while (startIndex < text.length) {
        const foundIndex = text.indexOf(searchStr, startIndex);
        if (foundIndex === -1) break;

        let isFree = true;
        for (let i = 0; i < searchStr.length; i++) {
          if (charMap[foundIndex + i] !== -1) {
            isFree = false;
            break;
          }
        }

        if (isFree) {
          for (let i = 0; i < searchStr.length; i++) {
            charMap[foundIndex + i] = mistakeIndex;
          }
          break;
        } else {
          startIndex = foundIndex + 1;
        }
      }
    });

    const tokens = text.split(' ');
    let charCursor = 0;

    return (
      <div className={`text-center mb-6 px-4 transition-all duration-700 ${!isTextRevealed ? 'filter blur-md select-none opacity-50' : 'filter-none opacity-100'}`} dir="rtl">
        <div className="inline-block text-3xl md:text-4xl leading-loose font-arabic text-slate-900">
          {tokens.map((word, wordIdx) => {
            const startIdx = text.indexOf(word, charCursor);
            if (startIdx === -1) return <span key={wordIdx}>{word} </span>;
            
            charCursor = startIdx + word.length;

            let mistakeIdx = -1;
            for (let i = startIdx; i < startIdx + word.length; i++) {
                if (charMap[i] !== -1) {
                    mistakeIdx = charMap[i];
                    break;
                }
            }

            const mistake = mistakeIdx !== -1 ? data.mistakes[mistakeIdx] : null;
            const isSelected = selectedMistake === mistakeIdx;
            const isActive = activeWordIdx === wordIdx;

            let className = "relative inline-block rounded transition-all duration-200 cursor-pointer select-none mx-0.5 px-1 ";

            if (isActive) {
                className += "text-emerald-700 bg-emerald-100/50 scale-105 font-bold "; 
            }

            if (mistake) {
                if (mistake.category === 'Memory') {
                    // Specific Hifz Error Styling
                    if (mistake.hifz_error_type === 'OMISSION') {
                        // Missing word: Highlight distinctly (e.g., Red background to show "This was missing")
                        className += "bg-red-50 text-red-600 decoration-red-400 decoration-wavy underline decoration-2 ";
                    } else if (mistake.hifz_error_type === 'SUBSTITUTION') {
                         className += "text-amber-600 decoration-amber-400 decoration-wavy underline decoration-2 ";
                    } else {
                         className += "decoration-amber-300 text-amber-600 underline decoration-2 underline-offset-8 ";
                    }
                } else {
                    // Regular Tajweed Error Styling
                    let underlineColor = "decoration-yellow-300 text-yellow-600";
                    if (mistake.category === 'Makharij') underlineColor = "decoration-red-300 text-red-600";
                    else if (mistake.category === 'Timing') underlineColor = "decoration-blue-300 text-blue-600";
                    else if (mistake.category === 'Sifaat') underlineColor = "decoration-purple-300 text-purple-600";
                    
                    className += `underline decoration-2 underline-offset-8 ${underlineColor} `;
                }

                if (isSelected) {
                   className += "ring-2 ring-emerald-400 bg-white z-10 shadow-md animate-gentle-pulse ";
                   // Override text color for readability when selected
                   className += "text-slate-900 "; 
                } else if (!isActive) {
                   className += "hover:bg-slate-50 ";
                }
            }

            return (
              <span 
                key={wordIdx} 
                className={className}
                onClick={(e) => {
                  if (mistake) {
                    e.stopPropagation();
                    setSelectedMistake(isSelected ? null : mistakeIdx);
                  }
                }}
              >
                {word}{' '}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const hasSevereMistakes = data.mistakes.some(m => m.severity === 'Major' || m.severity === 'Moderate');
  const showHifzButton = onAddToHifz && data.surah_number > 0 && data.ayah_number > 0 && (hifzSaved || !hasSevereMistakes);

  const filteredMistakes = filterCategory === 'All' 
    ? data.mistakes 
    : data.mistakes.filter(m => m.category === filterCategory);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8 pb-20 animate-fade-in-up">
      {/* Header */}
      <div className="text-center relative">
        <div className="flex justify-center items-center gap-2 mb-2">
            <h2 className="text-2xl font-serif text-emerald-900">Analysis Result</h2>
            {isHifzMode && <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-teal-200">Hifz Mode</span>}
        </div>
        
        {xpGained !== undefined && (
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full border border-amber-200 text-sm font-bold shadow-sm animate-pulse mb-4">
            <span>⭐</span>
            <span>+{xpGained} XP Earned</span>
          </div>
        )}
      </div>

      {/* Auto-Save Success Banner */}
      {isAutoSaved && (
         <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm mb-6 flex items-start gap-3 animate-fade-in-up mx-2 md:mx-0">
             <div className="text-emerald-500 text-xl">✨</div>
             <div>
                <h4 className="font-bold text-emerald-800">Memorization Logged Automatically!</h4>
                <p className="text-sm text-emerald-700">Great job! Since there were no major errors, we've saved this to your Hifz progress.</p>
             </div>
         </div>
      )}

      {/* Hifz Feedback Banner */}
      {isHifzMode && data.hifz_feedback && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 shadow-sm text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-6xl">🧠</span>
             </div>
             <h3 className="text-teal-900 font-serif font-bold text-lg mb-2 flex items-center justify-center gap-2">
                <span>🧠</span> Memorization Assessment
             </h3>
             <p className="text-teal-800 font-medium text-lg">
                {data.hifz_feedback}
             </p>
        </div>
      )}

      {/* Visual Verse Overlay */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200"></div>
        
        {/* Smart Blur Toggle for Hifz */}
        {!isTextRevealed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[2px] cursor-pointer" onClick={() => setIsTextRevealed(true)}>
             <div className="bg-teal-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transform transition hover:scale-105 flex items-center gap-2">
                <span>👁️</span> Reveal Text
             </div>
             <p className="mt-2 text-xs font-bold text-teal-800 bg-white/80 px-2 py-1 rounded">Test your memory first!</p>
          </div>
        )}

        <div className="mb-2 text-center flex justify-center items-center gap-4">
             {/* Dynamic legend based on mode */}
             {isHifzMode ? (
                 <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> Missing Word
                 </div>
             ) : (
                <>
                 <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> Makharij
                 </div>
                 <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Timing
                 </div>
                 <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span> Sifaat
                 </div>
                </>
             )}
        </div>
        
        {renderArabicText()}
        
        <div className={`text-center mt-6 space-y-2 transition-opacity duration-500 ${!isTextRevealed ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-lg text-slate-600 font-serif italic">"{data.quran_text_transliteration}"</p>
            <p className="text-sm text-slate-500">{data.quran_text_translation}</p>
        </div>
      </div>

       {/* Hifz Action Button */}
       {showHifzButton && (
          <div className="flex justify-center -mt-4 mb-4 relative z-10">
              <button 
                  onClick={handleSaveHifz}
                  disabled={hifzSaved}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full shadow-md font-bold transition-all transform hover:scale-105
                    ${hifzSaved 
                        ? 'bg-teal-100 text-teal-800 cursor-default border border-teal-200' 
                        : 'bg-teal-600 text-white hover:bg-teal-700 border border-teal-500'}
                  `}
              >
                  {hifzSaved ? (
                      <><span>✅</span> {isAutoSaved ? "Auto-Logged to Journey" : "Logged to Hifz Journey"}</>
                  ) : (
                      <><span>🧠</span> {isHifzMode ? "Log Revision" : "Mark as Memorized"}</>
                  )}
              </button>
          </div>
       )}
      
      {/* Score Breakdown Section */}
      {data.score_breakdown && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
           <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-slate-800">
                  <span className="mr-2 text-xl">📊</span> {isHifzMode ? "Memory Accuracy" : "Tajweed Score"}
               </h3>
               <div className="text-right">
                  <span className="text-3xl font-bold text-emerald-600">{data.tajweed_score || 0}</span>
                  <span className="text-sm text-slate-400">/100</span>
               </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <ProgressBar label="Makharij (Articulation)" value={data.score_breakdown.makharij} max={30} colorClass="bg-red-500" />
              <ProgressBar label="Madd Timing" value={data.score_breakdown.madd_timing} max={20} colorClass="bg-blue-500" />
              <ProgressBar label="Ghunnah" value={data.score_breakdown.ghunnah} max={15} colorClass="bg-indigo-500" />
              <ProgressBar label="Qalqalah" value={data.score_breakdown.qalqalah} max={10} colorClass="bg-purple-500" />
              <ProgressBar label="Tafkheem/Tarqeeq" value={data.score_breakdown.tafkheem_tarqeeq} max={10} colorClass="bg-orange-500" />
              <ProgressBar label="Shaddah" value={data.score_breakdown.shaddah} max={10} colorClass="bg-amber-500" />
              <ProgressBar label="Flow & Breath" value={data.score_breakdown.flow_breath} max={5} colorClass="bg-teal-500" />
           </div>
        </div>
      )}

      {/* Audio Comparison Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="flex items-center text-lg font-bold text-slate-800 mb-4">
          <span className="mr-2 text-xl">🎧</span> Listen & Compare
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* User Audio */}
          {userAudioUrl && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Your Recitation</span>
                 <a 
                   href={userAudioUrl} 
                   download={`qariai-recitation-${Date.now()}.webm`}
                   className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                   title="Download Recording"
                 >
                    ⬇️ Save
                 </a>
              </div>
              <audio controls src={userAudioUrl} className="w-full h-8" />
            </div>
          )}

          {/* Reference Audio */}
          {audioUrl ? (
            <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-100 text-[10px] text-emerald-800 font-bold rounded-bl-lg">
                Mishary Rashid Alafasy
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Reference Recitation</span>
              <audio 
                ref={audioRef}
                controls 
                src={audioUrl} 
                className="w-full h-8" 
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          ) : (
             <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-center text-sm text-slate-400 italic">
               Reference audio loading...
             </div>
          )}
        </div>
      </div>

      {/* Areas to Improve */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
            <h3 className="flex items-center text-lg font-bold text-slate-800">
                <span className="mr-2 text-xl">❌</span> Areas to Improve
            </h3>
            
            {/* Filter Tabs */}
            {data.mistakes.length > 0 && (
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                    {['All', 'Makharij', 'Timing', 'Sifaat', 'Memory'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat as MistakeCategory | 'All')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${filterCategory === cat ? 'bg-white shadow text-emerald-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {data.mistakes.length === 0 ? (
          <div className="p-6 bg-white border border-emerald-200 rounded-xl text-center">
            <p className="text-emerald-700 font-medium">Ma sha Allah! No major errors detected.</p>
          </div>
        ) : filteredMistakes.length === 0 ? (
           <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No mistakes found in this category.
           </div>
        ) : (
          filteredMistakes.map((mistake, idx) => {
            // Re-find original index for selection state to work correctly if filtered
            const originalIdx = data.mistakes.indexOf(mistake);
            
            return (
            <div 
              key={idx} 
              id={`mistake-${originalIdx}`}
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all duration-300 cursor-pointer 
                ${selectedMistake === originalIdx ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'border-slate-200 hover:border-emerald-200'}
              `}
              onClick={() => setSelectedMistake(originalIdx === selectedMistake ? null : originalIdx)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <span className="font-arabic text-2xl text-slate-900 leading-none" dir="rtl">{mistake.verse_word}</span>
                    <div>
                        <span className="text-lg font-bold text-emerald-700 block">{mistake.letter}</span>
                        <div className="flex gap-2 items-center flex-wrap">
                             <CategoryBadge category={mistake.category} />
                             {mistake.hifz_error_type && mistake.hifz_error_type !== 'NONE' && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                    {mistake.hifz_error_type}
                                </span>
                             )}
                             <span className="text-xs text-slate-500">{mistake.rule}</span>
                        </div>
                    </div>
                </div>
                {/* Severity Dot */}
                 <div className={`w-3 h-3 rounded-full ${mistake.severity === 'Major' ? 'bg-red-500' : mistake.severity === 'Moderate' ? 'bg-orange-400' : 'bg-yellow-400'}`} title={mistake.severity}></div>
              </div>

              {/* Phoneme Mismatch Summary */}
              <div className="flex items-center gap-2 mb-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm">
                  <div className="flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected</span>
                      <span className="font-mono text-emerald-700 font-bold">{mistake.expected_ipa}</span>
                  </div>
                  <div className="text-slate-300">➜</div>
                  <div className="flex-1 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">You Said</span>
                      <span className="font-mono text-red-600 font-bold">{mistake.user_ipa}</span>
                  </div>
              </div>
              
              {/* Granular Nuance Badge */}
              {mistake.rule_nuance && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-md border border-amber-100">
                    <span>💡</span> {mistake.rule_nuance}
                  </span>
                </div>
              )}

              <div className={`space-y-4 overflow-hidden transition-all duration-300 ${selectedMistake === originalIdx ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                
                {/* Issue Description */}
                <p className="text-slate-700 text-sm italic border-l-2 border-emerald-200 pl-3">"{mistake.issue}"</p>

                {/* Coaching Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CoachingDetailCard 
                    icon="👄" 
                    label="Mouth Shape" 
                    value={mistake.coaching_details.mouth_shape} 
                  />
                  <CoachingDetailCard 
                    icon="👅" 
                    label="Tongue Position" 
                    value={mistake.coaching_details.tongue_position} 
                  />
                  <CoachingDetailCard 
                    icon="💨" 
                    label="Airflow" 
                    value={mistake.coaching_details.airflow} 
                  />
                  <CoachingDetailCard 
                    icon="⏱️" 
                    label="Duration" 
                    value={mistake.coaching_details.duration} 
                  />
                </div>

                {/* Drill */}
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md">
                   <div className="flex items-center gap-2 mb-2">
                       <span className="text-lg">🏋️‍♂️</span>
                       <span className="font-bold text-xs uppercase tracking-wide">Correction Drill</span>
                   </div>
                   <p className="text-sm text-slate-200 leading-relaxed">{mistake.practice_tip}</p>
                </div>

              </div>

               {selectedMistake !== originalIdx && (
                   <p className="text-xs text-slate-400 text-center mt-2">Tap to see coaching details</p>
               )}
            </div>
          )})
        )}
      </div>

      {/* Daily Practice */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-xl p-6 shadow-lg">
        <h3 className="flex items-center text-lg font-bold mb-3">
          <span className="mr-2 text-xl">🎯</span> Daily Practice Suggestion
        </h3>
        <p className="text-emerald-100 leading-relaxed">
          {data.daily_practice}
        </p>
      </div>

      <button 
        onClick={onReset}
        className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium shadow-lg hover:bg-slate-800 transition-colors"
      >
        Start New Recitation
      </button>
    </div>
  );
};

export default Feedback;
