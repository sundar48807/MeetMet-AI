
import { GoogleGenAI, Type } from "@google/genai";
import { Summary, ActionItem, Analytics } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PartialIntel {
  summary?: Summary;
  actionItems?: ActionItem[];
  analytics?: Analytics;
  followUpEmail?: string;
  kbEntry?: string;
}

export const geminiService = {
  /**
   * Track A: High-Speed Streaming Transcription
   */
  async *streamTranscript(fileBase64: string, mimeType: string, context: string = "") {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContentStream({
      model,
      contents: [
        { inlineData: { data: fileBase64, mimeType } },
        { text: `Generate a full diarized transcript with [MM:SS] timestamps. Context: ${context}` }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Max speed
        systemInstruction: "You are a high-speed transcription engine. Output ONLY the diarized transcript. Formats: [MM:SS] Name: Content."
      }
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  },

  /**
   * Track B: Parallel Intelligence Extraction
   * Runs concurrently with transcription for 10x throughput.
   */
  async extractIntelligence(fileBase64: string, mimeType: string, context: string = ""): Promise<PartialIntel> {
    const model = 'gemini-3-flash-preview';
    
    // We request the intelligence payload. Since it's shorter than the transcript, 
    // it usually finishes long before the transcript stream is done.
    const response = await ai.models.generateContent({
      model,
      contents: [
        { inlineData: { data: fileBase64, mimeType } },
        { text: `Analyze this meeting. Provide Summary (Overview, Key Points, Decisions), Action Items (Task, Assignee, Deadline), and Analytics (Sentiment, Productivity 0-100, Topics, Emotions). Context: ${context}` }
      ],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["overview", "keyPoints", "decisions"]
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                }
              }
            },
            analytics: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.STRING },
                productivityScore: { type: Type.NUMBER },
                topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                emotions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, score: { type: Type.NUMBER } } } }
              }
            },
            followUpEmail: { type: Type.STRING },
            kbEntry: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  async askQuestion(transcript: string, question: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `MEETING CONTEXT:\n${transcript}\n\nUSER QUESTION: ${question}`,
      config: {
        systemInstruction: "Answer ONLY based on the meeting transcript. If it's not there, say: 'This was not discussed in the meeting.'",
        temperature: 0.1,
      }
    });
    return response.text || "No archive data retrieved.";
  }
};
