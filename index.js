import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// --- OPENAI API ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- ELEVENLABS API ---
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

// ✅ Perusreitti testaukseen
app.get("/", (req, res) => {
  res.send("✅ AI Assistant backend toimii! 🚀");
});

// ✅ Chat endpoint (GPT)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message puuttuu!" });
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
      return res.status(500).json({ error: "GPT-pyyntö epäonnistui" });
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
      return res.status(500).json({ error: "TTS-pyyntö epäonnistui" });
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

// --- SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Serveri käynnissä portissa ${PORT}`);
});

