import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface GsFact {
  fact: string;
  category: string;
  explanation?: string;
}

export interface CareerTip {
  tip: string;
  subject: string;
}

export const getGeminiDailyContent = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          parts: [
            {
              text: "Generate 5 high-quality General Studies (GS) facts and 3 career/study tips relevant for Indian students preparing for competitive exams like Navodaya Vidyalaya, Sainik School, and Board exams. The content should be in English. Provide it in JSON format.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gsFacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING },
                  category: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["fact", "category"],
              },
            },
            careerTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tip: { type: Type.STRING },
                  subject: { type: Type.STRING },
                },
                required: ["tip", "subject"],
              },
            },
          },
          required: ["gsFacts", "careerTips"],
        },
      },
    });

    const data = JSON.parse(response.text);
    return data as { gsFacts: GsFact[]; careerTips: CareerTip[] };
  } catch (error) {
    console.error("Error generating Gemini content:", error);
    return null;
  }
};
