
export interface CoachingDetails {
  mouth_shape: string;
  tongue_position: string;
  airflow: string;
  duration: string;
}

export type MistakeCategory = 'Makharij' | 'Timing' | 'Sifaat' | 'Memory';

export type HifzErrorType = 'OMISSION' | 'SUBSTITUTION' | 'ADDITION' | 'NONE';

export interface Mistake {
  verse_word: string;
  letter: string;         // The specific letter
  expected_ipa: string;   // Expected IPA sound
  user_ipa: string;       // User's IPA sound
  issue: string;
  category: MistakeCategory; // For grouping feedback
  hifz_error_type?: HifzErrorType; // New: Specific type for Memory errors
  rule: string;
  rule_nuance?: string;   // New: Specific detail about rule levels (Ghunnah/Tafkheem)
  severity: 'Minor' | 'Moderate' | 'Major';
  coaching_details: CoachingDetails; // Physical coaching details
  practice_tip: string;   // The correction drill
}

export interface TajweedScoreBreakdown {
  makharij: number;        // Max 30
  madd_timing: number;     // Max 20
  ghunnah: number;         // Max 15
  qalqalah: number;        // Max 10
  tafkheem_tarqeeq: number;// Max 10
  shaddah: number;         // Max 10
  flow_breath: number;     // Max 5
}

export interface Drill {
  title: string;
  instructions: string;
  focus_rule: string;
  duration_seconds: number;
  reps: number;
}

export interface FeedbackData {
  surah_number: number;
  ayah_number: number;
  quran_text_arabic: string;
  quran_text_transliteration: string;
  quran_text_translation: string;
  positive_points: string[];
  mistakes: Mistake[];
  daily_practice: string;
  encouragement: string;
  hifz_feedback?: string; // Specific feedback for Hifz mode
  tajweed_score: number; // 0-100
  score_breakdown: TajweedScoreBreakdown;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR',
  DASHBOARD = 'DASHBOARD'
}

export interface SessionMistakeSummary {
  letter?: string;
  rule?: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  surah_ayah: string;
  mistakes_count: number;
  xp_gained: number;
  is_hifz: boolean;
  score?: number; // Optional for backward compatibility
  mistake_summary?: SessionMistakeSummary[]; // New: Stores specifics for analytics
}

export interface HifzRevisionLog {
  date: string;
  mistakes: number;
  accuracy: number; // 0-100
}

// Spaced Repetition System (SRS) Data
export interface HifzEntry {
  id: string; // Format: "surah:ayah" e.g., "1:1"
  surah: number;
  ayah: number;
  status: 'NEW' | 'MEMORIZED';
  lastReviewed: string; // ISO Date
  nextReviewDate: string; // ISO Date
  interval: number; // Current SRS interval in days
  easeFactor: number; // SM-2 Ease Factor (default 2.5)
  masteryLevel: number; // 1 (Weak) to 5 (Strong)
  revisionCount: number;
  revisionHistory: HifzRevisionLog[];
}

export interface UserGoals {
  dailyMinutes: number;
  weeklyAyahs: number;
}

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/**
 * MEMBERSHIP & USAGE TRACKING
 */
export interface UserStats {
  streak: number;
  lastPracticeDate: string | null; // ISO Date string
  totalSessions: number;
  totalXP: number;
  level: number;
  proficiencyLevel: ProficiencyLevel;
  history: SessionRecord[];
  hifzProgress: HifzEntry[];
  goals: UserGoals;

  // Usage Tiers & Quotas
  isPremium: boolean;           // True for paid members
  dailyUsageCount: number;      // Tries used today
  lastUsageResetDate: string | null; // Last time count was reset (ISO Date)
}

export interface UserAnalytics {
  user_id: string;
  current_level: string;
  avg_score: number;
  weak_letters: string[];
  weak_rules: string[];
  sessions_completed: number;
  last_practice: string;
  improvement_rate: string;
}
