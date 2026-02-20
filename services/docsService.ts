
export const README_CONTENT = `# QariAI - AI-Powered Qur'an Recitation Coach

![QariAI Banner](https://via.placeholder.com/1200x400?text=QariAI+Recitation+Coach)

**QariAI** is an advanced web application designed to help users improve their Qur'an recitation (Tajweed) and test their memorization (Hifz). It utilizes state-of-the-art AI models—including Google's Gemini 2.5 Flash and a custom fine-tuned local LLM (Hafiz-LM)—to provide precise, phoneme-level feedback on pronunciation, timing, and accuracy.

## 🌟 Features

### 🎧 Tajweed Coach
- **Real-time Audio Analysis:** Records your recitation and analyzes it against Tajweed rules.
- **Granular Feedback:** Detects errors in *Makharij* (articulation points), *Sifaat* (characteristics), *Ghunnah* levels, and *Madd* timing.
- **Visual Corrections:** Highlights specific mistakes on the verse text with detailed coaching tips (mouth shape, tongue position).
- **Scoring System:** Strict, professional-grade scoring algorithm that penalizes specific technical flaws.

### 🧠 Hifz (Memorization) Companion
- **Memory Testing:** Recite from memory without looking at the text.
- **Error Detection:** Identifies omissions, substitutions, and additions using ASR (Automatic Speech Recognition).
- **Spaced Repetition System (SRS):** Automatically schedules revisions based on your performance (SuperMemo-2 algorithm) to ensure long-term retention.

### 📊 Progress Tracking
- **Analytics Dashboard:** Visualizes weak letters, common rule violations, and accuracy trends over time.
- **XP & Leveling:** Gamified experience with streaks, daily goals, and proficiency levels (Beginner to Advanced).
- **Heatmaps & Sparklines:** Track your consistency and improvement rates.

### 🤖 Dual AI Backend
- **Cloud Mode:** Uses Google Gemini 2.5 Flash for high-speed, high-accuracy analysis (Default).
- **Local Mode (Optional):** Supports a custom fine-tuned LLM (Hafiz-LM based on Qwen2.5) running locally for privacy-focused or offline-capable inference.

---

## 🛠️ Tech Stack

**Frontend:**
- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS
- **Audio:** Web Audio API (Custom Waveform & Recorder)
- **State Persistence:** LocalStorage

**AI & Backend:**
- **Cloud:** Google GenAI SDK (gemini-2.5-flash-preview)
- **Local Backend:** Python, FastAPI, PyTorch
- **Local Model:** Qwen/Qwen2.5-1.5B-Instruct (Fine-tuned with Peft/LoRA)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+ (Only for Local Backend)
- A Google Gemini API Key

### 1. Frontend Setup

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/yourusername/qariai.git
    cd qariai
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

3.  **Configure API Key:**
    Create a \`.env\` file in the root directory and add your Google Gemini API key:
    \`\`\`env
    API_KEY=your_google_api_key_here
    \`\`\`
    *Note: In the current demo setup, the key is accessed via \`process.env.API_KEY\`. Ensure your bundler (Vite/Webpack) is configured to expose this or use a proxy server for production.*

4.  **Run the application:**
    \`\`\`bash
    npm start
    \`\`\`

### 2. Local Backend Setup (Optional)

If you want to use the local \`Hafiz-LM\` model instead of calling Google's API for Hifz verification:

1.  **Navigate to the backend folder:**
    \`\`\`bash
    cd backend
    \`\`\`

2.  **Install Python dependencies:**
    \`\`\`bash
    pip install -r requirements.txt
    \`\`\`

3.  **Prepare Training Data (One-time):**
    \`\`\`bash
    python prepare_data.py
    \`\`\`

4.  **Train/Fine-tune the Model (Requires GPU):**
    \`\`\`bash
    python train.py
    \`\`\`
    *This will create the adapter weights in \`Hafiz-LM-1.5B-v1\`.*

5.  **Run the API Server:**
    \`\`\`bash
    uvicorn app:app --reload --port 8000
    \`\`\`

6.  **Connect Frontend:**
    The React app automatically checks \`http://localhost:8000/health\` on startup. If the local server is running, it will switch the "Cloud AI" badge to "Local AI".

---

## 📱 Usage Guide

1.  **Select Mode:** Toggle between "Tajweed Coach" (reading) and "Hifz Mode" (memory).
2.  **Set Context:** Type the Surah name or the start of the Ayah you are reciting.
3.  **Recite:** Tap the microphone and recite clearly.
4.  **Review:**
    - Click on highlighted words to see specific errors.
    - Read the "Coaching Details" for physical instructions on how to fix the mistake.
    - Listen to the reference audio (Mishary Rashid Alafasy) to compare.
5.  **Dashboard:** Check the dashboard to see your daily goals and due Hifz revisions.
6.  **Export Data:** Use the Backup feature in the Dashboard to save your progress JSON file.

---

## 🛡️ Privacy & Disclaimer

- **Audio Data:** Audio is processed in memory and sent to the AI provider (Google) solely for analysis. It is not permanently stored on our servers.
- **Educational Tool:** QariAI is an educational aid, not a replacement for a qualified human teacher (Sheikh/Ustad). It provides technical feedback but cannot grant Ijazah.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any features, bug fixes, or dataset improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`;
