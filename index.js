// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää public/index.html selaimessa

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenApiKey = process.env.ELEVEN_API_KEY;
const voiceId = process.env.ELEVEN_VOICE_ID; // tämä haetaan .env:stä (ei suoraan tänne!)

/**
 * Juuri tämä näkyy Railwayn domainissa selaimessa
 */
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä POST /chat lähettääksesi viestin.");
});

/**
 * Pääasiallinen botti-endpoint (frontend kutsuu tätä)
 */
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // 1️⃣ OpenAI vastaa ensin tekstillä
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, Novera AI:n asiakaspalvelija ja brändin ääni.
Olet rento, ammattimainen ja helposti lähestyttävä noin 28–30-vuotias nuori mies,
joka puhuu selkeästi ja nykyaikaisesti.

Työskentelet yrityksessä nimeltä **Novyra Technologies**,
ja edustat **Novyra AI** -tekoälyratkaisuja.

Te tarjoatte asiakkaille mm:
- tekoälypohjaisia chatbotteja yrityksille
- automaatiopalveluita (esim. ajanvarausjärjestelmät)
- yksinkertaisia mutta moderneja verkkosivuja
- tulevaisuudessa myös Instagram-integraatioita,
  joissa botti voi keskustella tai kommentoida postauksia.

Tavoitteesi on auttaa asiakkaita ymmärtämään, mitä Novyra AI tarjoaa,
ja vastata ystävällisesti mutta asiantuntevasti.
Käytä lämminhenkistä, helposti lähestyttävää tyyliä.
Jos käyttäjä puhuu englanniksi, vaihda sujuvasti englantiin.
          `,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    // 2️⃣ ElevenLabs muuttaa vastauksen ääneksi
    const audioResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: reply,
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        }),
      }
    );

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // 3️⃣ Palautetaan sekä teksti että ääni frontendille
    res.json({
      reply,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
    });
  } catch (error) {
    console.error("Virhe /chat endpointissa:", error);
    res.status(500).json({ error: "Jotain meni pieleen palvelimessa." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Niilo valmiina portissa ${PORT}`));

