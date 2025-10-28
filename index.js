import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// --- OPENAI API ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_ENABLED = Boolean(OPENAI_API_KEY);
if (!CHAT_ENABLED) {
  console.warn("⚠️  OPENAI_API_KEY puuttuu. Chat-endpoint palauttaa virheen kunnes avain on asetettu.");
}

// --- ELEVENLABS API ---
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID;
const VOICE_ENABLED = Boolean(ELEVEN_API_KEY && VOICE_ID);
if (!VOICE_ENABLED) {
  console.warn("ℹ️  ElevenLabs-ääni ei ole käytössä (ELEVEN_API_KEY tai VOICE_ID puuttuu).");
}

// ✅ Perusreitti testaukseen
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    chatEnabled: CHAT_ENABLED,
    voiceEnabled: VOICE_ENABLED,
  });
});

// ✅ Chat endpoint (GPT)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message puuttuu!" });
    }

    if (!CHAT_ENABLED) {
      return res.status(503).json({ error: "OPENAI_API_KEY puuttuu palvelimelta." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Olet ystävällinen ja älykäs avustaja." },
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GPT API virhe:", data);
      const status = response.status === 401 ? 502 : 500;
      return res.status(status).json({ error: "GPT-pyyntö epäonnistui" });
    }

    const reply = data.choices?.[0]?.message?.content || "Ei vastausta.";
    res.json({ reply });

  } catch (error) {
    console.error("Chat endpoint error:", error);
    res.status(500).json({ error: "Palvelinvirhe chatissa" });
  }
});

// ✅ Voice endpoint (ElevenLabs TTS)
app.post("/api/voice", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Teksti puuttuu!" });
    }

    if (!VOICE_ENABLED) {
      return res.status(503).json({ error: "ElevenLabs ei ole konfiguroitu." });
    }

    const elevenlabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const response = await fetch(elevenlabsUrl, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs virhe:", err);
      const status = response.status === 401 ? 502 : 500;
      return res.status(status).json({ error: "TTS-pyyntö epäonnistui" });
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength
    });
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error("Voice endpoint error:", error);
    res.status(500).json({ error: "Palvelinvirhe äänessä" });
  }
});
// ✅ Lokien tallennus Novyra CRM:ään
app.post("/api/log", async (req, res) => {
  try {
    const { type, message, user, meta } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: "type ja message vaaditaan." });
    }

    const crmUrl = process.env.CRM_API_URL || "https://novyracrm.com/api/logs";

    const response = await fetch(crmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CRM_API_KEY || ""}`
      },
      body: JSON.stringify({
        type,
        message,
        user,
        meta,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("CRM log error:", err);
      return res.status(500).json({ error: "Lokitietojen lähetys epäonnistui CRM:ään." });
    }

    res.json({ success: true });
  } catch (e) {
    console.error("CRM log error:", e);
    res.status(500).json({ error: "Palvelinvirhe lokien tallennuksessa." });
  }
});

// --- SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Serveri käynnissä portissa ${PORT}`);
});

