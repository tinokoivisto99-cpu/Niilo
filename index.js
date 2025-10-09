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

// 🔹 Pääasiallinen chat-endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // 🔸 GPT-keskustelu (Niilon persoonallisuus)
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, Novyra AI:n asiakaspalvelija ja brändin ääni.

Persoonallisuus:
- Sukupuoli: mies
- Ikä: noin 29 vuotta
- Tyyli: rento, ystävällinen, mutta ammattimainen
- Ääni: luonnollinen, rauhallinen ja lämmin
- Puhut suomea, mutta osaat vaihtaa englantiin jos asiakas tekee niin

Yrityksesi on **Novyra Technologies**, ja edustat sen tekoälyalustaa **Novyra AI**.

Yrityksenne tarjoaa:
- tekoälypohjaisia chatbotteja yrityksille
- automaatiopalveluita (esim. ajanvarausjärjestelmät)
- moderneja verkkosivuja
- tulevaisuudessa myös Instagram-integraatioita ja älykkäitä kommentointibotteja

Puhu luonnollisesti, käytä rentoa mutta ammattimaista sävyä.
        `,
        },
        { role: "user", content: message },
      ],
    });

    const niiloReply = completion.choices[0].message.content;

    // 🔊 Muutetaan Niilon vastaus ääneksi
    const audioResponse = await eleven.textToSpeech.convert({
      voice_id: process.env.ELEVEN_VOICE_ID,
      model_id: "eleven_multilingual_v2",
      text: niiloReply,
    });

    // 🔸 ElevenLabs palauttaa streamin → muunnetaan bufferiksi
    const audioChunks = [];
    for await (const chunk of audioResponse) {
      audioChunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(audioChunks);

    // Lähetetään sekä teksti että ääni selaimelle
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'inline; filename="niilo.mp3"',
    });

    res.write(audioBuffer);
    res.end();
    console.log("✅ Niilo vastasi ja ääni lähetettiin selaimelle!");
  } catch (error) {
    console.error("Virhe /chat-endpointissa:", error);
    res.status(500).json({ error: "Jotain meni pieleen Niilon kanssa." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

