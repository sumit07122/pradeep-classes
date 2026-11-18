export interface GsFact {
  fact: string;
  category: string;
  explanation?: string;
}

export interface CareerTip {
  tip: string;
  subject: string;
}

export const getGeminiDailyContent = async (): Promise<{ gsFacts: GsFact[]; careerTips: CareerTip[] } | null> => {
  try {
    const response = await fetch('/api/daily-gs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Error generating Gemini content:', errData.error || response.statusText);
      return null;
    }

    const data = await response.json();
    return data as { gsFacts: GsFact[]; careerTips: CareerTip[] };
  } catch (error) {
    console.error('Error generating Gemini content:', error);
    return null;
  }
};
