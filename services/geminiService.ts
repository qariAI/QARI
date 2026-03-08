import { GoogleGenerativeAI } from "@google/generative-ai";
import { FeedbackData, ProficiencyLevel, Drill } from "../types";

// Unified unrestricted API Key
const API_KEY = "AIzaSyB40ojU31VZGHAqEimp_U2XLcoSi8Ec5cY";

const getModel = (genAI: GoogleGenerativeAI, modelName: string = "gemini-1.5-flash-latest") => {
  return genAI.getGenerativeModel(
    { model: modelName },
    { apiVersion: "v1" }
  );
};

async function getBestModelName(): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
    const data = await response.json();
    if (data.models && data.models.length > 0) {
      const models = data.models.map((m: any) => m.name.replace("models/", ""));
      const candidates = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro-latest", "gemini-1.5-pro"];
      for (const cand of candidates) {
        if (models.includes(cand)) return cand;
      }
      return models[0];
    }
  } catch (e) {
    console.error("Model discovery failed, using fallback", e);
  }
  return "gemini-1.5-flash-latest";
}

export const analyzeRecitation = async (
  audioBase64: string,
  mimeType: string,
  verseContext?: string,
  isHifzMode?: boolean,
  proficiencyLevel: ProficiencyLevel = 'Beginner'
): Promise<FeedbackData> => {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const modelName = await getBestModelName();
    const model = getModel(genAI, modelName);

    const prompt = `
      System: You are an extremely strict expert Quran Tajweed teacher.
      Your task is to provide an objective, high-standard evaluation of a user's recitation.

      SCORING PHILOSOPHY:
      - 100: Reserved for professional-level reciters.
      - 90-99: Near perfect Tajweed, zero articulation errors.
      - 80-89: Good recitation with only very minor timing issues.
      - 70-79: Average beginner. Basic understanding but multiple minor mistakes.
      - 60-69: Struggling beginner. Clear issues with Makharij or mandatory rules.
      - Below 60: Significant and repeated Tajweed violations.

      EVALUATION RULES:
      1. Strictly penalize: Wrong articulation (Makharij), missing Ghunnah, incorrect Madd length, and Saakinah/Tanween rules.
      2. Weights: Makharij (40%), Tajweed Rules (40%), Fluency (20%).
      3. Do NOT give easy high scores. Be critical. It is better to give a 65 than an unearned 85.
      4. If a word is pronounced incorrectly, deduct at least 10 points from the total score.
      5. Regional accents are allowed ONLY if the articulation point (Makharij) is still technically correct.

      User Context: ${verseContext || "Detect from audio"}
      Proficiency Level: ${proficiencyLevel}

      RETURN JSON ONLY:
      {
        "surah_number": number,
        "ayah_number": number,
        "quran_text_arabic": "string",
        "quran_text_transliteration": "string",
        "quran_text_translation": "string",
        "positive_points": ["string"],
        "tajweed_score": number,
        "hifz_feedback": "string",
        "score_breakdown": {
          "makharij": number,
          "madd_timing": number,
          "ghunnah": number,
          "qalqalah": number,
          "tafkheem_tarqeeq": number,
          "shaddah": number,
          "flow_breath": number
        },
        "mistakes": [{
          "verse_word": "string",
          "letter": "string",
          "issue": "string",
          "category": "Makharij" | "Timing" | "Sifaat" | "Memory",
          "severity": "Minor" | "Moderate" | "Major",
          "practice_tip": "string",
          "coaching_details": {
            "mouth_shape": "string",
            "tongue_position": "string",
            "airflow": "string",
            "duration": "string"
          }
        }],
        "daily_practice": "string",
        "encouragement": "string"
      }
    `;

    const cleanBase64 = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: mimeType.split(';')[0], data: cleanBase64 } }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response was not valid JSON.");

    const parsed = JSON.parse(jsonMatch[0]) as FeedbackData;

    // Safety Fallbacks
    if (!parsed.surah_number) parsed.surah_number = 0;
    if (!parsed.ayah_number) parsed.ayah_number = 0;

    // Ensure score doesn't default too high if mistakes exist
    if (parsed.tajweed_score === undefined || parsed.tajweed_score === null) {
        parsed.tajweed_score = (parsed.mistakes && parsed.mistakes.length === 0) ? 100 : 60;
    }

    return parsed;
  } catch (error: any) {
    console.error("Gemini Analysis Failure:", error);
    throw new Error(error.message || "Recitation analysis failed.");
  }
};

export const generatePracticeDrills = async (weakRule: string): Promise<Drill[]> => {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = getModel(genAI);
    const result = await model.generateContent(`Generate 3 intense Quran drills for ${weakRule}. Return JSON.`);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]).drills : [];
  } catch (e) { return []; }
};

export const generateQuranCompletion = async (partialText: string): Promise<string> => {
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = getModel(genAI);
        const result = await model.generateContent(`Complete Quran verse: "${partialText}". Arabic only.`);
        return result.response.text().trim();
    } catch (e) { return ""; }
};
