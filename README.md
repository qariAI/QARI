# QariAI - AI-Powered Qur'an Recitation Coach

![QariAI Banner](https://via.placeholder.com/1200x400?text=QariAI+Recitation+Coach)

**QariAI** is an advanced web application designed to help users improve their Qur'an recitation (Tajweed) and test their memorization (Hifz). It utilizes state-of-the-art AI models—including Google's Gemini 2.5 Flash and a custom fine-tuned local LLM (Hafiz-LM)—to provide precise, phoneme-level feedback on pronunciation, timing, and accuracy.

## 🌟 Features

### 🔐 Authentication & Cloud Sync
- **Google Sign-In:** Securely log in using your Google account.
- **Real-time Cloud Sync:** Your progress, levels, and Hifz journey are automatically saved to **Firebase Firestore**.
- **Cross-Device Progress:** Pick up exactly where you left off on any device.

### 🎧 Tajweed Coach
- **Real-time Audio Analysis:** Records your recitation and analyzes it against Tajweed rules.
- **Granular Feedback:** Detects errors in *Makharij* (articulation points), *Sifaat* (characteristics), *Ghunnah* levels, and *Madd* timing.
- **Visual Corrections:** Highlights specific mistakes on the verse text with detailed coaching tips (mouth shape, tongue position).
- **Scoring System:** Strict, professional-grade scoring algorithm that penalizes specific technical flaws.

### 🧠 Hifz (Memorization) Companion
- **Memory Testing:** Recite from memory without looking at the text.
- **Error Detection:** Identifies omissions, substitutions, and additions using ASR (Automatic Speech Recognition).
- **Spaced Repetition System (SRS):** Automatically schedules revisions based on your performance (SuperMemo-2 algorithm).
- **Interactive Heatmap:** Visual progress map of the entire Juz 30 to track your memorization coverage.

### 📊 Progress Tracking
- **Analytics Dashboard:** Visualizes weak letters, common rule violations, and accuracy trends over time.
- **XP & Leveling:** Gamified experience with streaks, daily goals, and proficiency levels (Beginner to Advanced).
- **Heatmaps & Sparklines:** Track your consistency and improvement rates.

### 🤖 Dual AI Backend
- **Cloud Mode:** Uses Google Gemini 2.5 Flash for high-speed, high-accuracy analysis (Default).
- **Local Mode (Optional):** Supports a custom fine-tuned LLM (`Hafiz-LM` based on Qwen2.5) running locally.

---

## 🛠️ Tech Stack

**Frontend:**
- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS (with Dark Mode support)
- **Audio:** Web Audio API (Custom Waveform & Recorder)
- **Backend-as-a-Service:** Firebase (Auth & Firestore)

**AI & Backend:**
- **Cloud:** Google GenAI SDK (`gemini-2.5-flash-preview`)
- **Local Backend:** Python, FastAPI, PyTorch
- **Local Model:** Qwen/Qwen2.5-1.5B-Instruct (Fine-tuned with Peft/LoRA)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key
- A Firebase Project

### 1. Project Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/qariai.git
    cd qariai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your keys:
    ```env
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Firebase Configuration:**
    Update the `firebaseConfig` in `services/firebase.ts` with your project's credentials from the Firebase Console.

5.  **Run the application:**
    ```bash
    npm run dev
    ```

---

## 📱 Usage Guide

1.  **Login:** Sign in with Google to enable cloud saving.
2.  **Select Mode:** Toggle between "Tajweed Coach" and "Hifz Mode".
3.  **Recite:** Tap the microphone and recite clearly.
4.  **Review:** 
    - Tap words to see errors or hear **reference audio** (Mishary Rashid Alafasy).
    - Check the **Heatmap** in the Dashboard to see your memorization progress.
5.  **Theme:** Toggle **Dark Mode** for comfortable night recitation.

---

## 🛡️ Privacy & Disclaimer

- **Audio Data:** Audio is processed in memory and analyzed via Google Gemini.
- **Educational Tool:** QariAI is an aid, not a replacement for a qualified human teacher.

## 📄 License

This project is licensed under the MIT License.
