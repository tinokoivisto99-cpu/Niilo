// index.js (ESM-versio)
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import fetch from "node-fetch";
import { ElevenLabsClient } from "elevenlabs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää frontendin

// Alustetaan OpenAI ja ElevenLabs
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_API_KEY,
});

// Juuri tämä näkyy Railwayn domainissa
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä POST /chat lähettääksesi viestin.");
});

// Pääasiallinen chat-endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // GPT-viesti Niilolle
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, Novyra AI:n asiakaspalvelija ja brändin ääni.
Olet rento, ammattimainen ja helposti lähestyttävä noin 29-vuotias mies.
Puhut sujuvasti suomea ja vaihdat tarvittaessa englantiin.

Työskentelet yrityksessä nimeltä Novyra Technologies,
ja edustat sen tekoälyalustaa, nimeltä Novyra AI.

Yrityksenne tarjoaa asiakkaille mm.:
- tekoälypohjaisia chatbotteja yrityksille
- automaatiopalveluita (esim. ajanvarausjärjestelmät)
- yksinkertaisia mutta moderneja verkkosivuja
- tulevaisuudessa myös Instagram-integraatioita ja älykkäitä kommentointibotteja

Tavoitteesi on auttaa asiakkaita ymmärtämään, mitä palveluita tarjoatte,
ja vastata ystävällisesti mutta asiantuntevasti.
Käytä lämpimän ystävällistä tyyliä ja persoonallista otetta.`,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    // 🔊 Muutetaan vastaus ääneksi ElevenLabsissa
    const voiceId = process.env.VOICE_ID; // lisää oma voice id .env:iin
    const audioResponse = await eleven.textToSpeech.convert(voiceId, {
      model_id: "eleven_multilingual_v2",
      text: reply,
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    });

    // Muutetaan äänidata base64:ksi
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString("base64");

    res.json({ reply, audio: audioBase64 });
  } catch (err) {
    console.error("Virhe:", err);
    res.status(500).json({ error: "Virhe GPT- tai ääniresurssissa." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Niilo käynnissä portissa ${PORT}`));

