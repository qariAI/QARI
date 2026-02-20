
import React, { useState } from 'react';
import { UserGoals } from '../types';

interface GoalSetterProps {
  currentGoals: UserGoals;
  onSave: (goals: UserGoals) => void;
  onClose: () => void;
}

const GoalSetter: React.FC<GoalSetterProps> = ({ currentGoals, onSave, onClose }) => {
  const [dailyMinutes, setDailyMinutes] = useState(currentGoals.dailyMinutes);
  const [weeklyAyahs, setWeeklyAyahs] = useState(currentGoals.weeklyAyahs);

  const handleSave = () => {
    onSave({ dailyMinutes, weeklyAyahs });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in-up backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">🎯</span>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Set Your Intentions</h2>
          <p className="text-slate-500 text-sm mt-1">"The most beloved deed to Allah is the most regular and constant even if it were little."</p>
        </div>

        <div className="space-y-6">
          {/* Daily Time Goal */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
              <span>Daily Practice Time</span>
              <span className="text-emerald-600">{dailyMinutes} mins</span>
            </label>
            <input 
              type="range" 
              min="5" 
              max="60" 
              step="5"
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium uppercase">
              <span>5m</span>
              <span>1h</span>
            </div>
          </div>

          {/* Weekly Memorization Goal */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
              <span>New Ayahs per Week</span>
              <span className="text-teal-600">{weeklyAyahs} ayahs</span>
            </label>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setWeeklyAyahs(Math.max(1, weeklyAyahs - 1))}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-lg text-slate-800">
                  {weeklyAyahs}
                </div>
                <button 
                  onClick={() => setWeeklyAyahs(Math.min(50, weeklyAyahs + 1))}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold"
                >
                  +
                </button>
             </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-transform active:scale-95 shadow-md"
          >
            Update Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalSetter;
