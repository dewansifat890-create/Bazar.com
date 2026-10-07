import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-memory profiles db loaded/saved from file 'user_profiles_db.json'
const PROFILES_FILE = path.join(process.cwd(), 'user_profiles_db.json');

function readProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading profiles db:', err);
  }
  return {};
}

function writeProfiles(profiles: any) {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing profiles db:', err);
  }
}

// GET /api/profile
// Query params: userId, phoneOrEmail
app.get('/api/profile', (req, res) => {
  const { userId, phoneOrEmail } = req.query;
  const db = readProfiles();

  let profile = null;
  if (phoneOrEmail && typeof phoneOrEmail === 'string' && phoneOrEmail.trim()) {
    profile = db[phoneOrEmail.trim().toLowerCase()];
  }
  if (!profile && userId && typeof userId === 'string' && userId.trim()) {
    profile = db[userId.trim()];
  }

  if (profile) {
    return res.json(profile);
  } else {
    return res.json({ name: null, avatar: null });
  }
});

// POST /api/profile
// Body: { userId, phoneOrEmail, name, avatar }
app.post('/api/profile', (req, res) => {
  const { userId, phoneOrEmail, name, avatar } = req.body;
  const db = readProfiles();

  const profileData = {
    name: name || null,
    avatar: avatar || null,
    updatedAt: new Date().toISOString()
  };

  let saved = false;

  if (phoneOrEmail && typeof phoneOrEmail === 'string' && phoneOrEmail.trim()) {
    db[phoneOrEmail.trim().toLowerCase()] = profileData;
    saved = true;
  }
  if (userId && typeof userId === 'string' && userId.trim()) {
    db[userId.trim()] = profileData;
    saved = true;
  }

  if (saved) {
    writeProfiles(db);
    return res.json({ success: true, profile: profileData });
  } else {
    return res.status(400).json({ error: 'Missing identifier' });
  }
});

// Lazy Google GenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Visual Search API Route
app.post('/api/scan', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const ai = getGeminiClient();

    // Prepare image for Gemini multimodal input
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Image.replace(/^data:image\/\w+;base64,/, ''),
      },
    };

    const textPart = {
      text: `An end-user has uploaded a photo to search for a match in our catalog.
Analyze the visual content of the uploaded drawing or photo. Your goal is to try matching it to ONE of the active products below if indeed the photo contains an item resembling that product.

Active Catalog Inventory:
1. "Minimalist Timepiece" - Luxury wrist watch, elegant metal style, wrist-worn device or leather strap timepiece.
2. "Turbo Run Crimson" - Red sneaker, running shoe, sport footgear, athletic trainer.
3. "Pro Audio Headphones" - Over-ear high quality headband music listening headset.
4. "Smart Health Watch" - Black digital watch, sports smartwatch, smartwatch with display screens or trackers.

Requirements:
- If the uploaded image clearly matches a Watch, Shoe, or Headphones category, assign it to the most relevant product above. Be lenient: if it's any sports watch, map it to "Smart Health Watch", if any classy watch, "Minimalist Timepiece". If any trainer or sneaker, map it to "Turbo Run Crimson". If any headband/headphone, map it to "Pro Audio Headphones".
- If the uploaded photo does NOT contain a watch, a shoe, or headphones (e.g. food, animals, plants, general landscapes, people faces, standard desk clutter, text screens, empty walls), set matched to false and productName to null.
- Provide a clear, natural, helpful explanation explaining why a match was found, or why we couldn't find a matching product in our current watch/headphones/shoes categories.

You MUST respond strictly with a valid JSON block of this schema, and print ONLY the JSON:
{
  "matched": boolean,
  "productName": "Minimalist Timepiece" | "Turbo Run Crimson" | "Pro Audio Headphones" | "Smart Health Watch" | null,
  "confidence": number,
  "explanation": "string description"
}`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    const responseText = response.text || '';
    
    // Clean potential markdown wrap
    const cleanJSONStr = responseText
      .replace(/```json/i, '')
      .replace(/```/g, '')
      .trim();

    try {
      const parsedMatch = JSON.parse(cleanJSONStr);
      return res.json(parsedMatch);
    } catch (parseErr) {
      console.error('Failed to parse model JSON: ', responseText);
      // Fallback in case of raw text
      if (responseText.includes('Minimalist Timepiece')) {
        return res.json({ matched: true, productName: 'Minimalist Timepiece', confidence: 0.9, explanation: 'Matched using direct text search' });
      } else if (responseText.includes('Turbo Run Crimson')) {
        return res.json({ matched: true, productName: 'Turbo Run Crimson', confidence: 0.9, explanation: 'Matched using direct text search' });
      } else if (responseText.includes('Pro Audio Headphones')) {
        return res.json({ matched: true, productName: 'Pro Audio Headphones', confidence: 0.9, explanation: 'Matched using direct text search' });
      } else if (responseText.includes('Smart Health Watch')) {
        return res.json({ matched: true, productName: 'Smart Health Watch', confidence: 0.9, explanation: 'Matched using direct text search' });
      }
      return res.json({ matched: false, productName: null, confidence: 0, explanation: 'Inventory search completed, no match identified.' });
    }

  } catch (err: any) {
    console.error('Visual scan backend error:', err);
    return res.status(500).json({ 
      error: 'Failed to perform smart scan via matching engine.',
      details: err.message 
    });
  }
});

// Setup dev server or static file serving
const setupServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
};

setupServer();
