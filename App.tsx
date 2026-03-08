
import React, { useState, useEffect } from 'react';
import { AppState, FeedbackData, UserStats, ProficiencyLevel, UserGoals } from './types';
import Recorder from './components/Recorder';
import Feedback from './components/Feedback';
import Dashboard from './components/Dashboard';
import GoalSetter from './components/GoalSetter';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ConsentModal from './components/ConsentModal';
import LevelsGuide from './components/LevelsGuide';
import Auth from './components/Auth';
import { analyzeRecitation } from './services/geminiService';
import { getProgress, updateProgress, logHifzItem, saveProgress, updateGoals, getDailyGoalProgress, getDueRevisions, INITIAL_STATS, canUserRecite, incrementUsage } from './services/progressService';
import { checkLocalBackendHealth, predictNextWords } from './services/hafizService';
import { README_CONTENT } from './services/docsService';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [verseContext, setVerseContext] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isHifzMode, setIsHifzMode] = useState<boolean>(false);
  const [autoHifzSaved, setAutoHifzSaved] = useState<boolean>(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTextHidden, setIsTextHidden] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('qariai_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [viewingLegal, setViewingLegal] = useState<'NONE' | 'PRIVACY' | 'TERMS'>('NONE');
  const [aiBackend, setAiBackend] = useState<'CLOUD' | 'LOCAL'>('CLOUD');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const [userStats, setUserStats] = useState<UserStats>(INITIAL_STATS);
  const [goalProgress, setGoalProgress] = useState<any>(getDailyGoalProgress(INITIAL_STATS));
  const [isLoading, setIsLoading] = useState(true);
  const [dueRevisionsCount, setDueRevisionsCount] = useState(0);
  const [sessionXP, setSessionXP] = useState<number>(0);

  const loadUserProgress = async () => {
    try {
        const stats = await getProgress();
        setUserStats(stats);
        setGoalProgress(getDailyGoalProgress(stats));
        setDueRevisionsCount(getDueRevisions(stats).length);
    } catch (e) {
        console.error("Progress Load Error:", e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLocalBackendHealth().then((isLocal) => {
      if (isLocal) setAiBackend('LOCAL');
    });

    loadUserProgress();

    const unsubscribe = onAuthStateChanged(auth, () => {
      loadUserProgress();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (appState !== AppState.ANALYZING) loadUserProgress();
  }, [appState]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('qariai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('qariai_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleConsent = () => { setHasConsented(true); };

  const changeLevel = async (level: ProficiencyLevel) => {
    const newStats = { ...userStats, proficiencyLevel: level };
    setUserStats(newStats);
    await saveProgress(newStats);
  };

  const handleUpdateGoals = async (newGoals: UserGoals) => {
    const updatedStats = await updateGoals(newGoals);
    setUserStats(updatedStats);
    setGoalProgress(getDailyGoalProgress(updatedStats));
  };

  const handlePredict = async () => {
    if (!verseContext || verseContext.length < 2) return;
    setIsPredicting(true);
    const result = await predictNextWords(verseContext);
    if (result) setPrediction(result);
    setIsPredicting(false);
  };

  const handleAddPrediction = () => {
    if (prediction) {
      setVerseContext(prev => {
        const separator = prev.trim().endsWith(' ') ? '' : ' ';
        return prev + separator + prediction;
      });
      setPrediction(null);
    }
  };

  const handleDownloadReadme = () => {
    const blob = new Blob([README_CONTENT], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    const { canRecite, reason } = canUserRecite(userStats);
    if (!canRecite) {
      setErrorMsg(reason || "Usage limit reached.");
      setAppState(AppState.ERROR);
      return;
    }

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    setAutoHifzSaved(false);
    setPrediction(null);
    const url = URL.createObjectURL(audioBlob);
    setUserAudioUrl(url);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const data = await analyzeRecitation(base64Audio, audioBlob.type, verseContext, isHifzMode, userStats.proficiencyLevel);

      const statsAfterUsage = await incrementUsage(userStats);

      const { newStats: statsAfterUpdate, xpGained } = await updateProgress(statsAfterUsage, data, verseContext, isHifzMode);
      let finalStats = statsAfterUpdate;
      let savedAutomatically = false;
      if (isHifzMode && data.surah_number && data.ayah_number) {
        const severeMistakes = data.mistakes.filter(m => m.severity === 'Major');
        if (severeMistakes.length === 0) {
           finalStats = await logHifzItem(statsAfterUpdate, data);
           savedAutomatically = true;
        }
      }
      setUserStats(finalStats);
      setSessionXP(xpGained);
      setFeedback(data);
      setAutoHifzSaved(savedAutomatically);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze recitation.");
      setAppState(AppState.ERROR);
    }
  };

  const handleAddToHifz = async (data: FeedbackData) => {
    const updatedStats = await logHifzItem(userStats, data);
    setUserStats(updatedStats);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setFeedback(null);
    setVerseContext('');
    setPrediction(null);
    setErrorMsg(null);
    setSessionXP(0);
    setAutoHifzSaved(false);
    if (userAudioUrl) { URL.revokeObjectURL(userAudioUrl); setUserAudioUrl(null); }
  };

  if (viewingLegal === 'PRIVACY') return <PrivacyPolicy onBack={() => setViewingLegal('NONE')} />;
  if (viewingLegal === 'TERMS') return <TermsOfService onBack={() => setViewingLegal('NONE')} />;
  if (isGuideOpen) return <LevelsGuide onClose={() => setIsGuideOpen(false)} />;

  if (isLoading) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 font-serif text-emerald-800 dark:bg-slate-950 dark:text-emerald-500">
            <div className="mb-4 text-4xl animate-pulse">🌙</div>
            <div className="text-xl font-bold">Initializing QariAI...</div>
            <div className="mt-2 text-xs text-slate-400">Loading your journey</div>
        </div>
      );
  }

  if (!hasConsented) {
    return (
      <ConsentModal
        onAccept={handleConsent}
        onViewPrivacy={() => setViewingLegal('PRIVACY')}
        onViewTerms={() => setViewingLegal('TERMS')}
      />
    );
  }

  const isRecordingOrAnalyzing = appState === AppState.RECORDING || appState === AppState.ANALYZING;
  const isArabicInput = /[\u0600-\u06FF]/.test(verseContext);

  return (
    <div
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
      className={`min-h-screen font-sans selection:bg-emerald-200 transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : isHifzMode ? 'bg-teal-50 text-teal-900' : 'bg-slate-50 text-slate-900'}`}
    >
      
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => !isRecordingOrAnalyzing && setAppState(AppState.IDLE)}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl ${isHifzMode ? 'bg-teal-700' : 'bg-emerald-700'}`}>Q</div>
            <span className={`text-xl font-serif font-bold dark:text-white hidden sm:inline ${isHifzMode ? 'text-teal-950' : 'text-emerald-950'}`}>QariAI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
             <button
               onClick={() => setIsGuideOpen(true)}
               disabled={isRecordingOrAnalyzing}
               className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex flex-col items-center leading-none"
               title="Tajweed Guide"
             >
               <span className="text-xl">📖</span>
               <span className="text-[8px] font-bold uppercase mt-0.5">Rules</span>
             </button>

             {!userStats.isPremium && (
               <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-full dark:bg-amber-900 dark:text-amber-200">
                 {Math.max(0, 10 - (userStats.dailyUsageCount || 0))} LEFT
               </span>
             )}
             <button onClick={toggleDarkMode} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                {isDarkMode ? '☀️' : '🌙'}
             </button>
             <Auth />
             <button 
              onClick={() => setAppState(prev => prev === AppState.DASHBOARD ? AppState.IDLE : AppState.DASHBOARD)}
              disabled={isRecordingOrAnalyzing}
              className={`p-1.5 pr-3 rounded-full flex items-center gap-2 transition-all border
                ${appState === AppState.DASHBOARD ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600'} ${isRecordingOrAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center text-lg border border-emerald-100 dark:border-emerald-800 relative">👤{dueRevisionsCount > 0 && (<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>)}</div>
                <div className="flex flex-col items-start leading-none"><span className="text-[10px] text-slate-500 font-bold uppercase">Level {userStats?.level || 1}</span><span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{userStats?.streak || 0}d</span></div>
             </button>
          </div>
        </div>
      </nav>

      {isGoalModalOpen && (<GoalSetter currentGoals={userStats.goals} onSave={handleUpdateGoals} onClose={() => setIsGoalModalOpen(false)} />)}

      <main className="max-w-3xl mx-auto px-4 py-8 min-h-[calc(100vh-140px)]">
        {appState === AppState.ERROR && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 flex flex-col items-center gap-3">
            <p className="text-center font-medium">{errorMsg || "An unexpected error occurred."}</p>
            <div className="flex gap-4">
              <button onClick={() => setAppState(AppState.IDLE)} className="text-sm font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">Dismiss</button>
              {errorMsg?.includes("limit") && (
                <button className="text-sm font-bold bg-amber-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-amber-600 transition-all">Become a Member</button>
              )}
            </div>
          </div>
        )}

        {appState === AppState.DASHBOARD ? (
          <Dashboard stats={userStats} onClose={() => setAppState(AppState.IDLE)} />
        ) : appState === AppState.RESULTS && feedback ? (
          <Feedback data={feedback} onReset={resetApp} xpGained={sessionXP} userAudioUrl={userAudioUrl} onAddToHifz={handleAddToHifz} isHifzMode={isHifzMode} isAutoSaved={autoHifzSaved} />
        ) : (
          <div className="flex flex-col items-center space-y-8 animate-fade-in-up">
            <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4 transition-colors">
               <div className="flex-1"><div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Daily Goal</span><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{Math.round(goalProgress?.minutes?.current || 0)} / {goalProgress?.minutes?.target || 15} min</span></div><div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${goalProgress?.minutes?.percent || 0}%` }} /></div></div>
               {dueRevisionsCount > 0 && (<button onClick={() => setAppState(AppState.DASHBOARD)} className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-900 animate-pulse hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">{dueRevisionsCount} Due</button>)}
               <button onClick={() => setIsGoalModalOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors">⚙️</button>
            </div>

            <div className="text-center space-y-3 max-w-lg">
              <h1 className={`text-4xl font-serif dark:text-white ${isHifzMode ? 'text-teal-900' : 'text-emerald-950'}`}>{isHifzMode ? "Hifz Companion" : "Improve Your Tajweed"}</h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">{isHifzMode ? "Recite from memory. We'll check your accuracy, fluency, and retention strength." : "Recite any verse. AI will listen and provide precise feedback on pronunciation."}</p>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
                <div className="bg-white dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800 flex shadow-sm relative transition-colors">
                    <button onClick={() => !isRecordingOrAnalyzing && setIsHifzMode(false)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all z-10 ${!isHifzMode ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>Tajweed Coach</button>
                    <button onClick={() => !isRecordingOrAnalyzing && setIsHifzMode(true)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all z-10 ${isHifzMode ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>Hifz Mode</button>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-2 mr-1">Level</span>
                    {(['Beginner', 'Intermediate', 'Advanced'] as ProficiencyLevel[]).map((level) => (<button key={level} onClick={() => changeLevel(level)} disabled={isRecordingOrAnalyzing} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${userStats?.proficiencyLevel === level ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>{level}</button>))}
                </div>
            </div>

            <div className="w-full max-w-md space-y-2">
              <div className="relative group">
                <label htmlFor="context" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex justify-between"><span>{isHifzMode ? "What are you reciting?" : "Which Surah/Ayah? (Optional)"}</span>{isHifzMode && (<button onClick={() => setIsTextHidden(!isTextHidden)} className={`text-xs font-bold flex items-center gap-1 ${isTextHidden ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>{isTextHidden ? '👁️ Text Hidden' : '🔒 Hide Text'}</button>)}</label>
                <div className="relative">
                   <input type="text" id="context" value={verseContext} onChange={(e) => { setVerseContext(e.target.value); setPrediction(null); }} placeholder={isHifzMode ? "Type start of ayah (Optional)..." : "e.g. Surah Al-Fatiha"} disabled={appState === AppState.ANALYZING} className={`w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all outline-none focus:ring-2 ${isHifzMode ? 'focus:ring-teal-500 focus:border-teal-500' : 'focus:ring-emerald-500 focus:border-emerald-500'} ${isTextHidden ? 'text-transparent bg-slate-50 dark:bg-slate-900 focus:text-slate-900 focus:bg-white select-none' : ''} ${isHifzMode && isArabicInput ? 'font-arabic' : ''}`} dir={isArabicInput ? 'rtl' : 'ltr'} />
                   {isTextHidden && verseContext && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-slate-400 text-sm italic">Hidden for self-testing...</span></div>}
                   {isHifzMode && isArabicInput && verseContext.trim().length > 2 && !isTextHidden && !prediction && (<button onClick={handlePredict} disabled={isPredicting} className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-full transition-colors z-20" style={{ left: isArabicInput ? '2px' : 'auto', right: isArabicInput ? 'auto' : '2px' }}>{isPredicting ? <span className="animate-spin block">⏳</span> : <span className="text-lg">✨</span>}</button>)}
                </div>
              </div>
              {prediction && (<div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 animate-fade-in-up"><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">AI Suggestion</span><button onClick={() => setPrediction(null)} className="text-slate-400 hover:text-slate-600">✕</button></div><p className="font-arabic text-xl text-slate-800 dark:text-slate-100 leading-relaxed text-right mb-3" dir="rtl">{prediction}</p><button onClick={handleAddPrediction} className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 py-1.5 rounded-md text-sm font-bold hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"><span>⬇️</span> Add to Text</button></div>)}
            </div>

            <Recorder onRecordingComplete={handleRecordingComplete} isProcessing={appState === AppState.ANALYZING} />

            {appState === AppState.IDLE && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-8">
                {[
                  { icon: isHifzMode ? "🧠" : "🔊", title: isHifzMode ? "Test Memory" : "Clear Audio", desc: isHifzMode ? "Don't look at the Mushaf." : "Recite in a quiet room." },
                  { icon: "🧘", title: "Take Your Time", desc: "Recite slowly (Tartil) to check rules." },
                  { icon: "📖", title: "Any Surah", desc: "Start with short Surahs to practice." }
                ].map((tip, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center transition-colors">
                    <span className="text-2xl mb-2 block">{tip.icon}</span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{tip.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tip.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
        <p className="mb-2">© {new Date().getFullYear()} QariAI. Built with Gemini & Hafiz-LM.</p>
        <div className="flex justify-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
          <button onClick={() => setViewingLegal('PRIVACY')} className="hover:text-emerald-600 hover:underline">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setViewingLegal('TERMS')} className="hover:text-emerald-600 hover:underline">Terms of Service</button>
          <span>•</span>
          <button onClick={handleDownloadReadme} className="hover:text-emerald-600 hover:underline">Download Docs</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
