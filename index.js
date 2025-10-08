import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

// 🔧 Perusasetukset
const PORT = process.env.PORT || 8080;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

if (!ELEVEN_API_KEY) console.error("❌ ELEVEN_API_KEY puuttuu!");
if (!OPENAI_API_KEY) console.error("❌ OPENAI_API_KEY puuttuu!");

// 🔹 OpenAI-client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// 🔹 Juuri (testi)
app.get("/", (req, res) => {
  res.send("✅ Niilo toimii ja kuuntelee portissa " + PORT);
});

// 🔹 Chat endpoint (teksti + ääni)
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Viesti puuttuu" });
    }

    // --- GPT-vastaus ---
    console.log("🧠 Käyttäjän viesti:", userMessage);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // nopea malli, voidaan vaihtaa myöhemmin
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, ystävällinen mutta hieman sarkastinen tekoälyassistentti, joka puhuu luonnollisella ja rentouttavalla tavalla.
Käytä suomen kieltä. Lisää välillä pieniä huumorin pilkahduksia, mutta pysy aina asiallisena ja auttavaisena.
Älä kuulosta robotilta, vaan ihmiseltä, joka puhuu mukavasti.
          `,
        },
        { role: "user", content: userMessage },
      ],
    });

    const aiResponseText = completion.choices[0].message.content.trim();
    console.log("💬 Niilon vastaus:", aiResponseText);

    // --- ElevenLabs: tekstistä ääneksi ---
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_API_KEY,
        },
        body: JSON.stringify({
          text: aiResponseText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.85,
            style: 0.55,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("❌ ElevenLabs virhe:", errorText);
      return res.status(500).json({ error: "Voice generation failed" });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // --- Lähetä ääni selaimelle ---
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'inline; filename="niilo.mp3"',
    });

    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error("💥 Virhe /chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 Käynnistys
app.listen(PORT, () => {
  console.log(`✅ Niilo kuuntelee portissa ${PORT}`);
});

