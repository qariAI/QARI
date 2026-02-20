
import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="bg-white min-h-screen p-6 md:p-12 text-slate-800">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={onBack}
          className="mb-6 text-emerald-600 font-bold hover:underline flex items-center gap-2"
        >
          ← Back to App
        </button>
        
        <h1 className="text-3xl font-serif font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-emerald max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Introduction</h2>
            <p>
              Welcome to QariAI ("we," "our," or "us"). We are committed to protecting your privacy. 
              This Privacy Policy explains how our application collects, uses, and safeguards your information 
              when you use our Qur'an recitation coaching service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Audio Recordings:</strong> We collect audio data solely when you tap the microphone button to practice recitation.</li>
              <li><strong>Usage Data:</strong> We track progress metrics (XP, streaks, accuracy scores) which are stored locally on your device.</li>
              <li><strong>Device Information:</strong> We may collect basic device model information to optimize audio processing settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. How We Use Your Audio (Microphone Permissions)</h2>
            <p>
              <strong>We do not use your microphone without your explicit action.</strong>
            </p>
            <p className="mt-2">
              When you grant microphone permission, audio is captured for the specific purpose of:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Analyzing Tajweed (pronunciation) accuracy.</li>
              <li>Detecting memorization errors (Hifz mode).</li>
              <li>Generating feedback via our AI processing partners.</li>
            </ul>
            <p className="mt-2">
              Your audio is <strong>not</strong> used for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. Third-Party AI Processing</h2>
            <p>
              To provide accurate feedback, audio data or its transcription is processed using third-party AI services:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Google Gemini API:</strong> We send anonymized audio data/transcripts to Google's Generative AI to analyze pronunciation and Tajweed rules. Google does not use this data to train their models in the standard API tier, in accordance with their enterprise data terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Data Retention</h2>
            <p>
              <strong>Audio Files:</strong> Audio recorded during a session is processed immediately and typically discarded after feedback is generated. We do not permanently store your raw audio files on our servers unless you explicitly save a session for future review (feature dependent).
            </p>
            <p>
              <strong>Progress Data:</strong> Your stats (Level, Streak, Hifz lists) are stored locally on your device via LocalStorage. If you clear your browser cache, this data may be lost.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. Your Rights (GDPR & CCPA)</h2>
            <p>Depending on your location, you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
              <li><strong>Deletion:</strong> Request that we delete your data. Since most data is stored locally, you can achieve this by clearing your app data/cache.</li>
              <li><strong>Withdraw Consent:</strong> You can revoke microphone permission at any time via your device settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Children's Privacy</h2>
            <p>
              QariAI is an educational tool suitable for all ages. However, we do not knowingly collect personal identifiable information (PII) like names, emails, or addresses from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">8. Contact Us</h2>
            <p>
              If you have questions about this policy or our handling of your data, please contact us at: <br/>
              <span className="font-mono bg-slate-100 px-1 rounded">privacy@qariai.com</span> (Placeholder)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
