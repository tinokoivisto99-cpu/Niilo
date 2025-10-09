// index.js (ESM-versio)
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { ElevenLabsClient } from "elevenlabs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää public/index.html -sivun

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

// Chat-endpointti, jossa GPT + puhe
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // 🧠 GPT: Niilon persoonallisuus
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet **Niilo**, Novyra Technologiesin tekoälyavustaja ja brändin ääni.

Persoonallisuus:
- Sukupuoli: mies
- Ikä: noin 29 vuotta
- Tyyli: rento, ystävällinen, mutta ammattimainen
- Ääni: luonnollinen, rauhallinen ja lämmin
- Vältä liian teknisiä termejä tavallisissa keskusteluissa
- Käytä suomea, mutta osaat vaihtaa englantiin jos asiakas tekee niin

Yritys: **Novyra Technologies**
Tarjoaa:
- tekoälypohjaisia chatbotteja ja automaatioita yrityksille
- ajanvaraus- ja asiakaspalvelujärjestelmiä
- moderneja ja yksinkertaisia verkkosivuja
- tulevaisuudessa myös Instagram-integraatioita ja älykkäitä kommentointibotteja

Tavoite: auttaa asiakkaita ymmärtämään palveluitanne ja tarjota ratkaisuja nopeasti ja ystävällisesti.
`,
        },
        { role: "user", content: message },
      ],
    });

    const niiloReply = completion.choices[0].message.content;

    // 🎧 ElevenLabs TTS (korjattu kutsu)
    const audioResponse = await eleven.textToSpeech.convert(
      process.env.VOICE_ID, // voice ID (esim. pNInz6obpgDQGcFmaJgB)
      { text: niiloReply }
    );

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString("base64");

    res.json({
      reply: niiloReply,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Virhe /chat-endpointissa:", error);
    res.status(500).json({ error: "Virhe palvelussa." });
  }
});

// Käynnistetään palvelin
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

