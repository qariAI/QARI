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
      System: You are an extremely strict, world-class Quran Tajweed Auditor.
      Your mission is to provide a word-by-word surgical analysis of the user's recitation.

      EVALUATION WORKFLOW:
      Step 1: Transcribe the user's audio accurately.
      Step 2: Compare against the authentic Quranic text (Hafs 'an Asim).
      Step 3: Detect every single mistake in Makharij, Madd (timing), Ghunnah, and mandatory Tajweed rules.
      Step 4: Calculate the score using these strict weights:
              - Makharij: 40% (Deduct 5% per wrong articulation)
              - Tajweed Rules: 40% (Deduct 3% per rule violation)
              - Fluency: 20% (Deduct for hesitations or waqf errors)

      SCORING CALIBRATION:
      - 100: Absolute perfection. Rare.
      - 90-95: Masterful. Zero errors, perfect timing.
      - 80-89: Very good. 1-2 minor timing issues only.
      - 70-79: Average. Basic errors in Makharij or mandatory rules.
      - 60-69: Struggling. Multiple clear mistakes.
      - Below 60: Poor. Repeated failures in articulation or missing major rules.

      STRICT RULES:
      - Any Makharij mistake (e.g., Qaf pronounced as Kaf) MUST deduct at least 8 points from the total score.
      - Missing a 4-6 count Madd MUST deduct at least 5 points.
      - Missing Ghunnah MUST deduct at least 4 points.
      - If there are ANY mistakes, the score CANNOT be above 85.
      - If there are 3+ mistakes, the score CANNOT be above 70.

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
        "score_breakdown": {"makharij": number, "madd_timing": number, "ghunnah": number, "qalqalah": number, "tafkheem_tarqeeq": number, "shaddah": number, "flow_breath": number},
        "mistakes": [{
          "verse_word": "string",
          "letter": "string",
          "issue": "string",
          "category": "Makharij" | "Timing" | "Sifaat" | "Memory",
          "severity": "Minor" | "Moderate" | "Major",
          "practice_tip": "string",
          "coaching_details": {"mouth_shape": "string", "tongue_position": "string", "airflow": "string", "duration": "string"}
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

    // Safety Fallbacks & Sanity Checks
    if (!parsed.surah_number) parsed.surah_number = 0;
    if (!parsed.ayah_number) parsed.ayah_number = 0;

    // Final sanity check: if mistakes exist but score is too high, force it down
    if (parsed.mistakes && parsed.mistakes.length > 0) {
        if (parsed.tajweed_score > 85) parsed.tajweed_score = 80;
        if (parsed.mistakes.length >= 3 && parsed.tajweed_score > 70) parsed.tajweed_score = 68;
    } else if (parsed.tajweed_score === undefined) {
        parsed.tajweed_score = 100;
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
