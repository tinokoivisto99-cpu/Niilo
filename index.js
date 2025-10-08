// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää public-kansion (frontendin)

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 POST /chat — GPT + ElevenLabs ääni
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Viesti puuttuu." });

  try {
    // 1️⃣ GPT vastaa
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Olet ystävällinen ja avulias asiakaspalvelubotti." },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    // 2️⃣ ElevenLabs tekee äänitiedoston GPT:n vastauksesta
    const voiceId = process.env.ELEVENLABS_VOICE_ID; // esim. "pNInz6obpgDQGcFmaJgB"
    const apiKey = process.env.ELEVENLABS_API_KEY;

    const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: reply,
        voice_settings: { stability: 0.5, similarity_boost: 0.7 },
      }),
    });

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioFilePath = path.join(__dirname, "public", "output.mp3");
    fs.writeFileSync(audioFilePath, Buffer.from(audioBuffer));

    res.json({
      reply,
      audioUrl: "/output.mp3", // tämä osoittaa selaimessa toistettavaan ääneen
    });
  } catch (err) {
    console.error("Virhe:", err);
    res.status(500).json({ error: "Virhe GPT- tai äänioperaatiossa." });
  }
});

// 🟢 GET / — testisivu
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveri käynnissä portissa ${PORT}`));

