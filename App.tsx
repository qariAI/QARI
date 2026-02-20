
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
import { analyzeRecitation } from './services/geminiService';
import { getProgress, updateProgress, logHifzItem, saveProgress, updateGoals, getDailyGoalProgress, getDueRevisions } from './services/progressService';
import { checkLocalBackendHealth, predictNextWords } from './services/hafizService';
import { README_CONTENT } from './services/docsService';

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
  
  // Legal & Consent State
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [viewingLegal, setViewingLegal] = useState<'NONE' | 'PRIVACY' | 'TERMS'>('NONE');
  
  // Hafiz-LM / AI State
  // Default to CLOUD so features are available immediately without waiting for local check
  const [aiBackend, setAiBackend] = useState<'CLOUD' | 'LOCAL'>('CLOUD');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Progress State
  const [userStats, setUserStats] = useState<UserStats>(getProgress());
  const [sessionXP, setSessionXP] = useState<number>(0);
  const [goalProgress, setGoalProgress] = useState(getDailyGoalProgress(userStats));
  const [dueRevisionsCount, setDueRevisionsCount] = useState(0);

  // Initial Load: Check Backend Health ONCE
  useEffect(() => {
    checkLocalBackendHealth().then((isLocal) => {
      if (isLocal) setAiBackend('LOCAL');
    });

    // Check Consent
    const consent = localStorage.getItem('qariai_consent_v1');
    if (consent === 'true') {
      setHasConsented(true);
    }
  }, []);

  // Update Stats on State Change
  useEffect(() => {
    const stats = getProgress();
    setUserStats(stats);
    setGoalProgress(getDailyGoalProgress(stats));
    setDueRevisionsCount(getDueRevisions(stats).length);
  }, [appState]);

  const handleConsent = () => {
    localStorage.setItem('qariai_consent_v1', 'true');
    setHasConsented(true);
  };

  const changeLevel = (level: ProficiencyLevel) => {
    const newStats = { ...userStats, proficiencyLevel: level };
    setUserStats(newStats);
    saveProgress(newStats);
  };

  const handleUpdateGoals = (newGoals: UserGoals) => {
    const updatedStats = updateGoals(newGoals);
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

  // Convert Blob to Base64 (needed for Gemini API)
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

  // Add to your app (before API calls)
  const checkRateLimit = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('qariai_api_usage');
    const usage = stored ? JSON.parse(stored) : { date: today, count: 0 };
    
    // Reset if new day
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
    }
    
    // Check limit (20 per day for beta)
    if (usage.count >= 20) {
      alert('Daily limit reached! Try again tomorrow. 🌙');
      return false;
    }
    
    // Increment
    usage.count++;
    localStorage.setItem('qariai_api_usage', JSON.stringify(usage));
    return true;
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!checkRateLimit()) return; // Block if limit reached

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    setAutoHifzSaved(false);
    setPrediction(null); // Clear any pending predictions
    
    const url = URL.createObjectURL(audioBlob);
    setUserAudioUrl(url);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const data = await analyzeRecitation(
        base64Audio, 
        audioBlob.type, 
        verseContext, 
        isHifzMode,
        userStats.proficiencyLevel
      );
      
      const { newStats: statsAfterUpdate, xpGained } = updateProgress(userStats, data, verseContext, isHifzMode);
      
      let finalStats = statsAfterUpdate;
      let savedAutomatically = false;

      if (isHifzMode && data.surah_number && data.ayah_number) {
        // Only block auto-save if there are MAJOR errors (Memory omission, wrong letter).
        // Moderate errors (timing, minor sifaat) are allowed for auto-log, assuming the user will refine later.
        const severeMistakes = data.mistakes.filter(m => m.severity === 'Major');
        if (severeMistakes.length === 0) {
           finalStats = logHifzItem(statsAfterUpdate, data);
           savedAutomatically = true;
        }
      }

      setUserStats(finalStats);
      setSessionXP(xpGained);
      setFeedback(data);
      setAutoHifzSaved(savedAutomatically);
      setAppState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to analyze recitation. Please check your internet connection and API key.");
      setAppState(AppState.ERROR);
    }
  };

  const handleAddToHifz = (data: FeedbackData) => {
    const updatedStats = logHifzItem(userStats, data);
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
    if (userAudioUrl) {
      URL.revokeObjectURL(userAudioUrl);
      setUserAudioUrl(null);
    }
  };

  // Legal Views Handling
  if (viewingLegal === 'PRIVACY') {
    return <PrivacyPolicy onBack={() => setViewingLegal('NONE')} />;
  }
  if (viewingLegal === 'TERMS') {
    return <TermsOfService onBack={() => setViewingLegal('NONE')} />;
  }
  
  // Levels Guide View
  if (isGuideOpen) {
    return <LevelsGuide onClose={() => setIsGuideOpen(false)} />;
  }

  const isRecordingOrAnalyzing = appState === AppState.RECORDING || appState === AppState.ANALYZING;
  const isArabicInput = /[\u0600-\u06FF]/.test(verseContext);

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-200 ${isHifzMode ? 'bg-teal-50 text-teal-900' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Consent Modal Gatekeeper */}
      {!hasConsented && (
        <ConsentModal 
          onAccept={handleConsent} 
          onViewPrivacy={() => setViewingLegal('PRIVACY')} 
          onViewTerms={() => setViewingLegal('TERMS')}
        />
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => !isRecordingOrAnalyzing && setAppState(AppState.IDLE)}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl ${isHifzMode ? 'bg-teal-700' : 'bg-emerald-700'}`}>Q</div>
            <span className={`text-xl font-serif font-bold ${isHifzMode ? 'text-teal-950' : 'text-emerald-950'}`}>QariAI</span>
            <span className={`hidden sm:inline-block ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wide transition-colors ${aiBackend === 'LOCAL' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
                {aiBackend === 'LOCAL' ? '✨ Local AI' : '☁️ Cloud AI'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Help/Guide Button */}
             <button
                onClick={() => setIsGuideOpen(true)}
                disabled={isRecordingOrAnalyzing}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors"
                title="How it Works"
             >
                ?
             </button>

             <button 
              onClick={() => setAppState(prev => prev === AppState.DASHBOARD ? AppState.IDLE : AppState.DASHBOARD)}
              disabled={isRecordingOrAnalyzing}
              className={`p-1.5 pr-3 rounded-full flex items-center gap-2 transition-all border
                ${appState === AppState.DASHBOARD 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-white border-transparent hover:bg-slate-100 hover:border-slate-200'
                } ${isRecordingOrAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-lg border border-emerald-100 relative">
                  👤
                  {dueRevisionsCount > 0 && (
                     <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
                  )}
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Level {userStats.level}</span>
                  <span className="text-xs font-bold text-emerald-700">{userStats.streak} Day Streak</span>
                </div>
             </button>
          </div>
        </div>
      </nav>

      {isGoalModalOpen && (
        <GoalSetter 
          currentGoals={userStats.goals} 
          onSave={handleUpdateGoals} 
          onClose={() => setIsGoalModalOpen(false)} 
        />
      )}

      <main className="max-w-3xl mx-auto px-4 py-8 min-h-[calc(100vh-140px)]">
        {/* Error Display */}
        {appState === AppState.ERROR && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between">
            <p>{errorMsg || "An unexpected error occurred."}</p>
            <button 
              onClick={() => setAppState(AppState.IDLE)} 
              className="text-sm underline font-medium hover:text-red-900"
            >
              Try Again
            </button>
          </div>
        )}

        {/* View Switcher */}
        {appState === AppState.DASHBOARD ? (
          <Dashboard stats={userStats} onClose={() => setAppState(AppState.IDLE)} />
        ) : appState === AppState.RESULTS && feedback ? (
          <Feedback 
            data={feedback} 
            onReset={resetApp} 
            xpGained={sessionXP} 
            userAudioUrl={userAudioUrl} 
            onAddToHifz={handleAddToHifz}
            isHifzMode={isHifzMode}
            isAutoSaved={autoHifzSaved}
          />
        ) : (
          <div className="flex flex-col items-center space-y-8 animate-fade-in-up">
            
            {/* Daily Progress Card */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between gap-4">
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-xs font-bold text-slate-500 uppercase">Daily Goal</span>
                     <span className="text-xs font-bold text-emerald-600">{Math.round(goalProgress.minutes.current)} / {goalProgress.minutes.target} min</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${goalProgress.minutes.percent}%` }} />
                  </div>
               </div>
               
               {dueRevisionsCount > 0 && (
                   <button 
                     onClick={() => setAppState(AppState.DASHBOARD)}
                     className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 animate-pulse hover:bg-amber-200 transition-colors"
                   >
                     {dueRevisionsCount} Due for Revision
                   </button>
               )}

               <button 
                 onClick={() => setIsGoalModalOpen(true)}
                 className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
               >
                 ⚙️
               </button>
            </div>

            {/* Intro Text */}
            <div className="text-center space-y-3 max-w-lg">
              <h1 className={`text-4xl font-serif ${isHifzMode ? 'text-teal-900' : 'text-emerald-950'}`}>
                {isHifzMode ? "Hifz Companion" : "Improve Your Tajweed"}
              </h1>
              <p className="text-slate-600 text-lg">
                {isHifzMode 
                    ? "Recite from memory. We'll check your accuracy, fluency, and retention strength." 
                    : "Recite any verse. AI will listen and provide precise feedback on pronunciation."}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 w-full">
                <div className="bg-white p-1 rounded-full border border-slate-200 flex shadow-sm relative">
                    <button
                        onClick={() => !isRecordingOrAnalyzing && setIsHifzMode(false)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all z-10 ${!isHifzMode ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tajweed Coach
                    </button>
                    <button
                        onClick={() => !isRecordingOrAnalyzing && setIsHifzMode(true)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all z-10 ${isHifzMode ? 'bg-teal-100 text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Hifz Mode
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-2 mr-1">Level</span>
                    {(['Beginner', 'Intermediate', 'Advanced'] as ProficiencyLevel[]).map((level) => (
                        <button
                            key={level}
                            onClick={() => changeLevel(level)}
                            disabled={isRecordingOrAnalyzing}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all
                                ${userStats.proficiencyLevel === level 
                                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Context Input */}
            <div className="w-full max-w-md space-y-2">
              <div className="relative group">
                <label htmlFor="context" className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                  <span>{isHifzMode ? "What are you reciting?" : "Which Surah/Ayah? (Optional)"}</span>
                  {isHifzMode && (
                     <button 
                       onClick={() => setIsTextHidden(!isTextHidden)}
                       className={`text-xs font-bold flex items-center gap-1 ${isTextHidden ? 'text-teal-600' : 'text-slate-400'}`}
                     >
                       {isTextHidden ? '👁️ Text Hidden' : '🔒 Hide Text'}
                     </button>
                  )}
                </label>
                
                <div className="relative">
                   <input
                      type="text"
                      id="context"
                      value={verseContext}
                      onChange={(e) => {
                          setVerseContext(e.target.value);
                          setPrediction(null);
                      }}
                      placeholder={isHifzMode ? "Type start of ayah (Arabic)..." : "e.g. Surah Al-Fatiha"}
                      disabled={appState === AppState.ANALYZING}
                      className={`
                          w-full px-4 py-2 rounded-lg border border-slate-300 transition-all outline-none focus:ring-2 
                          ${isHifzMode ? 'focus:ring-teal-500 focus:border-teal-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}
                          ${isTextHidden ? 'text-transparent bg-slate-50 focus:text-slate-900 focus:bg-white select-none' : ''} 
                          ${isHifzMode && isArabicInput ? 'font-arabic' : ''}
                      `}
                      dir={isArabicInput ? 'rtl' : 'ltr'}
                   />
                   
                   {isTextHidden && verseContext && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-slate-400 text-sm italic">Hidden for self-testing...</span>
                      </div>
                   )}

                   {isHifzMode && isArabicInput && verseContext.trim().length > 2 && !isTextHidden && !prediction && (
                      <button
                        onClick={handlePredict}
                        disabled={isPredicting}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors z-20"
                        style={{ left: isArabicInput ? '2px' : 'auto', right: isArabicInput ? 'auto' : '2px' }} 
                        title="Predict next words (AI Assistant)"
                      >
                         {isPredicting ? <span className="animate-spin block">⏳</span> : <span className="text-lg">✨</span>}
                      </button>
                   )}
                </div>
              </div>

              {prediction && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 animate-fade-in-up">
                    <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">AI Suggestion</span>
                         <button onClick={() => setPrediction(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <p className="font-arabic text-xl text-slate-800 leading-relaxed text-right mb-3" dir="rtl">{prediction}</p>
                    <button 
                        onClick={handleAddPrediction}
                        className="w-full bg-white border border-emerald-200 text-emerald-700 py-1.5 rounded-md text-sm font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>⬇️</span> Add to Text
                    </button>
                </div>
              )}
            </div>

            <Recorder 
              onRecordingComplete={handleRecordingComplete} 
              isProcessing={appState === AppState.ANALYZING} 
            />

            {appState === AppState.IDLE && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-8">
                {[
                  { icon: isHifzMode ? "🧠" : "🔊", title: isHifzMode ? "Test Memory" : "Clear Audio", desc: isHifzMode ? "Don't look at the Mushaf." : "Recite in a quiet room." },
                  { icon: "🧘", title: "Take Your Time", desc: "Recite slowly (Tartil) to check rules." },
                  { icon: "📖", title: "Any Surah", desc: "Start with short Surahs to practice." }
                ].map((tip, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <span className="text-2xl mb-2 block">{tip.icon}</span>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{tip.title}</h3>
                    <p className="text-xs text-slate-500">{tip.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer with Legal Links */}
      <footer className="text-center py-8 text-slate-400 text-sm border-t border-slate-100 mt-auto bg-slate-50/50">
        <p className="mb-2">© {new Date().getFullYear()} QariAI. Built with Gemini 2.5 & Hafiz-LM.</p>
        <div className="flex justify-center gap-4 text-xs font-bold text-slate-500">
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
