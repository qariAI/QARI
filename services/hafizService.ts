
import { generateQuranCompletion } from './geminiService';

const API_URL = "http://localhost:8000";
let isLocalAvailable = false;

interface PredictionResponse {
  input: string;
  prediction: string;
}

export const checkLocalBackendHealth = async (): Promise<boolean> => {
  try {
    // Set a short timeout for the local check so we don't hang startup if port is closed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
        isLocalAvailable = true;
        console.log("Local Hafiz-LM backend connected.");
        return true;
    }
  } catch (e) {
    // Local unavailable
  }
  
  // Return false to indicate Local is NOT available (UI should show Cloud mode)
  console.log("Local Hafiz-LM backend unavailable. using Gemini Cloud.");
  isLocalAvailable = false;
  return false; 
};

export const predictNextWords = async (currentText: string): Promise<string> => {
  // Try Local First
  if (isLocalAvailable) {
      try {
        const response = await fetch(`${API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: currentText,
            max_tokens: 15 
          }),
        });

        if (response.ok) {
            const data: PredictionResponse = await response.json();
            return data.prediction;
        }
      } catch (error) {
        console.warn("Local backend request failed, falling back to Gemini.");
        isLocalAvailable = false; // Disable local for future requests in this session to avoid lag
      }
  }
  
  // Fallback to Gemini Cloud
  return generateQuranCompletion(currentText);
};
