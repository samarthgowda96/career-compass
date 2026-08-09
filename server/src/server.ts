import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { parseAnalyzeRequest } from './types.js';
import { generateAnalysis, AiProviderError } from './gemini.js';

/**
 * Career Compass — AI analysis backend.
 *
 * A deliberately small Express server with one job: accept anonymous
 * questionnaire results from the mobile app and return an AI-generated
 * career analysis. The AI API key lives ONLY here (environment variable),
 * never in the mobile app.
 *
 * Endpoints:
 *   GET  /health       — liveness probe
 *   POST /api/analyze  — { answers, topMatches } → AiAnalysis JSON
 */

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/analyze', async (req, res) => {
  const request = parseAnalyzeRequest(req.body);
  if (!request) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  try {
    const analysis = await generateAnalysis(request);
    res.json(analysis);
  } catch (error) {
    if (error instanceof AiProviderError) {
      const status = error.status === 429 ? 429 : 502;
      console.error(`[analyze] AI provider error (${error.status ?? 'n/a'}): ${error.message}`);
      res.status(status).json({
        error:
          status === 429
            ? 'AI provider rate limit reached — try again in a minute'
            : 'AI analysis is temporarily unavailable',
      });
      return;
    }
    console.error('[analyze] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Web app hosting (optional)
// ---------------------------------------------------------------------------
// If server/public exists (created by `npm run build:web` in /mobile), this
// server also serves the compiled web version of the app — one deployment
// hosts both the site and the API, and the web app calls /api same-origin.
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback: any non-API route serves the app shell.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
  console.log('Serving web app from', publicDir);
}

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Career Compass AI backend listening on http://localhost:${port}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      '⚠️  GEMINI_API_KEY is not set — /api/analyze will fail. ' +
        'Copy .env.example to .env and add your free key from https://aistudio.google.com/apikey',
    );
  }
});
