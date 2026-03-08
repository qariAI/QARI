
import { UserStats, SessionRecord, FeedbackData, HifzEntry, HifzRevisionLog, UserAnalytics, SessionMistakeSummary, UserGoals } from '../types';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'qariai_user_progress_v1';
const FREE_DAILY_LIMIT = 10;

const INITIAL_GOALS: UserGoals = {
  dailyMinutes: 15,
  weeklyAyahs: 5
};

export const INITIAL_STATS: UserStats = {
  streak: 0,
  lastPracticeDate: null,
  totalSessions: 0,
  totalXP: 0,
  level: 1,
  proficiencyLevel: 'Beginner',
  history: [],
  hifzProgress: [],
  goals: INITIAL_GOALS,
  isPremium: false,
  dailyUsageCount: 0,
  lastUsageResetDate: null
};

export const getProgress = async (): Promise<UserStats> => {
  try {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserStats;
        return checkAndResetDailyUsage(data);
      }
    }
  } catch (e) {
    console.warn("Firestore fetch failed", e);
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATS;
    const parsed = JSON.parse(stored);
    return checkAndResetDailyUsage({ ...INITIAL_STATS, ...parsed });
  } catch (e) {
    return INITIAL_STATS;
  }
};

const checkAndResetDailyUsage = (stats: UserStats): UserStats => {
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastUsageResetDate !== today) {
    return {
      ...stats,
      dailyUsageCount: 0,
      lastUsageResetDate: today
    };
  }
  return stats;
};

export const canUserRecite = (stats: UserStats): { canRecite: boolean, reason?: string } => {
  if (stats.isPremium) return { canRecite: true };

  if (stats.dailyUsageCount >= FREE_DAILY_LIMIT) {
    return {
      canRecite: false,
      reason: "You have reached your limit of 10 free recitations for today. Become a member for unlimited access!"
    };
  }

  return { canRecite: true };
};

export const incrementUsage = async (stats: UserStats): Promise<UserStats> => {
  const updatedStats = {
    ...stats,
    dailyUsageCount: (stats.dailyUsageCount || 0) + 1
  };
  await saveProgress(updatedStats);
  return updatedStats;
};

export const saveProgress = async (stats: UserStats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), stats);
    }
  } catch (e) {
    console.error("Save failed", e);
  }
};

export const updateGoals = async (newGoals: UserGoals): Promise<UserStats> => {
  const current = await getProgress();
  const updated = { ...current, goals: newGoals };
  await saveProgress(updated);
  return updated;
};

export const getDailyGoalProgress = (stats: UserStats) => {
  if (!stats) return { minutes: { current: 0, target: 15, percent: 0 }, ayahs: { current: 0, target: 5, percent: 0 } };
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSessions = (stats.history || []).filter(s => s.date?.startsWith(todayStr));
  const minutesPracticed = todaysSessions.length * 2;
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const newAyahsThisWeek = (stats.hifzProgress || []).filter(entry => {
    if (!entry.revisionHistory || entry.revisionHistory.length === 0) return false;
    const firstDate = new Date(entry.revisionHistory[0].date);
    return firstDate >= oneWeekAgo;
  }).length;

  const targetMin = stats.goals?.dailyMinutes || 15;
  const targetAyah = stats.goals?.weeklyAyahs || 5;

  return {
    minutes: {
      current: minutesPracticed,
      target: targetMin,
      percent: Math.min(100, (minutesPracticed / targetMin) * 100)
    },
    ayahs: {
      current: newAyahsThisWeek,
      target: targetAyah,
      percent: Math.min(100, (newAyahsThisWeek / targetAyah) * 100)
    }
  };
};

export const calculateXP = (data: FeedbackData, isHifzMode: boolean, currentStats: UserStats): number => {
  let score = data.tajweed_score || 0;
  const isPerfect = (data.mistakes || []).length === 0;

  if (isPerfect && score < 80) {
    score = 100;
  }

  if (score <= 10 && !isPerfect) return 0;

  let totalXP = score;

  if (score >= 98) totalXP += 50;
  else if (score >= 90) totalXP += 20;
  else if (score >= 80) totalXP += 10;

  if (isHifzMode) totalXP *= 1.2;

  const streakBonus = Math.min(currentStats.streak || 0, 10) * 2;
  totalXP += streakBonus;

  return Math.round(totalXP);
};

export const calculateLevel = (totalXP: number): number => {
  if (totalXP < 250) return 1;
  if (totalXP < 750) return 2;
  if (totalXP < 1500) return 3;
  if (totalXP < 2500) return 4;
  if (totalXP < 4000) return 5;
  if (totalXP < 6000) return 6;
  return Math.floor(Math.sqrt(totalXP / 150)) + 1;
};

export const getLevelProgress = (totalXP: number) => {
  const currentLevel = calculateLevel(totalXP);

  const getMinXP = (lvl: number) => {
    if (lvl === 1) return 0;
    if (lvl === 2) return 250;
    if (lvl === 3) return 750;
    if (lvl === 4) return 1500;
    if (lvl === 5) return 2500;
    if (lvl === 6) return 4000;
    return 150 * Math.pow(lvl - 1, 2);
  };

  const currentLevelMinXP = getMinXP(currentLevel);
  const nextLevelMinXP = getMinXP(currentLevel + 1);

  const xpInCurrentLevel = totalXP - currentLevelMinXP;
  const xpRequiredForLevel = nextLevelMinXP - currentLevelMinXP;
  
  return {
    current: xpInCurrentLevel,
    required: xpRequiredForLevel,
    percent: Math.min(100, Math.max(0, (xpInCurrentLevel / (xpRequiredForLevel || 1)) * 100))
  };
};

const calculateSRS = (
  scheduledInterval: number, 
  actualDaysPassed: number,
  currentEF: number, 
  accuracy: number, 
  previousAttempts: number
): { nextDate: string, newInterval: number, newMastery: number, newEF: number } => {
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
    newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEF < 1.3) newEF = 1.3; 

    if (previousAttempts === 0) {
      newInterval = 1;
    } else if (previousAttempts === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.ceil(scheduledInterval * newEF);
    }
  } else {
    newInterval = 1;
    newEF = Math.max(1.3, currentEF - 0.2);
  }

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

export const logHifzItem = async (stats: UserStats, data: FeedbackData): Promise<UserStats> => {
  if (!data.surah_number || !data.ayah_number) return stats;
  const id = `${data.surah_number}:${data.ayah_number}`;
  const now = new Date().toISOString();
  let accuracy = data.tajweed_score || 0;

  const newLog: HifzRevisionLog = {
    date: now,
    mistakes: (data.mistakes || []).length,
    accuracy: accuracy
  };
  
  let updatedHifzProgress = [...(stats.hifzProgress || [])];
  const existingIdx = updatedHifzProgress.findIndex(item => item.id === id);

  if (existingIdx >= 0) {
    const entry = updatedHifzProgress[existingIdx];
    const { nextDate, newInterval, newMastery, newEF } = calculateSRS(
      entry.interval || 1, 
      1,
      entry.easeFactor || 2.5, 
      accuracy, 
      entry.revisionCount || 0
    );
    
    updatedHifzProgress[existingIdx] = {
      ...entry,
      lastReviewed: now,
      nextReviewDate: nextDate,
      interval: newInterval,
      easeFactor: newEF,
      masteryLevel: newMastery,
      revisionCount: (entry.revisionCount || 0) + 1,
      revisionHistory: [...(entry.revisionHistory || []), newLog].slice(-20)
    };
  } else {
    updatedHifzProgress.push({
      id, surah: data.surah_number, ayah: data.ayah_number, status: 'MEMORIZED',
      lastReviewed: now, nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
      interval: 1, easeFactor: 2.5, masteryLevel: 1, revisionCount: 1, revisionHistory: [newLog]
    });
  }

  const newStats = { ...stats, hifzProgress: updatedHifzProgress };
  await saveProgress(newStats);
  return newStats;
};

export const getDueRevisions = (stats: UserStats): HifzEntry[] => {
  const now = new Date();
  return (stats.hifzProgress || []).filter(entry => new Date(entry.nextReviewDate) <= now)
    .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
};

export const updateProgress = async (currentStats: UserStats, sessionData: FeedbackData, verseContext: string, isHifzMode: boolean): Promise<{ newStats: UserStats, xpGained: number }> => {
  const now = new Date();

  let newStreak = currentStats.streak || 0;
  const lastDate = currentStats.lastPracticeDate ? new Date(currentStats.lastPracticeDate).toISOString().split('T')[0] : null;
  const today = now.toISOString().split('T')[0];

  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      newStreak += 1;
    } else if (lastDate === null || lastDate < yesterdayStr) {
      newStreak = 1;
    }
  }

  const xpGained = calculateXP(sessionData, isHifzMode, { ...currentStats, streak: newStreak });
  const newTotalXP = (currentStats.totalXP || 0) + xpGained;

  const newRecord: SessionRecord = {
    id: Date.now().toString(),
    date: now.toISOString(),
    surah_ayah: (sessionData.surah_number > 0) ? `Surah ${sessionData.surah_number}:${sessionData.ayah_number}` : verseContext || "Unknown Verse",
    mistakes_count: (sessionData.mistakes || []).length,
    xp_gained: xpGained,
    is_hifz: isHifzMode,
    score: sessionData.tajweed_score,
    mistake_summary: (sessionData.mistakes || []).map(m => ({ letter: m.letter, rule: m.rule }))
  };

  const newStats: UserStats = {
    ...currentStats,
    streak: newStreak,
    lastPracticeDate: now.toISOString(),
    totalSessions: (currentStats.totalSessions || 0) + 1,
    totalXP: newTotalXP,
    level: calculateLevel(newTotalXP),
    history: [newRecord, ...(currentStats.history || [])].slice(0, 50)
  };

  await saveProgress(newStats);
  return { newStats, xpGained };
};

export const getUserAnalytics = (stats: UserStats): UserAnalytics => {
  const history = stats?.history || [];

  const last5 = history.slice(0, 5);
  const prev5 = history.slice(5, 10);

  const lastAvg = last5.length > 0 ? last5.reduce((a, s) => a + (s.score || 0), 0) / last5.length : 0;
  const prevAvg = prev5.length > 0 ? prev5.reduce((a, s) => a + (s.score || 0), 0) / prev5.length : 0;

  const diff = lastAvg - prevAvg;
  const improvement = prevAvg === 0 ? "Initial" : `${diff > 0 ? '+' : ''}${Math.round(diff)}%`;

  const allMistakes = history.flatMap(s => s.mistake_summary || []);
  const letterCounts: Record<string, number> = {};
  const ruleCounts: Record<string, number> = {};

  allMistakes.forEach(m => {
    if (m.letter) letterCounts[m.letter] = (letterCounts[m.letter] || 0) + 1;
    if (m.rule) ruleCounts[m.rule] = (ruleCounts[m.rule] || 0) + 1;
  });

  const weakLetters = Object.entries(letterCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  const weakRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

  return {
    user_id: auth.currentUser?.uid || "local_user",
    current_level: `Level ${stats?.level || 1}`,
    avg_score: history.length > 0 ? Math.round(history.reduce((acc, s) => acc + (s.score || 0), 0) / history.length) : 0,
    weak_letters: weakLetters,
    weak_rules: weakRules,
    sessions_completed: stats?.totalSessions || 0,
    last_practice: stats?.lastPracticeDate || "Never",
    improvement_rate: improvement
  };
};
