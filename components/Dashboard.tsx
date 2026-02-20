
import React, { useState } from 'react';
import { UserStats, SessionRecord, HifzEntry, UserAnalytics, Drill } from '../types';
import { getLevelProgress, getDueRevisions, getUserAnalytics } from '../services/progressService';
import { generatePracticeDrills } from '../services/geminiService';
import Sparkline from './Sparkline';

interface DashboardProps {
  stats: UserStats;
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hifz' | 'analytics'>('overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [isGeneratingDrills, setIsGeneratingDrills] = useState(false);
  
  const levelProgress = getLevelProgress(stats.totalXP);
  const { current, required, percent } = levelProgress;
  const dueRevisions = getDueRevisions(stats);
  const analytics = getUserAnalytics(stats);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGenerateDrills = async (weakRule: string) => {
    setIsGeneratingDrills(true);
    try {
      const generated = await generatePracticeDrills(weakRule);
      setDrills(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingDrills(false);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(stats, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qariai-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Level Circle */}
      <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
        
        <div className="flex items-center space-x-6 relative z-10">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            {/* Circular Progress Background */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-emerald-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs text-slate-500 font-bold uppercase">Level</span>
              <span className="text-3xl font-serif font-bold text-emerald-800">{stats.level}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-serif text-slate-800 font-bold truncate">Your Journey</h2>
            <div className="mt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>{Math.round(current)} XP</span>
                <span>{Math.round(required)} XP to Level {stats.level + 1}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
              </div>
            </div>
            
            <button 
              onClick={handleExportData}
              className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 hover:text-emerald-600 transition-colors"
            >
              📥 Backup Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-100 text-center">
          <span className="text-2xl block mb-1">🔥</span>
          <span className="text-lg font-bold text-amber-700">{stats.streak}</span>
          <span className="block text-[10px] text-amber-800/70 font-semibold uppercase tracking-wider">Day Streak</span>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
          <span className="text-2xl block mb-1">🎤</span>
          <span className="text-lg font-bold text-slate-700">{stats.totalSessions}</span>
          <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Recitations</span>
        </div>

        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
          <span className="text-2xl block mb-1">⭐</span>
          <span className="text-lg font-bold text-emerald-700">{stats.totalXP}</span>
          <span className="block text-[10px] text-emerald-800/70 font-semibold uppercase tracking-wider">Total XP</span>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Recent Sessions</h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {stats.history.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No sessions yet. Start reciting to earn XP!</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {stats.history.map((session: SessionRecord) => (
                <div key={session.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 truncate">{session.surah_ayah}</p>
                      {session.is_hifz && <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full font-bold">HIFZ</span>}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-emerald-600 font-bold text-sm block">+{session.xp_gained} XP</span>
                    {session.mistakes_count > 0 ? (
                        <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">{session.mistakes_count} mistakes</span>
                    ) : (
                        <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">Perfect</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 animate-fade-in-up">
      {/* Analytics Summary Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 p-6">
        <h2 className="text-2xl font-serif text-slate-800 font-bold mb-6 flex items-center">
            <span className="mr-2">📈</span> Performance Analytics
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider block mb-1">Avg Score</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-indigo-800">{analytics.avg_score}</span>
                    <span className="text-sm text-indigo-400">/100</span>
                </div>
             </div>
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <span className="text-xs text-purple-500 font-bold uppercase tracking-wider block mb-1">Improvement</span>
                <span className={`text-3xl font-bold ${analytics.improvement_rate.includes('+') ? 'text-green-600' : 'text-purple-800'}`}>
                    {analytics.improvement_rate}
                </span>
             </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
             <div className="flex justify-between text-sm text-slate-600 mb-2">
                 <span>Current Level</span>
                 <span className="font-bold text-slate-900">{analytics.current_level}</span>
             </div>
             <div className="flex justify-between text-sm text-slate-600 mb-2">
                 <span>Last Practice</span>
                 <span className="font-bold text-slate-900">
                    {analytics.last_practice === "Never" 
                        ? "Never" 
                        : new Date(analytics.last_practice).toLocaleDateString()}
                 </span>
             </div>
             <div className="flex justify-between text-sm text-slate-600">
                 <span>Sessions</span>
                 <span className="font-bold text-slate-900">{analytics.sessions_completed}</span>
             </div>
        </div>
      </div>

      {/* Weak Areas */}
      <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
             <h3 className="text-sm font-bold text-red-800 uppercase tracking-widest mb-4 flex items-center">
                 <span className="mr-2">⚠️</span> Needs Focus (Letters)
             </h3>
             {analytics.weak_letters.length === 0 ? (
                 <p className="text-slate-400 text-sm italic">Keep practicing to identify weak spots.</p>
             ) : (
                 <div className="flex flex-wrap gap-2">
                     {analytics.weak_letters.map(letter => (
                         <span key={letter} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-lg font-arabic border border-red-200">
                             {letter}
                         </span>
                     ))}
                 </div>
             )}
          </div>

          <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
             <h3 className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-4 flex items-center">
                 <span className="mr-2">🛠️</span> Needs Focus (Rules)
             </h3>
             {analytics.weak_rules.length === 0 ? (
                 <p className="text-slate-400 text-sm italic">Keep practicing to identify rule gaps.</p>
             ) : (
                 <div className="flex flex-col gap-2">
                     {analytics.weak_rules.map(rule => (
                         <div key={rule} className="px-3 py-2 bg-orange-50 text-orange-800 rounded-lg text-xs font-bold border border-orange-200">
                             {rule}
                         </div>
                     ))}
                     
                     {/* Drill Generator Button */}
                     {analytics.weak_rules.length > 0 && drills.length === 0 && (
                        <button 
                          onClick={() => handleGenerateDrills(analytics.weak_rules[0])}
                          disabled={isGeneratingDrills}
                          className="mt-2 w-full py-2 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-orange-200 transition-colors flex justify-center items-center"
                        >
                           {isGeneratingDrills ? (
                             <span className="animate-pulse">Creating Drills...</span>
                           ) : (
                             <><span>⚡</span> Generate Drills for "{analytics.weak_rules[0]}"</>
                           )}
                        </button>
                     )}
                 </div>
             )}
          </div>
      </div>

      {/* Drill Results */}
      {drills.length > 0 && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl animate-fade-in-up">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                 <span className="mr-2 text-xl">⚡</span> Targeted Drills
              </h3>
              <button onClick={() => setDrills([])} className="text-xs text-slate-400 hover:text-white">Close</button>
           </div>
           
           <div className="grid gap-4">
              {drills.map((drill, idx) => (
                <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-emerald-400">{drill.title}</h4>
                      <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300 font-mono">
                        {drill.duration_seconds}s • {drill.reps} reps
                      </span>
                   </div>
                   <p className="text-sm text-slate-300 leading-relaxed">{drill.instructions}</p>
                   <div className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Focus: {drill.focus_rule}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );

  const renderHifz = () => (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hifz Summary */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-serif font-bold mb-1">Hifz Journey</h2>
          <p className="text-teal-100 text-sm mb-6">Memorize to keep the Qur'an in your heart.</p>
          
          <div className="flex gap-8">
            <div>
              <span className="text-3xl font-bold block">{stats.hifzProgress.length}</span>
              <span className="text-xs text-teal-200 uppercase tracking-wide">Ayahs Memorized</span>
            </div>
            <div>
              <span className="text-3xl font-bold block">{dueRevisions.length}</span>
              <span className="text-xs text-teal-200 uppercase tracking-wide">Due for Revision</span>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        </div>
      </div>

      {/* Due Today */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center">
            <span className="mr-2">📅</span> Due for Revision
        </h3>
        {dueRevisions.length === 0 ? (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 text-center">
                <p className="text-teal-800 font-medium">All caught up!</p>
                <p className="text-teal-600 text-sm mt-1">No revisions due right now. Keep moving forward!</p>
            </div>
        ) : (
            <div className="grid gap-3">
                {dueRevisions.map(entry => (
                    <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div>
                            <span className="font-serif font-bold text-slate-800 text-lg">Surah {entry.surah}, Ayah {entry.ayah}</span>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Level {entry.masteryLevel}</span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Rev: {entry.revisionCount}</span>
                            </div>
                        </div>
                        <button 
                            className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-teal-200 transition-colors"
                            onClick={onClose} 
                        >
                            Revise
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Memorized List with Stats */}
      <div>
         <h3 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center mt-8">
            <span className="mr-2">📖</span> Memorized Library
        </h3>
        <div className="space-y-3">
             {stats.hifzProgress.length === 0 ? (
                 <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-sm">Your memorization list is empty.</div>
             ) : (
                 [...stats.hifzProgress].reverse().map(entry => {
                    const isExpanded = expandedId === entry.id;
                    const history = entry.revisionHistory || [];
                    const accuracyData = history.map(h => h.accuracy);
                    
                    // Advanced Metrics
                    const lastAccuracy = accuracyData.length > 0 ? accuracyData[accuracyData.length - 1] : 0;
                    const avgAccuracy = accuracyData.length > 0 ? Math.round(accuracyData.reduce((a, b) => a + b, 0) / accuracyData.length) : 0;
                    const bestAccuracy = accuracyData.length > 0 ? Math.max(...accuracyData) : 0;
                    
                    // Calculate trend (Last vs Previous)
                    const trend = accuracyData.length >= 2 
                        ? lastAccuracy - accuracyData[accuracyData.length - 2] 
                        : 0;
                    
                    let trendLabel = "Stable";
                    let trendColor = "text-slate-500";
                    if (trend > 2) { trendLabel = "Improving"; trendColor = "text-emerald-600"; }
                    else if (trend < -2) { trendLabel = "Declining"; trendColor = "text-red-500"; }

                    return (
                        <div key={entry.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${isExpanded ? 'border-teal-400 ring-1 ring-teal-400' : 'border-slate-200'}`}>
                            {/* Card Header */}
                            <div 
                                className="p-4 flex justify-between items-center cursor-pointer"
                                onClick={() => toggleExpand(entry.id)}
                            >
                                <div>
                                    <span className="font-serif font-bold text-slate-800 text-lg">Surah {entry.surah} : {entry.ayah}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(star => (
                                                <div 
                                                    key={star} 
                                                    className={`w-4 h-1 rounded-full ${star <= entry.masteryLevel ? 'bg-teal-500' : 'bg-slate-200'}`} 
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">Mastery</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs block font-medium ${new Date(entry.nextReviewDate) <= new Date() ? 'text-amber-600' : 'text-slate-400'}`}>
                                        {new Date(entry.nextReviewDate) <= new Date() ? 'Due Now' : `Next: ${new Date(entry.nextReviewDate).toLocaleDateString()}`}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {isExpanded ? 'Collapse' : 'Tap for details'}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                    <div className="py-4 flex flex-col md:flex-row gap-6">
                                        {/* Left Col: Trends */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline mb-3">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accuracy Trend</h4>
                                                <span className={`text-[10px] font-bold uppercase ${trendColor}`}>
                                                    {trend > 0 ? '▲' : trend < 0 ? '▼' : '•'} {trendLabel}
                                                </span>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                <Sparkline data={accuracyData} width={200} height={40} color="#0d9488" />
                                            </div>
                                        </div>
                                        
                                        {/* Right Col: Grid Stats */}
                                        <div className="flex-1">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Statistics</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white p-2 rounded border border-slate-100">
                                                    <span className="block text-lg font-bold text-slate-800">{entry.revisionCount}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Total Revisions</span>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-slate-100">
                                                    <span className="block text-lg font-bold text-slate-800">{avgAccuracy}%</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Avg Accuracy</span>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-slate-100">
                                                    <span className="block text-lg font-bold text-teal-600">{bestAccuracy}%</span>
                                                    <span className="text-[9px] text-teal-400 uppercase font-bold">Best Score</span>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-slate-100">
                                                    <span className="block text-lg font-bold text-indigo-600">Lvl {entry.masteryLevel}</span>
                                                    <span className="text-[9px] text-indigo-400 uppercase font-bold">Mastery</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {history.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">History Log</h4>
                                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 text-slate-500">
                                                        <tr>
                                                            <th className="p-2 font-medium">Date</th>
                                                            <th className="p-2 font-medium">Mistakes</th>
                                                            <th className="p-2 font-medium">Score</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {[...history].reverse().slice(0, 5).map((log, idx) => (
                                                            <tr key={idx}>
                                                                <td className="p-2 text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                                                                <td className="p-2 text-slate-600">{log.mistakes}</td>
                                                                <td className="p-2 font-medium text-emerald-600">{Math.round(log.accuracy)}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                 })
             )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      {/* Tab Switcher */}
      <div className="flex mb-6 bg-slate-100 p-1 rounded-xl">
        <button 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('overview')}
        >
            Overview
        </button>
        <button 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('analytics')}
        >
            Analytics
        </button>
        <button 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'hifz' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('hifz')}
        >
            Hifz Journey
        </button>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'hifz' && renderHifz()}

      <button 
        onClick={onClose}
        className="w-full mt-6 py-4 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
      >
        Back to Practice
      </button>
    </div>
  );
};

export default Dashboard;
