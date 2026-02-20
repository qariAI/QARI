
import React from 'react';

interface TermsProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsProps> = ({ onBack }) => {
  return (
    <div className="bg-white min-h-screen p-6 md:p-12 text-slate-800">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={onBack}
          className="mb-6 text-emerald-600 font-bold hover:underline flex items-center gap-2"
        >
          ← Back to App
        </button>
        
        <h1 className="text-3xl font-serif font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-emerald max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using QariAI, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. Nature of the Service (AI Disclaimer)</h2>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded my-4">
              <p className="font-bold text-amber-800">CRITICAL DISCLAIMER:</p>
              <p className="text-amber-900 mt-1 text-sm">
                QariAI uses Artificial Intelligence to analyze Quranic recitation. <strong>It is a tool, not a human scholar.</strong>
              </p>
            </div>
            <p>
              While we strive for high accuracy in Tajweed and Hifz detection:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Errors Possible:</strong> The AI may occasionally misinterpret audio, especially with background noise or specific accents.</li>
              <li><strong>Not a Certification:</strong> A high score on QariAI does not constitute an "Ijazah" (license to teach) or formal religious certification.</li>
              <li><strong>Consult Scholars:</strong> For authoritative learning, always refer to a qualified human teacher (Sheikh/Sheikha).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the app for any illegal purpose.</li>
              <li>Upload or record audio that is offensive, profane, or unrelated to Quranic recitation.</li>
              <li>Attempt to reverse engineer the application code.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. Intellectual Property</h2>
            <p>
              <strong>Our IP:</strong> The QariAI code, design, and branding are owned by us.
            </p>
            <p>
              <strong>Your IP:</strong> You retain ownership of your voice recordings. By using the app, you grant us a limited, non-exclusive license to process these recordings solely for the purpose of providing you with feedback.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, QariAI shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. We do not guarantee that the service will be uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
