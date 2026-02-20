
import React from 'react';

interface ConsentModalProps {
  onAccept: () => void;
  onViewPrivacy: () => void;
  onViewTerms: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept, onViewPrivacy, onViewTerms }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🛡️
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Welcome to QariAI</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            To provide you with AI-powered Tajweed coaching, we need to process your audio recordings. Your privacy is our priority.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 mb-6 space-y-3 border border-slate-100">
          <div className="flex gap-3">
            <span className="text-lg">🎤</span>
            <p>We only record audio when you tap the microphone button.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">🤖</span>
            <p>Audio is processed by AI (including Google Gemini) solely for analysis.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">🗑️</span>
            <p>Raw audio is not permanently stored on our servers.</p>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onAccept}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <span>I Agree & Continue</span>
          </button>
          
          <p className="text-[11px] text-center text-slate-400 px-4 leading-tight">
            By clicking "I Agree", you accept our<br/>
            <button onClick={onViewTerms} className="text-emerald-600 hover:underline font-bold">Terms of Service</button>
            {' '}and{' '}
            <button onClick={onViewPrivacy} className="text-emerald-600 hover:underline font-bold">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
