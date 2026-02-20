
import { UserStats, SessionRecord, FeedbackData, HifzEntry, HifzRevisionLog, UserAnalytics, SessionMistakeSummary, UserGoals } from '../types';

const STORAGE_KEY = 'qariai_user_progress_v1';

const INITIAL_GOALS: UserGoals = {
  dailyMinutes: 15,
  weeklyAyahs: 5
};

const INITIAL_STATS: UserStats = {
  streak: 0,
  lastPracticeDate: null,
  totalSessions: 0,
  totalXP: 0,
  level: 1,
  proficiencyLevel: 'Beginner',
  history: [],
  hifzProgress: [],
  goals: INITIAL_GOALS
};

export const getProgress = (): UserStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATS;
    
    const parsed = JSON.parse(stored);
    
    // Migrations
    if (!parsed.hifzProgress) parsed.hifzProgress = [];
    
    parsed.hifzProgress = parsed.hifzProgress.map((entry: any) => ({
      ...entry,
      revisionHistory: entry.revisionHistory || [],
      interval: entry.interval || 1,
      easeFactor: entry.easeFactor || 2.5
    }));
    
    if (!parsed.proficiencyLevel) parsed.proficiencyLevel = 'Beginner';
    if (!parsed.goals) parsed.goals = INITIAL_GOALS;

    return parsed;
  } catch (e) {
    console.error("Failed to load progress", e);
    return INITIAL_STATS;
  }
};

export const saveProgress = (stats: UserStats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save progress", e);
  }
};

export const updateGoals = (newGoals: UserGoals): UserStats => {
  const current = getProgress();
  const updated = { ...current, goals: newGoals };
  saveProgress(updated);
  return updated;
};

export const getDailyGoalProgress = (stats: UserStats) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Estimate minutes: simple heuristic, 2 mins per session recorded today
  const todaysSessions = stats.history.filter(s => s.date.startsWith(todayStr));
  const minutesPracticed = todaysSessions.length * 2; // Approx 2 mins per interaction
  
  // Weekly Ayahs: Count "New Memorization" in last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const newAyahsThisWeek = stats.hifzProgress.filter(entry => {
    // Assuming 'revisionCount === 1' and 'revisionHistory' length 1 implies new
    // A better way is to check the date of the first history entry
    if (entry.revisionHistory.length === 0) return false;
    const firstDate = new Date(entry.revisionHistory[0].date);
    return firstDate >= oneWeekAgo;
  }).length;

  return {
    minutes: {
      current: minutesPracticed,
      target: stats.goals.dailyMinutes,
      percent: Math.min(100, (minutesPracticed / stats.goals.dailyMinutes) * 100)
    },
    ayahs: {
      current: newAyahsThisWeek,
      target: stats.goals.weeklyAyahs,
      percent: Math.min(100, (newAyahsThisWeek / stats.goals.weeklyAyahs) * 100)
    }
  };
};

export const calculateXP = (data: FeedbackData, isHifzMode: boolean): number => {
  // Use the AI-calculated Tajweed score as base XP
  let xp = data.tajweed_score || 0;
  
  // Bonus for perfect score
  if (xp >= 95) xp += 20;
  
  // Hifz Bonus
  if (isHifzMode) xp += 10;

  // Minimum XP for effort
  return Math.max(10, Math.round(xp));
};

export const calculateLevel = (totalXP: number): number => {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
};

export const getLevelProgress = (totalXP: number) => {
  const currentLevel = calculateLevel(totalXP);
  const nextLevel = currentLevel + 1;
  const currentLevelMinXP = 100 * Math.pow(currentLevel - 1, 2);
  const nextLevelMinXP = 100 * Math.pow(nextLevel - 1, 2);
  
  const xpInCurrentLevel = totalXP - currentLevelMinXP;
  const xpRequiredForLevel = nextLevelMinXP - currentLevelMinXP;
  
  return {
    current: xpInCurrentLevel,
    required: xpRequiredForLevel,
    percent: Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForLevel) * 100))
  };
};

/**
 * Advanced SuperMemo-2 (SM-2) Style SRS Algorithm
 */
const calculateSRS = (
  scheduledInterval: number, 
  actualDaysPassed: number,
  currentEF: number, 
  accuracy: number, 
  previousAttempts: number
): { nextDate: string, newInterval: number, newMastery: number, newEF: number } => {
  // 1. Convert Accuracy (0-100) to Quality (0-5)
  let q = 0;
  if (accuracy >= 95) q = 5;
  else if (accuracy >= 85) q = 4;
  else if (accuracy >= 70) q = 3;
  else if (accuracy >= 50) q = 2;
  else if (accuracy >= 30) q = 1;
  else q = 0;

  let newInterval = 1;
  let newEF = currentEF;

  if (q >= 3) {
    // Success Case (Pass)
    newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEF < 1.3) newEF = 1.3; 

    if (previousAttempts === 0) {
      newInterval = 1;
    } else if (previousAttempts === 1) {
      newInterval = 3;
    } else {
      if (actualDaysPassed < scheduledInterval * 0.5) {
         newInterval = Math.ceil(scheduledInterval * (q === 5 ? 1.1 : 1.0));
      } 
      else {
         const base = (actualDaysPassed > scheduledInterval && q >= 4) ? actualDaysPassed : scheduledInterval;
         newInterval = Math.ceil(base * newEF);
         const fuzz = 0.95 + Math.random() * 0.1;
         newInterval = Math.round(newInterval * fuzz);
      }
    }
  } else {
    // Failure Case
    newInterval = 1;
    newEF = Math.max(1.3, currentEF - 0.2);
  }

  if (newInterval > 365) newInterval = 365;
  if (newInterval < 1) newInterval = 1;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  let newMastery = 1;
  if (newInterval >= 60) newMastery = 5;
  else if (newInterval >= 21) newMastery = 4;
  else if (newInterval >= 7) newMastery = 3;
  else if (newInterval >= 3) newMastery = 2;

  return {
    nextDate: nextDate.toISOString(),
    newInterval,
    newMastery,
    newEF
  };
};

export const logHifzItem = (stats: UserStats, data: FeedbackData): UserStats => {
  if (!data.surah_number || !data.ayah_number) return stats;

  const id = `${data.surah_number}:${data.ayah_number}`;
  const now = new Date().toISOString();
  
  // Use the AI-provided Tajweed score as accuracy (fallback to simple calc if missing)
  let accuracy = data.tajweed_score;
  if (accuracy === undefined) {
    const penaltyScore = data.mistakes.reduce((acc, m) => {
        let penalty = 0;
        if (m.severity === 'Major') penalty = 20;
        else if (m.severity === 'Moderate') penalty = 10;
        else penalty = 2;
        return acc + penalty;
    }, 0);
    accuracy = Math.max(0, 100 - penaltyScore);
  }

  const newLog: HifzRevisionLog = {
    date: now,
    mistakes: data.mistakes.length,
    accuracy: accuracy
  };
  
  const existingEntryIndex = stats.hifzProgress.findIndex(item => item.id === id);
  let updatedHifzProgress = [...stats.hifzProgress];

  if (existingEntryIndex >= 0) {
    const entry = updatedHifzProgress[existingEntryIndex];
    const effectiveRevisions = accuracy < 70 ? 0 : (entry.revisionCount || 0);

    let actualDaysPassed = entry.interval || 1;
    if (entry.lastReviewed) {
        const lastRevDate = new Date(entry.lastReviewed);
        const nowDate = new Date(now);
        if (!isNaN(lastRevDate.getTime())) {
            const diffTime = Math.abs(nowDate.getTime() - lastRevDate.getTime());
            actualDaysPassed = diffTime / (1000 * 60 * 60 * 24);
        }
    }

    const { nextDate, newInterval, newMastery, newEF } = calculateSRS(
      entry.interval || 1, 
      actualDaysPassed,
      entry.easeFactor || 2.5, 
      accuracy, 
      effectiveRevisions
    );
    
    const updatedHistory = [...(entry.revisionHistory || []), newLog].slice(-20);

    updatedHifzProgress[existingEntryIndex] = {
      ...entry,
      lastReviewed: now,
      nextReviewDate: nextDate,
      interval: newInterval,
      easeFactor: newEF,
      masteryLevel: newMastery,
      revisionCount: (entry.revisionCount || 0) + 1,
      revisionHistory: updatedHistory
    };
  } else {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);

    const newEntry: HifzEntry = {
      id,
      surah: data.surah_number,
      ayah: data.ayah_number,
      status: 'MEMORIZED',
      lastReviewed: now,
      nextReviewDate: nextDate.toISOString(),
      interval: 1,
      easeFactor: 2.5,
      masteryLevel: 1,
      revisionCount: 1,
      revisionHistory: [newLog]
    };
    updatedHifzProgress.push(newEntry);
  }

  const newStats = {
    ...stats,
    hifzProgress: updatedHifzProgress
  };

  saveProgress(newStats);
  return newStats;
};

export const getDueRevisions = (stats: UserStats): HifzEntry[] => {
  const now = new Date();
  return stats.hifzProgress.filter(entry => {
    return new Date(entry.nextReviewDate) <= now;
  }).sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
};

export const updateProgress = (currentStats: UserStats, sessionData: FeedbackData, verseContext: string, isHifzMode: boolean): { newStats: UserStats, xpGained: number } => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const lastDateStr = currentStats.lastPracticeDate ? currentStats.lastPracticeDate.split('T')[0] : null;
  
  let newStreak = currentStats.streak;
  if (lastDateStr !== todayStr) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (lastDateStr === yesterdayStr) newStreak += 1;
    else newStreak = 1;
  }

  const xpGained = calculateXP(sessionData, isHifzMode);
  const newTotalXP = currentStats.totalXP + xpGained;
  const newLevel = calculateLevel(newTotalXP);

  // Extract analytics-friendly summary
  const mistakeSummary: SessionMistakeSummary[] = sessionData.mistakes.map(m => ({
    letter: m.letter,
    rule: m.rule
  }));

  const newRecord: SessionRecord = {
    id: Date.now().toString(),
    date: now.toISOString(),
    surah_ayah: verseContext || `Surah ${sessionData.surah_number}:${sessionData.ayah_number}`,
    mistakes_count: sessionData.mistakes.length,
    xp_gained: xpGained,
    is_hifz: isHifzMode,
    score: sessionData.tajweed_score,
    mistake_summary: mistakeSummary
  };

  const newStats: UserStats = {
    ...currentStats,
    streak: newStreak,
    lastPracticeDate: now.toISOString(),
    totalSessions: currentStats.totalSessions + 1,
    totalXP: newTotalXP,
    level: newLevel,
    proficiencyLevel: currentStats.proficiencyLevel,
    history: [newRecord, ...currentStats.history].slice(0, 50)
  };

  saveProgress(newStats);
  return { newStats, xpGained };
};

export const getUserAnalytics = (stats: UserStats): UserAnalytics => {
  const history = stats.history;
  const count = history.length;
  
  // 1. Average Score
  const totalScore = history.reduce((acc, sess) => acc + (sess.score || 0), 0);
  const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

  // 2. Improvement Rate (Last 5 vs Previous 5)
  let improvementRate = "0%";
  if (count >= 2) {
      const recent = history.slice(0, 5);
      const previous = history.slice(5, 10);
      
      const recentAvg = recent.reduce((acc, s) => acc + (s.score || 0), 0) / recent.length;
      
      if (previous.length > 0) {
        const prevAvg = previous.reduce((acc, s) => acc + (s.score || 0), 0) / previous.length;
        const diff = recentAvg - prevAvg;
        // avoid division by zero
        const percent = prevAvg === 0 ? 100 : (diff / prevAvg) * 100;
        improvementRate = (diff >= 0 ? "+" : "") + Math.round(percent) + "%";
      } else {
        improvementRate = "N/A";
      }
  }

  // 3. Weak Letters & Rules
  const letterCounts: Record<string, number> = {};
  const ruleCounts: Record<string, number> = {};

  history.forEach(sess => {
      if (sess.mistake_summary) {
          sess.mistake_summary.forEach(m => {
              if (m.letter) letterCounts[m.letter] = (letterCounts[m.letter] || 0) + 1;
              if (m.rule) ruleCounts[m.rule] = (ruleCounts[m.rule] || 0) + 1;
          });
      }
  });

  const sortedLetters = Object.entries(letterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([k]) => k);

  const sortedRules = Object.entries(ruleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2) // Top 2 rules
      .map(([k]) => k);

  return {
      user_id: "local_user",
      current_level: `Level ${stats.level} (${stats.proficiencyLevel})`,
      avg_score: avgScore,
      weak_letters: sortedLetters,
      weak_rules: sortedRules,
      sessions_completed: stats.totalSessions,
      last_practice: stats.lastPracticeDate || "Never",
      improvement_rate: improvementRate
  };
};
