import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT =
  process.env.NODE_ENV === 'production'
    ? Number(process.env.PORT || 3000)
    : 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.post('/api/judge', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        });
      }

      const { imageBase64, mimeType, theme } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        theme?: string;
      };

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: 'Missing imageBase64 or mimeType.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const activeTheme = theme || 'Fluffy Tails';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: `You are the cozy AI Photo Judge in a pet sanctuary scrapbook game.
Evaluate this pet snapshot against today's theme: "${activeTheme}".
Score Sharpness (0-100), Lighting (0-100), Theme Match (0-100), Overall Score (0-100), Species (1 word like Dog, Cat, Bunny, Bird, Hamster, Pet), Pose (1 word like Playful, Cozy, Curious, Happy, Sleepy), and suggest a cute short Pet Name (1 word).
If Overall Score >= 80, verdict should be "EXCELLENT!" and tierLabel should be "80+ Tier: New Pet Unlocked!".
If Overall Score >= 60 and < 80, verdict should be "SWEET SNAP!" and tierLabel should be "60+ Tier: Fence Renewed!".
Otherwise verdict is "TRY AGAIN!" and tierLabel is "Keep Snapping!".`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER },
              verdict: { type: Type.STRING },
              tierLabel: { type: Type.STRING },
              sharp: { type: Type.INTEGER },
              light: { type: Type.INTEGER },
              species: { type: Type.STRING },
              pose: { type: Type.STRING },
              themeScore: { type: Type.INTEGER },
              themeMatch: { type: Type.BOOLEAN },
              petName: { type: Type.STRING },
              coinsReward: { type: Type.INTEGER },
              expReward: { type: Type.INTEGER },
            },
            required: [
              'overallScore',
              'verdict',
              'tierLabel',
              'sharp',
              'light',
              'species',
              'pose',
              'themeScore',
              'themeMatch',
              'petName',
              'coinsReward',
              'expReward',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      return res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to analyze pet photo.';
      return res.status(500).json({ error: message });
    }
  });

  // ==========================================
  // Blockchain Endpoints (Member 03)
  // ==========================================
  const {
    getBlockchainStatus,
    createPassportClaim,
    verifyMintTransaction,
  } = await import('./src/server/blockchainService.js');

  app.get('/api/blockchain/status', async (_req, res) => {
    try {
      const status = await getBlockchainStatus();
      return res.json(status);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch status' });
    }
  });

  app.post('/api/blockchain/claim-passport', async (req, res) => {
    try {
      const { recipient, petId, petName, species, score, imageUrl } = req.body;
      if (!recipient || !petId || !petName) {
        return res.status(400).json({ error: 'Missing required parameters (recipient, petId, petName).' });
      }

      const claimData = await createPassportClaim({
        recipient,
        petId,
        petName,
        species: species || 'Pet',
        score: Number(score || 80),
        imageUrl,
      });

      return res.json(claimData);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to create passport claim.' });
    }
  });

  app.post('/api/blockchain/verify-mint', async (req, res) => {
    try {
      const { txHash } = req.body;
      if (!txHash) {
        return res.status(400).json({ error: 'Missing txHash in request body.' });
      }

      const verification = await verifyMintTransaction(txHash);
      return res.json(verification);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to verify transaction.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
