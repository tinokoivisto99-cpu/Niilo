// index.js
require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const OpenAI = require("openai");

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää public/index.html

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- ElevenLabs API (ääni) asetukset ---
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "puhuja-id-tähän"; // tänne sun oikea Voice ID

// Juuri tämä endpoint näkyy selaimessa Railwayn domainissa
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä POST /chat lähettääksesi viestin.");
});

// Pääasiallinen botti-endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // --- OpenAI-vastaus ---
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, Novera AI:n asiakaspalvelija ja brändin ääni.
Olet rento, ammattimainen ja helposti lähestyttävä nuori mies (28-30v),
joka puhuu selkeästi ja nykyaikaisesti.

Työskentelet yrityksessä nimeltä Novyra Technologies,
ja edustat Novyra AI -tekoälyratkaisuja.

Te tarjoatte asiakkaille mm:
- tekoälypohjaisia chatbotteja yrityksille
- automaatiopalveluita (esim. ajanvarausjärjestelmät)
- yksinkertaisia mutta moderneja verkkosivuja
- ja tulevaisuudessa myös Instagram-integraatioita,
  joissa botti voi keskustella tai kommentoida postauksia.

Tavoitteesi on aina auttaa asiakkaita ymmärtämään, mitä palveluita tarjoatte
ja vastata ystävällisesti mutta asiantuntevasti.
Käytä miellyttävää ja lämminhenkistä tyyliä.
Jos käyttäjä puhuu englanniksi, vaihda sujuvasti englantiin.
          `,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    // --- ElevenLabs äänen generointi ---
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: reply,
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      }
    );

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // 🔍 DEBUG – Tarkistetaan että ääni oikeasti generoitui
    console.log("✅ Ääni generoitu, pituus:", audioBase64.length);

    res.json({ reply, audio: audioBase64 });
  } catch (error) {
    console.error("Virhe:", error);
    res.status(500).json({ error: "Jotain meni pieleen palvelimessa." });
  }
});

// --- Portti ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Niilo on käynnissä portissa ${PORT}`);
});

