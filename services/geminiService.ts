
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { FeedbackData, ProficiencyLevel, Drill } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
You are QariAI, the world's most difficult and strict Quran recitation examiner. 
Your analysis is **BRUTAL**, **UNFORGIVING** and **HYPER-TECHNICAL**.

**CORE PHILOSOPHY:**
- **REALITY CHECK:** A typical "good" reciter usually makes 5-10 subtle mistakes. Their score should be **60-70**.
- **90+ SCORE:** Only for Qaris with Ijazah. If you give a 95 to a beginner, you have FAILED.
- **Any Major Error (Makhraj/Memory) AUTOMATICALLY caps the score at 65.**
- Do NOT inflate scores to be "nice". Precision is the only way to improve.

**SCORING TIERS (STRICTER):**
- **96-100 (Mutqin - Perfection):** Indistinguishable from a master Qari. Zero flaws. Not even a millisecond off.
- **85-95 (Excellent):** Zero Makharij errors. Perfect rules. Maybe 1 minor breath/timing nuance.
- **70-84 (Average Student):** Correct letters but "accent" issues or loose timing/rules.
- **50-69 (Weak):** Clear mistakes in pronunciation, rules, or consistency.
- **< 50 (Fail):** Wrong letters, missing words, or mumbled.

**MANDATORY DEDUCTION MATRIX (Apply CUMULATIVELY):**
1. **Major Makhraj Error (Wrong Letter):** **-25 points** per occurrence. (e.g. 'Ha' ح vs 'Haa' هـ, 'Dhad' ض vs 'Daal' د).
2. **Memory Error (Wrong Word/Omission):** **-40 points**.
3. **Missing/Incorrect Ghunnah/Idgham:** **-15 points** per occurrence.
4. **Missing/Incorrect Qalqalah:** **-15 points** per occurrence.
5. **Madd Timing Error:** **-15 points** (e.g. short vowels elongated, or long vowels cut short).
6. **Tafkheem (Heaviness) Error:** **-10 points** (Light letter made heavy or vice versa).
7. **Vowel Corruption (Imalah):** **-10 points** (e.g. Fatha sounding like 'E').
8. **Missing Sifaat (Characteristics):** **-5 points** (e.g. lack of Hams/whisper on 'Ta'/'Kaaf').

**CRITICAL RULES:**
1.  **IF ANY MAJOR ERROR EXISTS, MAX SCORE IS 65.**
2.  **IF MORE THAN 3 TIMING ERRORS, MAX SCORE IS 75.**
3.  **IGNORE MELODY.** A beautiful voice covering up mistakes must be penalized HARSHLY (-10 extra for "trying to sing instead of recite").
4.  **PHYSICAL ARTICULATION:** Analyze formants. 'Qaf' must come from the uvula. 'Ain' from the epiglottis.
5.  **TIMING PHYSICS:** Measure Madd and Ghunnah in beats. If a 2-beat Madd is recited as 1.5 beats, **DEDUCT**.

**ADVANCED TAJWEED SCORING - NUANCE & LEVELS:**
1. **GHUNNAH (Nasalization) LEVELS:**
   - Detect the 4 levels of Ghunnah.
   - **Akmal (Most Complete):** Noon/Meem Mushaddadah, Idgham with Ghunnah. Duration: ~2 beats.
   - **Kamil (Complete):** Ikhfa, Iqlab. Duration: ~2 beats (but slightly different quality).
   - **Naqis (Incomplete):** Izhar. Brief nasal sound, no elongation.
   - **Anqas (Most Incomplete):** Voweled Noon/Meem. Minimal nasality.
   - *Error Example:* If user does Izhar on a Shaddah -> "Missed Akmal Ghunnah" (-15 pts).

2. **TAFKHEEM (Heaviness) LEVELS:**
   - Detect degrees of heaviness for letters (Kh, Sad, Dad, Gh, Ta, Qaf, Za).
   - *Error Example:* 'Qaf' with Kasrah sounding like 'Kaf' (Total loss of Tafkheem).
   - *Error Example:* 'Ra' with Fatha sounding light (Tarqeeq).

3. **QALQALAH LEVELS:**
   - **Kubra (Major):** At the end of a verse/stop with Shaddah (strongest echo).
   - **Wusta (Medium):** At the end of a verse/stop without Shaddah.
   - **Sughra (Minor):** In the middle of a word/sentence.
   - *Error Example:* Making Sughra too loud (like a vowel) or missing it entirely (-15 pts).

**BREATH CONTROL & WAQF ANALYSIS:**
1.  **INTENTIONAL VS. FORCED STOPS:** Distinguish between a valid *Waqf* (stop) at the end of a verse/sentence versus stopping mid-word or mid-phrase due to running out of breath.
2.  **CLIPPED ENDINGS:** Detect if the final letter of a phrase is "clipped" (cut short abruptly) due to lack of breath.

RESPONSE FORMAT (JSON):
For each mistake, you MUST provide:
- 'verse_word': The Arabic word.
- 'letter': The specific Arabic letter involved.
- 'expected_ipa': The correct IPA symbol/sound.
- 'user_ipa': The IPA symbol/sound the user produced.
- 'issue': Brief description of the mismatch.
- 'category': One of ['Makharij', 'Timing', 'Sifaat', 'Memory'].
- 'hifz_error_type': One of ['OMISSION', 'SUBSTITUTION', 'ADDITION', 'NONE']. Use 'OMISSION' if the word was skipped.
- 'rule': Tajweed rule.
- 'rule_nuance': Specific detail about the rule level.
- 'severity': Minor/Moderate/Major.
- 'practice_tip': A specific physical muscle drill (e.g., "Press tip of tongue harder against upper roots").
- 'coaching_details':
    - 'mouth_shape': e.g., "Round lips", "Flat smile".
    - 'tongue_position': e.g., "Tip touching upper incisors".
    - 'airflow': e.g., "Explosive", "Continuous".
    - 'duration': e.g., "2 counts", "Short".

TONE:
- Clinical, precise, and strict.
- Do NOT use "good job" unless the score is above 90.
- Be direct about failure.
`;

const HIFZ_ASR_INSTRUCTION = `
You are a specialized **Hifz ASR (Automatic Speech Recognition) Verifier**.
Your Goal: Transcribe the user's recitation and strictly compare it against the requested Quranic verse (Uthmani text).

**AUDIO CLARITY CHECK:**
- If audio is mumbled, fast, or unclear -> **Flag as Major 'Memory' error** (Unintelligible). **Score ≤ 30**.
- **Encouragement:** "Recitation was not clear enough to fully assess Tajweed – MashaAllah for effort, but please speak louder/slower in a quiet place and try again."

**HIFZ VERIFICATION PROTOCOL:**
1.  **STRICT TRANSCRIPTION:** Transcribe the audio exactly.
2.  **DIFF & COMPARE:** Compare the transcription against the expected verse.
3.  **DETECT MEMORY ERRORS:**
    *   **OMISSION:** Did the user skip a word or phrase? -> Flag as Major 'Memory' error. Set 'hifz_error_type' to 'OMISSION'.
    *   **SUBSTITUTION:** Did the user swap a word? (e.g. 'Aleem' instead of 'Hakeem') -> Flag as Major 'Memory' error. Set 'hifz_error_type' to 'SUBSTITUTION'.
    *   **ADDITION:** Did the user add a word that doesn't exist? -> Flag as Major 'Memory' error. Set 'hifz_error_type' to 'ADDITION'.
4.  **TAJWEED (SECONDARY):** If the memory is correct, then (and only then) check for Articulation/Tajweed errors using the STRICT deduction matrix.

**SCORING FOR HIFZ MODE:**
*   **0-60%:** Unclear audio OR significant missing words. (FAIL)
*   **61-80%:** Memory correct but pronunciation is weak/average.
*   **81-94%:** Memory correct, Tajweed good but not perfect.
*   **95-100%:** Perfect memory and solid Tajweed.

**RESPONSE GUIDANCE:**
*   For **OMISSION** errors: The 'verse_word' must be the word that was SKIPPED (so we can highlight it in the text).
*   For **SUBSTITUTION** errors: The 'verse_word' must be the expected word.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    surah_number: { type: Type.INTEGER, description: "The number of the Surah (1-114)." },
    ayah_number: { type: Type.INTEGER, description: "The number of the Ayah." },
    quran_text_arabic: { type: Type.STRING, description: "The Arabic text of the recited verse(s). Use Uthmani script." },
    quran_text_transliteration: { type: Type.STRING, description: "English transliteration of the verse." },
    quran_text_translation: { type: Type.STRING, description: "English translation of the meaning." },
    positive_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 1-3 specific technical strengths (e.g., 'Excellent Qalqalah echo', 'Precise Ghunnah timing')."
    },
    mistakes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          verse_word: { type: Type.STRING, description: "The specific word from the Arabic text where the error occurred." },
          letter: { type: Type.STRING, description: "The specific Arabic letter where the error occurred." },
          expected_ipa: { type: Type.STRING, description: "Expected IPA symbol (e.g. /sˤ/)." },
          user_ipa: { type: Type.STRING, description: "User's IPA symbol (e.g. /s/)." },
          issue: { type: Type.STRING, description: "Description of what sounded wrong." },
          category: { type: Type.STRING, enum: ['Makharij', 'Timing', 'Sifaat', 'Memory'], description: "The category of the mistake." },
          hifz_error_type: { type: Type.STRING, enum: ['OMISSION', 'SUBSTITUTION', 'ADDITION', 'NONE'], description: "Type of memory error." },
          rule: { type: Type.STRING, description: "The name of the Tajweed rule involved." },
          rule_nuance: { type: Type.STRING, description: "Specific detail about the rule level/grade (e.g. 'Ghunnah was Naqis, expected Akmal' or 'Tafkheem Level 3 used instead of Level 1')." },
          severity: { type: Type.STRING, enum: ["Minor", "Moderate", "Major"] },
          practice_tip: { type: Type.STRING, description: "A correction drill." },
          coaching_details: {
            type: Type.OBJECT,
            properties: {
              mouth_shape: { type: Type.STRING, description: "Detailed physical instruction (e.g. 'Round lips tightly', 'Smile broadly', 'Drop jaw')." },
              tongue_position: { type: Type.STRING, description: "Detailed physical instruction (e.g. 'Tip touching upper incisors', 'Back of tongue raised')." },
              airflow: { type: Type.STRING, description: "Detailed physical instruction (e.g. 'Explosive burst', 'Continuous warm air', 'Stop air flow')." },
              duration: { type: Type.STRING, description: "Timing instruction (e.g. '2 counts', 'Short/staccato')." }
            },
            required: ["mouth_shape", "tongue_position", "airflow", "duration"]
          }
        },
        required: ["verse_word", "letter", "expected_ipa", "user_ipa", "issue", "category", "rule", "severity", "practice_tip", "coaching_details"]
      },
      description: "List of errors detected. Empty if perfect."
    },
    tajweed_score: { type: Type.NUMBER, description: "Overall score out of 100. Strictly based on technical accuracy, not melody." },
    hifz_feedback: { 
      type: Type.STRING, 
      description: "Assessment of memorization accuracy. Explicitly state if it matched the expected verse and was recited correctly from memory." 
    },
    score_breakdown: {
      type: Type.OBJECT,
      properties: {
        makharij: { type: Type.NUMBER, description: "Score out of 30" },
        madd_timing: { type: Type.NUMBER, description: "Score out of 20" },
        ghunnah: { type: Type.NUMBER, description: "Score out of 15" },
        qalqalah: { type: Type.NUMBER, description: "Score out of 10" },
        tafkheem_tarqeeq: { type: Type.NUMBER, description: "Score out of 10" },
        shaddah: { type: Type.NUMBER, description: "Score out of 10" },
        flow_breath: { type: Type.NUMBER, description: "Score out of 5" }
      },
      required: ["makharij", "madd_timing", "ghunnah", "qalqalah", "tafkheem_tarqeeq", "shaddah", "flow_breath"]
    },
    daily_practice: {
      type: Type.STRING,
      description: "A 30-60 second focused exercise based on the errors found."
    },
    encouragement: {
      type: Type.STRING,
      description: "1-2 supportive, spiritually uplifting sentences."
    }
  },
  required: ["surah_number", "ayah_number", "quran_text_arabic", "quran_text_transliteration", "quran_text_translation", "positive_points", "mistakes", "tajweed_score", "score_breakdown", "daily_practice", "encouragement"]
};

export const analyzeRecitation = async (
  audioBase64: string, 
  mimeType: string, 
  verseContext?: string, 
  isHifzMode?: boolean,
  proficiencyLevel: ProficiencyLevel = 'Beginner'
): Promise<FeedbackData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let promptText = "";
  let selectedSystemInstruction = BASE_SYSTEM_INSTRUCTION;

  if (isHifzMode) {
    // Switch to Hifz ASR Instruction
    selectedSystemInstruction = HIFZ_ASR_INSTRUCTION + `\nUSER PROFICIENCY LEVEL: ${proficiencyLevel.toUpperCase()}`;
    
    promptText = verseContext 
      ? `HIFZ VERIFICATION MODE: The user claims to be reciting ${verseContext} from memory.
         Perform a strict ASR check against the Mushaf.
         - Identify OMISSION errors (words skipped).
         - Identify SUBSTITUTION errors (wrong words used).
         - Ignore minor Tajweed if memory is wrong.
         - IF memory is correct, apply strict Tajweed deduction.
         Return JSON.`
      : `HIFZ VERIFICATION MODE: Identify the Surah/Ayah and check for memory accuracy.
         Perform a strict ASR check against the Mushaf.
         Return JSON.`;
  } else {
    // Standard Tajweed Instruction
    selectedSystemInstruction = BASE_SYSTEM_INSTRUCTION + `
      USER PROFICIENCY LEVEL: ${proficiencyLevel.toUpperCase()}
      
      INSTRUCTIONS FOR ${proficiencyLevel.toUpperCase()} LEVEL:
      ${proficiencyLevel === 'Beginner' 
        ? `- Focus strictly on MAJOR errors (wrong letters, completely missed madd, clear pronunciation fail).
           - Even for beginners, score accurately. If they make major errors, score < 60.
           - Ignore subtle timing nuances but DO NOT ignore articulation.
           - Tone: Encouraging but firm on accuracy.`
        : proficiencyLevel === 'Intermediate'
        ? `- Identify Major and Moderate errors.
           - Enforce Ghunnah and Qalqalah rules strictly.
           - Score < 70 if rules are missed.
           - Tone: Constructive coaching.`
        : `- Identify ALL errors including Minor (timing precision, levels of Ghunnah, Sifaat details).
           - Use advanced/classical Tajweed terminology.
           - Be highly precise about counts (Harakat) and Sifaat.
           - Score < 80 if perfection is not met.
           - Tone: Professional master-class coaching.`
      }`;

    promptText = verseContext 
      ? `Please analyze this recitation of ${verseContext}. Identify the Arabic text.
         CRITICAL: Filter out any singing or melody. Focus ONLY on the correctness of Makharij (exit points of letters) and Tajweed rules.
         Detect specific levels of Ghunnah (Akmal/Kamil/Naqis/Anqas) and Tafkheem (Levels 1-5).
         Apply the Deduction Matrix rigidly.
         Provide feedback in JSON format.`
      : `Please identify which Surah/Ayah is being recited.
         CRITICAL: Filter out any singing or melody. Focus ONLY on the correctness of Makharij (exit points of letters) and Tajweed rules.
         Detect specific levels of Ghunnah (Akmal/Kamil/Naqis/Anqas) and Tafkheem (Levels 1-5).
         Apply the Deduction Matrix rigidly.
         Provide feedback in JSON format.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            text: promptText
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          }
        ]
      },
      config: {
        systemInstruction: selectedSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as FeedbackData;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Drill Generator Schema
const DRILLS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    drills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          instructions: { type: Type.STRING },
          focus_rule: { type: Type.STRING },
          duration_seconds: { type: Type.INTEGER },
          reps: { type: Type.INTEGER }
        },
        required: ["title", "instructions", "focus_rule", "duration_seconds", "reps"]
      }
    }
  },
  required: ["drills"]
};

export const generatePracticeDrills = async (weakRule: string): Promise<Drill[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a strict, elite Quran recitation coach specializing in Muscle Memory. 
    Design 3 micro-drills to fix this specific weakness: ${weakRule}.
    
    CONSTRAINTS:
    - Each drill must be under 30 seconds.
    - Focus on a single PHYSICAL skill (e.g. tongue height, breath capacity, lip rounding).
    - Avoid general advice like "listen and repeat". Give mechanical instructions.
    - Output strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 intensity drills for ${weakRule}.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: DRILLS_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    return data.drills || [];
  } catch (error) {
    console.error("Drill Generation Error:", error);
    return [];
  }
};

export const generateQuranCompletion = async (partialText: string): Promise<string> => {
    if (!process.env.API_KEY) return "";
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are a specialized Quran assistant.
        Task: Complete the following Quranic verse.
        Input: "${partialText}"
        Instructions:
        1. Identify the Surah and Ayah.
        2. Provide ONLY the next 3-5 words of the verse in Arabic Uthmani script.
        3. Do NOT provide the full ayah if it's long, just the next phrase.
        4. Output strictly the Arabic text completion, nothing else.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text.trim();
    } catch (e) {
        console.error("Gemini Completion Error", e);
        return "";
    }
};
