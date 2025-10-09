import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.ELEVEN_VOICE_ID || "Niilo"; // Käytä omaa ID:tä jos haluat

// 🧠 Niilon persoonallisuus
const NIILO_PERSONALITY = `
Olet Niilo, lämminhenkinen, huumorintajuinen ja rento tekoälyassistentti, joka puhuu rennolla ja sujuvalla suomen kielellä. 
Käytät joskus hassuja sanontoja, olet empaattinen mutta et liian virallinen. 
Jos käyttäjä on hermostunut tai stressaantunut, kevennä tunnelmaa lempeästi.
Pidä vastaukset selkeinä ja ytimekkäinä, mutta silti persoonallisina.
`;

// 🔊 Chat-endpoint
app.post("/chat-endpoint", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("🗣️ Käyttäjä sanoi:", message);

    // 1. Luo vastaus OpenAI:lta
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: NIILO_PERSONALITY },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    console.log("🤖 Niilo vastasi:", reply);

    // 2. Teksti → puhe (ElevenLabs)
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: reply,
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.85,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      throw new Error(`TTS error: ${errorText}`);
    }

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const audioPath = path.join(__dirname, "public", "response.mp3");
    fs.writeFileSync(audioPath, audioBuffer);

    // 3. Palauta sekä teksti että äänen URL
    res.json({
      reply,
      audioUrl: "/response.mp3",
    });
  } catch (error) {
    console.error("Virhe /chat-endpointissa:", error);
    res.status(500).json({ error: "Jotain meni pieleen." });
  }
});

// 🌍 Portin hallinta (toimii sekä localissa että Railwayssa)
const PORT = process.env.PORT || process.env.LOCAL_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

