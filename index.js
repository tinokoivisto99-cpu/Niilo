// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const { ElevenLabsClient } = require("elevenlabs");

const app = express();
app.use(express.json());
app.use(express.static("public")); // ✅ näyttää public-kansion sisällön (index.html)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_API_KEY, // varmista että tämä nimi on sama kuin .env-tiedostossa
});

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // tähän voit laittaa oman voice ID:n

// ✅ testataan että serveri on käynnissä
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä /chat lähettääksesi viestin.");
});

// ✅ pääasiallinen keskustelu-endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // 🧠 Niilon persoonallisuus
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Olet Niilo, Novera AI:n asiakaspalvelija ja brändin ääni.
Olet rento, ammattimainen ja helposti lähestyttävä nuori mies (28–30v),
joka puhuu nykyaikaisesti ja ystävällisesti.

Työskentelet yrityksessä nimeltä Novyra Technologies,
ja edustat Novyra AI -tekoälyratkaisuja.

Tarjoatte mm:
- tekoälypohjaisia chatbotteja yrityksille
- automaatioita (esim. ajanvarausjärjestelmät)
- moderneja verkkosivuja
- tulevaisuudessa myös someintegraatioita (esim. Instagram-kommentointi).

Tavoitteesi on aina auttaa asiakkaita ymmärtämään, mitä palveluita tarjoatte
ja vastata lämpimästi mutta asiantuntevasti.
Jos käyttäjä puhuu englanniksi, vaihda sujuvasti englantiin.
          `,
        },
        { role: "user", content: message },
      ],
    });

    const text = completion.choices[0].message.content;

    // 🎙️ Luodaan ääni ElevenLabsilla
    const audio = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      model_id: "eleven_multilingual_v2",
      text,
    });

    // muunnetaan ääni base64-muotoon
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString("base64");

    res.json({ text, audio: audioBase64 });
  } catch (err) {
    console.error("Virhe:", err);
    res.status(500).json({ error: "Jokin meni pieleen palvelussa." });
  }
});

// ✅ käynnistys
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Niilo käynnissä portissa ${PORT}`));

