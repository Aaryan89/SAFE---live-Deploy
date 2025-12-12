import { GoogleGenAI } from "@google/genai";
import { UserProfile, LocationData, ThreatLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmergencyReport = async (
  user: UserProfile,
  location: LocationData | null,
  context: string
): Promise<string> => {
  try {
    const prompt = `
      Create a highly structured, concise, and professional Emergency Data Packet text for First Responders.
      
      User Details:
      Name: ${user.fullName}
      
      Current Situation:
      Context: ${context}
      Location: ${location ? `${location.latitude}, ${location.longitude} (Accuracy: ${location.accuracy}m)` : "Unknown"}
      Timestamp: ${new Date().toLocaleString()}
      
      Format the output as a clean text block suitable for an SMS or Police Dispatch Screen. 
      Prioritize location.
      Keep it under 100 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Emergency Alert Triggered. Location sending...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Emergency Alert Triggered. Unable to generate AI report due to connectivity.";
  }
};

export const analyzeThreatAudio = async (
  transcript: string,
  safeword: string
): Promise<{ level: ThreatLevel; reasoning: string }> => {
  try {
    const prompt = `
      You are the AI Guardian for a personal safety app.
      Analyze the audio transcript. The user has set a secret "Safe Word": "${safeword}".
      
      Transcript to analyze: "${transcript}"
      
      INSTRUCTIONS:
      1. Count how many times the Safe Word "${safeword}" appears (case-insensitive, fuzzy match allowed).
      2. Analyze the sentiment for distress (screaming, pleading, threats).
      
      DETERMINE THREAT LEVEL:
      - "CRITICAL": If the Safe Word is repeated 3 or more times. (Triggers Immediate SOS).
      - "DANGER": If the Safe Word is repeated exactly 2 times. (Triggers Silent Alert).
      - "SUSPICIOUS": If the Safe Word appears exactly 1 time OR if transcript indicates fear/distress without the safe word.
      - "NONE": Safe word not detected or context is benign.

      Return JSON ONLY:
      {
        "level": "NONE" | "SUSPICIOUS" | "DANGER" | "CRITICAL",
        "reasoning": "Brief explanation of why this level was chosen."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return { level: ThreatLevel.NONE, reasoning: "No response from AI" };

    const result = JSON.parse(text);
    return {
      level: result.level as ThreatLevel,
      reasoning: result.reasoning || "AI Analysis completed"
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { level: ThreatLevel.NONE, reasoning: "Analysis failed" };
  }
};