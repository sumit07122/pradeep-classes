import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import provisioningRoutes from './server/routes/provisioningRoutes';
import { initFirebaseAdmin } from './server/firebaseAdmin';

const PORT = Number(process.env.PORT) || 5173;
const HOST = '0.0.0.0';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Firebase Admin SDK if configured
  initFirebaseAdmin();

  // ERP Trusted Provisioning API
  app.use('/api/erp/provisioning', provisioningRoutes);

  app.post('/api/daily-gs', async (_req: Request, res: Response) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          {
            parts: [
              {
                text: 'Generate 5 high-quality General Studies (GS) facts and 3 career/study tips relevant for Indian students preparing for competitive exams like Navodaya Vidyalaya, Sainik School, and Board exams. The content should be in English. Provide it in JSON format.',
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
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
                  required: ['fact', 'category'],
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
                  required: ['tip', 'subject'],
                },
              },
            },
            required: ['gsFacts', 'careerTips'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(502).json({ error: 'Empty response from Gemini API.' });
      }

      const data = JSON.parse(text);
      return res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate daily GS content.';
      console.error('Error generating Gemini content:', error);
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
