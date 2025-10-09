// index.js
import express from "express";
import dotenv from "dotenv";
import { writeFile } from "fs/promises";
import { join } from "path";
import OpenAI from "openai";
import { ElevenLabsClient } from "elevenlabs";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID; //RUftzcd9LaeeRXS2m85P

// 🧠 Tarkistetaan, että kaikki avaimet on olemassa
if (!OPENAI_API_KEY) console.error("❌ OPENAI_API_KEY puuttuu .env:stä!");
if (!ELEVEN_API_KEY) console.error("❌ ELEVEN_API_KEY puuttuu .env:stä!");
if (!VOICE_ID) console.error("❌ VOICE_ID puuttuu .env:stä!");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const elevenlabs = new ElevenLabsClient({ apiKey: ELEVEN_API_KEY });

// --- Persoonallisuus (Niilo) ---
const personality = `
Olet Niilo, hauska ja rento tekoäly, joka puhuu suomea luonnollisesti.
Vastauksesi ovat empaattisia, ystävällisiä ja välillä vähän hassuja.
Et käytä liian virallista kieltä, ja käytät joskus hymiöitä kuten 😄, 🤔 tai 🙃.
Jos käyttäjä on iloinen, ole iloinen takaisin. Jos hän on surullinen, yritä piristää.
Älä koskaan kirjoita pitkiä esseitä – vaan puhu kuin kaverille.
`;

// --- Chat endpoint ---
app.post("/chat-endpoint", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Viesti puuttuu!" });
    }

    console.log("💬 Käyttäjä sanoi:", userMessage);

    // 🔹 GPT-vastaus
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: personality },
        { role: "user", content: userMessage },
      ],
    });

    const reply = completion.choices[0].message.content;
    console.log("🤖 Niilo vastasi:", reply);

    // 🔹 ElevenLabs TTS
    const audioResponse = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      text: reply,
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      model_id: "eleven_turbo_v2",
    });

    // Tallennetaan ääni public/ -kansioon
    const filePath = join("public", "response.mp3");
    await writeFile(filePath, Buffer.from(await audioResponse.arrayBuffer()));

    res.json({
      text: reply,
      audioUrl: "/response.mp3",
    });
  } catch (error) {
    console.error("❌ Virhe /chat-endpointissa:", error);
    res.status(500).json({ error: "Jotain meni pieleen palvelimella." });
  }
});

// --- Palvelin käyntiin ---
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

