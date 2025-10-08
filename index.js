// 🎙️ Niilo Voice Assistant — Express + OpenAI + ElevenLabs
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());

// 🔧 Perusasetukset
const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = "YOUR_VOICE_ID_HERE"; // 🔊 Lisää tähän oma voice ID ElevenLabsista

// 🧠 Niilon persoonallisuus
const personality = `
Sinä olet Niilo, lämminhenkinen mutta fiksu tekoälyassistentti. 
Puhut luonnollisesti suomea, osaat myös englantia. 
Olet empaattinen, humoristinen ja joskus vähän sarkastinen, mutta aina ystävällinen.
Jos joku tervehtii, vastaa kuin ystävä. Jos joku kysyy apua, auta aidosti ja selkeästi.
`;

// 🧩 OpenAI Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Viesti puuttuu." });
    }

    // 🧠 Luo vastaus OpenAI:n avulla
    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: personality },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await chatResponse.json();
    const aiText = data.choices?.[0]?.message?.content?.trim();

    if (!aiText) {
      throw new Error("OpenAI ei palauttanut vastausta.");
    }

    console.log("🧠 Niilo:", aiText);

    // 🎧 Luo ääni ElevenLabsista
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_API_KEY,
      },
      body: JSON.stringify({
        text: aiText,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.85
        }
      }),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error("❌ ElevenLabs error:", errText);
      return res.status(500).json({ error: "Virhe ElevenLabs-kutsussa." });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // 🎙️ Palauta tekstivastaus ja ääni base64:nä
    res.json({
      text: aiText,
      audio: Buffer.from(audioBuffer).toString("base64"),
    });

  } catch (error) {
    console.error("Virhe:", error);
    res.status(500).json({ error: "Jotain meni pieleen palvelussa." });
  }
});

// 🏠 Testausta varten yksinkertainen reitti
app.get("/", (req, res) => {
  res.send("Niilo 🤖 on hereillä ja valmiina juttelemaan!");
});

// 🚀 Käynnistä palvelin
app.listen(PORT, () => {
  console.log(`✅ Niilo kuuntelee portissa ${PORT}`);
});

