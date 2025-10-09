import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// --- Ympäristömuuttujat ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID || "RUftzcd9LaeeRXS2m8"; // oma oletusääni

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

    // --- ElevenLabs TTS ---
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
    console.error("Virhe /chat-endpointissa:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Health check ---
app.get("/", (req, res) => {
  res.send("🚀 Niilo on käynnissä ja valmis jutteluun!");
});

// --- Keep alive (estää Railwayn sammutuksen) ---
setInterval(() => {
  console.log("🫡 Niilo on yhä hereillä...");
}, 30000);

// --- Käynnistys ---
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

