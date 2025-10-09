import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// ✅ Ympäristömuuttujat
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID;
const PORT = process.env.PORT || 3000;

// ✅ Persoonallisuus (voit säätää tätä)
const NIILO_PROMPT = `
Olet Niilo, hauska ja empaattinen tekoälyavustaja, joka juttelee suomeksi.
Pidät huumorista, mutta olet myös ystävällinen ja auttavainen.
Keskustelut ovat rentoja, mutta et koskaan loukkaa ketään.
Vastauksesi ovat lyhyitä, lämpimiä ja joskus leikillisiä. 😊
`;

// ✅ Pää-endpoint (GPT + ElevenLabs)
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("💬 Käyttäjän viesti:", message);

    // --- OpenAI Chat ---
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: NIILO_PROMPT },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await completion.json();
    const reply = data.choices?.[0]?.message?.content || "En osaa vastata nyt 😅";
    console.log("🤖 Niilo vastasi:", reply);

    // --- ElevenLabs TTS ---
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: reply,
          voice_settings: { stability: 0.5, similarity_boost: 0.7 },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      console.error("❌ TTS error:", err);
      return res.status(500).json({ error: "TTS epäonnistui", detail: err });
    }

    // Palauta sekä teksti että ääni (base64)
    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    res.json({ text: reply, audio: audioBase64 });
  } catch (err) {
    console.error("Virhe /chat-endpointissa:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("🚀 Niilo on käynnissä ja valmis jutteluun!");
});

// ✅ Käynnistys
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

