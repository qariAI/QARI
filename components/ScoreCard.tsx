
import React from 'react';
import { FeedbackData } from '../types';

interface ScoreCardProps {
  data: FeedbackData;
  xpGained: number;
  id: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ data, xpGained, id }) => {
  return (
    <div
      id={id}
      className="w-[400px] bg-gradient-to-br from-emerald-900 to-teal-950 p-8 text-white relative overflow-hidden"
      style={{ fontFamily: 'serif' }}
    >
      {/* Decorative background elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-2xl font-bold">Q</div>
          <span className="text-2xl font-bold tracking-tight">QariAI</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-emerald-400 text-sm font-bold uppercase tracking-[0.2em]">Recitation Score</h2>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-7xl font-bold text-white">{data.tajweed_score}</span>
            <span className="text-xl text-emerald-500/60 font-bold">/100</span>
          </div>
        </div>

        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <span className="block text-[10px] text-emerald-400 font-bold uppercase mb-2 tracking-widest">Verse</span>
            <p className="font-arabic text-2xl leading-relaxed dir-rtl" dir="rtl">
              {data.quran_text_arabic}
            </p>
          </div>

          <div className="flex justify-between items-end border-t border-white/10 pt-4">
            <div className="text-left">
              <span className="block text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">XP Gained</span>
              <span className="text-xl font-bold">+{xpGained} XP</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">Surah : Ayah</span>
              <span className="text-lg font-bold">{data.surah_number}:{data.ayah_number}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 opacity-60 flex flex-col items-center">
          <p className="text-xs italic mb-1">"Verily, he who recites the Quran beautifully..."</p>
          <p className="text-[10px] font-bold">WWW.QARI.AI</p>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
