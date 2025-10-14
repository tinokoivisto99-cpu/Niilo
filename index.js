import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// --- Perusasetukset ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Polkujen määritykset ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Staattinen frontti (public-kansio) ---
app.use(express.static(path.join(__dirname, "public")));

// --- API-avaimet ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID || "RUftzcd9LaeeRXS2m8";

// --- POST /chat ---
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Viesti puuttuu!" });
    }

    // --- OpenAI-vastaus ---
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Olet Niilo, sympaattinen ja hauska suomenkielinen avustaja. Vastaa lyhyesti ja puhekielellä, mutta ystävällisesti.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await openaiResponse.json();
    const reply = data.choices?.[0]?.message?.content || "Hmm, enpä osaa sanoa.";

    // --- ElevenLabs-äänivastaus ---
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: reply,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsResponse.ok) {
      throw new Error("Virhe ElevenLabsin puolella");
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    res.json({ text: reply, audio: audioBase64 });
  } catch (err) {
    console.error("❌ Virhe /chat-endpointissa:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Health check ---
app.get("/health", (req, res) => {
  res.send("✅ Niilo toimii moitteetta!");
});

// --- Etusivu (index.html) ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Keep alive (estää Railwayn idlen) ---
setInterval(() => {
  console.log("🫡 Niilo on yhä hereillä...");
}, 30000);

// --- SIGTERM käsittely (Railwayn siisti sammutus) ---
process.on("SIGTERM", () => {
  console.log("🛑 Railway lähettää SIGTERM – sammutetaan Niilo siististi...");
  process.exit(0);
});

// --- Käynnistys ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

