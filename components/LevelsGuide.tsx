
import React from 'react';

interface LevelsGuideProps {
  onClose: () => void;
}

const LevelCard: React.FC<{
  title: string;
  subtitle: string;
  icon: string;
  colorClass: string;
  borderColor: string;
  whoFor: string;
  focusAreas: string[];
  experience: string[];
  progression: string;
  quote: string;
}> = ({ title, subtitle, icon, colorClass, borderColor, whoFor, focusAreas, experience, progression, quote }) => (
  <div className={`relative overflow-hidden rounded-2xl border-2 ${borderColor} ${colorClass} p-6 md:p-8 mb-8 transition-transform hover:scale-[1.01]`}>
    <div className="flex items-start justify-between mb-6 relative z-10">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl shadow-sm bg-white/50 rounded-full p-2">{icon}</span>
          <h3 className="text-2xl font-serif font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500 opacity-80">{subtitle}</p>
      </div>
    </div>

    <div className="space-y-6 relative z-10">
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Who is this for?</h4>
        <p className="text-slate-700 leading-relaxed bg-white/40 p-3 rounded-lg border border-white/20">
          {whoFor}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Key Focus Areas</h4>
          <ul className="space-y-2">
            {focusAreas.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                <span className="mt-1 text-emerald-600">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-2 opacity-70">Your Experience</h4>
          <ul className="space-y-2">
            {experience.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                <span className="mt-1 text-emerald-600">➜</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white/60 p-4 rounded-xl border border-white/40">
        <h4 className="text-sm font-bold uppercase tracking-wide mb-1 text-slate-800">🚀 Moving Up</h4>
        <p className="text-slate-700 text-sm">{progression}</p>
      </div>

      <div className="pt-4 border-t border-slate-200/50">
        <p className="font-serif italic text-slate-600 text-center text-sm">"{quote}"</p>
      </div>
    </div>
  </div>
);

const LevelsGuide: React.FC<LevelsGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] overflow-y-auto animate-fade-in-up">
      {/* Navbar for the Guide */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h1 className="font-serif font-bold text-xl text-slate-800">Progression Guide</h1>
        </div>
        <button 
          onClick={onClose}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold text-sm transition-colors"
        >
          Close Guide
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        
        {/* Introduction */}
        <section className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-emerald-900 mb-4">
            Your Journey with QariAI
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            Assalamu Alaikum wa Rahmatullah! Welcome to your personal companion on the path to mastering the Holy Qur’an.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            In QariAI, "leveling up" is not just about earning points—it is a reflection of your spiritual journey to beautify the words of Allah. 
            As the Prophet (ﷺ) said: <strong>"Read and rise."</strong> Our goal is to help you recite with <em>Tartil</em> (measured, distinct recitation), 
            transforming your recitation from a struggle into a source of tranquility.
          </p>
          <div className="bg-emerald-50 inline-block px-6 py-3 rounded-xl border border-emerald-100 text-sm text-emerald-800 font-medium">
            Your level is determined by: <br/>
            <strong>Accuracy Score</strong> • <strong>Experience Points (XP)</strong> • <strong>Consistency (Streak)</strong>
          </div>
        </section>

        {/* Levels */}
        <LevelCard 
          title="Beginner"
          subtitle="The Foundation of the House"
          icon="🌱"
          colorClass="bg-emerald-50"
          borderColor="border-emerald-200"
          whoFor="Designed for those learning to read for the first time, returning after a long pause, or struggling with basic pronunciation. If you confuse 'Seen' vs 'Saad', start here."
          focusAreas={[
            "Correcting Major Errors (Lahm Jali).",
            "Makharij: Ensuring sound comes from the correct throat/tongue position.",
            "Harakat: Distinguishing short vowels clearly.",
            "Basic Madd: Respecting 2-count elongations."
          ]}
          experience={[
            "Micro-Drills for single letters and short words.",
            "Gentle feedback overlooking minor timing nuances.",
            "Focus on daily consistency to build the habit."
          ]}
          progression="Achieve a consistent Tajweed Score of 70%+ on basic verses to prove your foundation is solid."
          quote="Verily, the one who recites the Qur’an beautifully... will be in the company of the noble and obedient angels. (Bukhari)"
        />

        <LevelCard 
          title="Intermediate"
          subtitle="The Art of Refinement"
          icon="🌿"
          colorClass="bg-teal-50"
          borderColor="border-teal-200"
          whoFor="For the fluent reader who wants to apply Tajweed rules correctly. You know the letters, but need to master the rhythm, nasal sounds (Ghunnah), and echoes (Qalqalah)."
          focusAreas={[
            "Correcting Minor Errors (Lahm Khafi).",
            "Timing & Rhythm: Perfecting Ghunnah and Madd duration.",
            "Noon & Meem Rules: Ikhfa, Idgham, Iqlab.",
            "Qalqalah: Correct bouncing of the 5 letters."
          ]}
          experience={[
            "Regenerate Drills for complex rule combinations.",
            "Visual Radar Chart feedback to balance Flow vs Accuracy.",
            "Streak maintenance becomes crucial for XP multipliers."
          ]}
          progression="Maintain an Average Score of 85%+ over 7 days and minimize timing errors."
          quote="Beautify the Qur’an with your voices, for indeed the beautiful voice increases the Qur’an in beauty. (Sunan al-Darimi)"
        />

        <LevelCard 
          title="Advanced"
          subtitle="Mastery & Ihsan"
          icon="🌳"
          colorClass="bg-gradient-to-br from-indigo-50 to-purple-50"
          borderColor="border-indigo-200"
          whoFor="For aspiring Huffaz, teachers, or those seeking Ihsan (perfection). You are refining the subtle characteristics (Sifaat) of every letter and breath."
          focusAreas={[
            "Sifaat: Hams (whisper), Istilla (heaviness), Safir (whistling).",
            "Tafkheem & Tarqeeq: Precise heavy/light qualities.",
            "Waqf & Ibtida: Perfect stopping and starting.",
            "Breath Control: Managing long verses smoothly."
          ]}
          experience={[
            "Elite drills for heavy/light transitions.",
            "Full Hifz Mode integration testing memory + Tajweed.",
            "Granular analytics tracking specific letter mastery."
          ]}
          progression="Consistently score 95%+. A drop in consistency may prompt a suggested review."
          quote="Read and elevate... for indeed your position is at the last verse you recite. (Abu Dawood)"
        />

        {/* Pro Tips */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-12">
          <h3 className="text-2xl font-serif font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span>🚀</span> Pro-Tips for Progression
          </h3>
          <ul className="grid md:grid-cols-2 gap-4">
            {[
              "Use the 'Regenerate' button in Dashboard to attack weak spots.",
              "Listen to the reference audio (Mishary) at 0.75x speed.",
              "Consistency > Quantity. 5 minutes daily is better than 1 hour weekly.",
              "Ensure a quiet environment. Clear audio = fair scoring.",
              "Watch the Radar Chart. A balanced shape means a balanced recitation.",
              "Don't rush! Tartil (slow, measured reading) is the key to high scores."
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                <span className="text-emerald-500 font-bold">•</span>
                <span className="text-slate-700 text-sm font-medium">{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing */}
        <section className="text-center max-w-2xl mx-auto bg-emerald-900 text-emerald-50 rounded-2xl p-8 shadow-xl">
          <span className="text-4xl block mb-4">🤲</span>
          <p className="font-serif text-lg leading-relaxed italic mb-4">
            "We pray that QariAI serves as a beneficial tool in your journey to master the Book of Allah. 
            Remember, this app is merely a mirror to help you see your progress; the true goal is the pleasure of Allah (SWT)."
          </p>
          <p className="font-bold text-emerald-200">
            May Allah make the Qur’an the spring of your heart. Keep practicing, keep sincere, and keep reciting!
          </p>
          <button 
            onClick={onClose}
            className="mt-8 bg-white text-emerald-900 px-8 py-3 rounded-full font-bold hover:bg-emerald-100 transition-colors shadow-lg"
          >
            Start Reciting
          </button>
        </section>

      </div>
    </div>
  );
};

export default LevelsGuide;
