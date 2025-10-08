// index.js
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const OpenAI = require("openai");

// 🟢 tuodaan fetch käyttöön node-fetch -kirjastosta
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(express.static("public"));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Testi
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä POST /chat lähettääksesi viestin.");
});

// ✅ Chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Viesti puuttuu." });

  try {
    // 🧠 Niilon vastaus
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo — Novyra AI:n ääni. 
Olet rento mutta ammattimainen mies, noin 30v, joka auttaa käyttäjiä ymmärtämään tekoälyratkaisuja.
Yrityksesi on Novyra Technologies, ja te tarjoatte mm:
- tekoälybotteja
- automaatiopalveluita
- moderneja verkkosivuja

Ole ystävällinen, käytä luontevaa kieltä, ja pidä sävy ammattimaisena mutta rennon ihmisläheisenä.
          `,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "Hmm, en saanut selvää.";

    // 🎤 ElevenLabs-puhe
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: reply,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!voiceResponse.ok) {
      console.error("ElevenLabs error:", await voiceResponse.text());
    }

    const audioBuffer = await voiceResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    res.json({
      reply,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
    });
  } catch (error) {
    console.error("Virhe:", error);
    res.status(500).json({ error: "Jotain meni pieleen." });
  }
});

// ✅ Portti
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Niilo kuuntelee portissa ${PORT}`));

