import React from 'react';
import { UserStats } from '../types';

interface HeatmapProps {
  stats: UserStats;
}

const Heatmap: React.FC<HeatmapProps> = ({ stats }) => {
  // We'll show a "Mushaf Heatmap" for Juz 30 (the most common for beginners)
  // Surah 78 (An-Naba) to Surah 114 (An-Nas)
  const SURAHS = [
    { id: 78, name: 'An-Naba', ayahs: 40 },
    { id: 79, name: 'An-Nazi\'at', ayahs: 46 },
    { id: 80, name: 'Abasa', ayahs: 42 },
    { id: 81, name: 'At-Takwir', ayahs: 29 },
    { id: 82, name: 'Al-Infitar', ayahs: 19 },
    { id: 83, name: 'Al-Mutaffifin', ayahs: 36 },
    { id: 84, name: 'Al-Inshiqaq', ayahs: 25 },
    { id: 85, name: 'Al-Buruj', ayahs: 22 },
    { id: 86, name: 'At-Tariq', ayahs: 17 },
    { id: 87, name: 'Al-A\'la', ayahs: 19 },
    { id: 88, name: 'Al-Ghashiyah', ayahs: 26 },
    { id: 89, name: 'Al-Fajr', ayahs: 30 },
    { id: 90, name: 'Al-Balad', ayahs: 20 },
    { id: 91, name: 'Ash-Shams', ayahs: 15 },
    { id: 92, name: 'Al-Layl', ayahs: 21 },
    { id: 93, name: 'Ad-Duha', ayahs: 11 },
    { id: 94, name: 'Ash-Sharh', ayahs: 8 },
    { id: 95, name: 'At-Tin', ayahs: 8 },
    { id: 96, name: 'Al-Alaq', ayahs: 19 },
    { id: 97, name: 'Al-Qadr', ayahs: 5 },
    { id: 98, name: 'Al-Bayyinah', ayahs: 8 },
    { id: 99, name: 'Az-Zalzalah', ayahs: 8 },
    { id: 100, name: 'Al-Adiyat', ayahs: 11 },
    { id: 101, name: 'Al-Qari\'ah', ayahs: 11 },
    { id: 102, name: 'At-Takathur', ayahs: 8 },
    { id: 103, name: 'Al-Asr', ayahs: 3 },
    { id: 104, name: 'Al-Humazah', ayahs: 9 },
    { id: 105, name: 'Al-Fil', ayahs: 5 },
    { id: 106, name: 'Quraysh', ayahs: 4 },
    { id: 107, name: 'Al-Ma\'un', ayahs: 7 },
    { id: 108, name: 'Al-Kawthar', ayahs: 3 },
    { id: 109, name: 'Al-Kafirun', ayahs: 6 },
    { id: 110, name: 'An-Nasr', ayahs: 3 },
    { id: 111, name: 'Al-Masad', ayahs: 5 },
    { id: 112, name: 'Al-Ikhlas', ayahs: 4 },
    { id: 113, name: 'Al-Falaq', ayahs: 5 },
    { id: 114, name: 'An-Nas', ayahs: 6 }
  ];

  const getAyahStatus = (surah: number, ayah: number) => {
    const id = `${surah}:${ayah}`;
    const entry = stats.hifzProgress?.find(item => item.id === id);
    if (!entry) return 'none'; // Not practiced

    // masteryLevel is 1-5
    if (entry.masteryLevel >= 4) return 'mastered';
    if (entry.masteryLevel >= 2) return 'learning';
    return 'struggling';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
           <span className="text-xl">🗺️</span> Hifz Heatmap (Juz 30)
        </h3>
        <div className="flex gap-4 text-[10px] uppercase font-bold text-slate-400">
           <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Mastered</div>
           <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-200"></span> Learning</div>
           <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-200"></span> Struggling</div>
           <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-100"></span> Not Started</div>
        </div>
      </div>

      <div className="space-y-6">
        {SURAHS.map(surah => (
          <div key={surah.id} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">{surah.id}. {surah.name}</span>
              <span className="text-[10px] text-slate-400 italic">{surah.ayahs} Ayahs</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: surah.ayahs }).map((_, i) => {
                const ayahNum = i + 1;
                const status = getAyahStatus(surah.id, ayahNum);

                let bgColor = "bg-slate-100";
                if (status === 'mastered') bgColor = "bg-emerald-500 hover:bg-emerald-600";
                else if (status === 'learning') bgColor = "bg-emerald-200 hover:bg-emerald-300";
                else if (status === 'struggling') bgColor = "bg-red-200 hover:bg-red-300";

                return (
                  <div
                    key={ayahNum}
                    title={`Surah ${surah.name}, Ayah ${ayahNum}`}
                    className={`w-3.5 h-3.5 rounded-sm transition-colors cursor-help ${bgColor}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Heatmap;
