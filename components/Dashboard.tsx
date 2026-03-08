
import React from 'react';
import { UserStats, UserAnalytics } from '../types';
import { getUserAnalytics, getLevelProgress } from '../services/progressService';

interface DashboardProps {
  stats: UserStats;
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onClose }) => {
  const analytics = getUserAnalytics(stats);
  const progress = getLevelProgress(stats.totalXP);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">Your Progress</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl">✕</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-3xl border border-emerald-200 dark:border-emerald-800">👤</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Student of Quran</h3>
                {stats.isPremium && (
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Premium</span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{stats.proficiencyLevel} Level</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold mb-1">
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-tight">Level {stats.level}</span>
              <span className="text-emerald-600 dark:text-emerald-400">{Math.round(progress.current)} / {progress.required} XP</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Consistency</span>
            <div className="text-5xl font-serif font-bold mt-2 mb-1">{stats.streak}</div>
            <p className="text-emerald-100 font-medium">Day Streak!</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-20">🔥</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Avg Score', val: `${analytics.avg_score}%`, color: 'text-blue-600' },
          { label: 'Sessions', val: analytics.sessions_completed, color: 'text-purple-600' },
          { label: 'Total XP', val: stats.totalXP, color: 'text-emerald-600' },
          { label: 'Tries Today', val: `${stats.dailyUsageCount}${stats.isPremium ? '' : '/10'}`, color: 'text-amber-600' }
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* Improvement Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span>🎯</span> Weak Spots
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Letters to Practice</p>
              <div className="flex gap-2">
                {analytics.weak_letters.length > 0 ? analytics.weak_letters.map(l => (
                  <span key={l} className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg font-arabic text-lg border border-red-100 dark:border-red-900">{l}</span>
                )) : <span className="text-slate-400 text-sm italic">No data yet</span>}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Rules to Review</p>
              <div className="flex flex-wrap gap-2">
                {analytics.weak_rules.length > 0 ? analytics.weak_rules.map(r => (
                  <span key={r} className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded text-xs font-bold border border-amber-100 dark:border-amber-800">{r}</span>
                )) : <span className="text-slate-400 text-sm italic">Keep reciting!</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span>📈</span> Performance Trend
          </h4>
          <div className="flex items-center justify-center h-24">
             <div className="text-center">
                <div className={`text-3xl font-bold ${analytics.improvement_rate.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {analytics.improvement_rate}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-tight font-bold mt-1">Improvement Rate</p>
             </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
            Based on your last 10 recitations compared to the previous 10.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
