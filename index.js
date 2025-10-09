// index.js (ESM-versio)
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import fetch from "node-fetch";
import { ElevenLabsClient } from "elevenlabs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää frontendin (index.html ja script.js)

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_API_KEY,
});

// --- Juuri tämä näkyy Railwayn domainissa ---
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä POST /chat lähettääksesi viestin.");
});

// --- Pääasiallinen chat-endpoint ---
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // GPT: Niilon vastaus
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, Novyra AI:n asiakaspalvelija ja brändin ääni.
Olet rento, ammattimainen ja helposti lähestyttävä noin 29-vuotias mies,
joka puhuu selkeästi ja nykyaikaisesti.

Työskentelet yrityksessä nimeltä Novyra Technologies,
ja edustat sen tekoälyalustaa nimeltä Novyra AI.

Yrityksenne tarjoaa mm:
- tekoälypohjaisia chatbotteja yrityksille
- automaatiopalveluita (esim. ajanvarausjärjestelmiä)
- moderneja verkkosivuja
- tulevaisuudessa Instagram-integraatioita ja älykkäitä kommentointibotteja.

Tavoitteesi on auttaa asiakkaita ymmärtämään mitä palveluita tarjoatte
ja vastata ystävällisesti mutta asiantuntevasti.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    // Muutetaan GPT-vastaus puheeksi ElevenLabsin avulla
    const audioResponse = await eleven.textToSpeech.convert({
      voice_id: process.env.ELEVEN_VOICE_ID,
      model_id: "eleven_multilingual_v2",
      text: reply,
    });

    // Palautetaan sekä teksti että ääni frontendiin
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    res.json({
      reply,
      audio: audioBuffer.toString("base64"), // ääni base64-muodossa
    });
  } catch (error) {
    console.error("Virhe /chat-endpointissa:", error);
    res.status(500).json({ error: "Jotain meni pieleen palvelimella." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

