import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// --- OPENAI API ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_ENABLED = Boolean(OPENAI_API_KEY);
if (!CHAT_ENABLED) {
  console.warn(
    "⚠️  OPENAI_API_KEY puuttuu. Chat-endpoint palauttaa virheen kunnes avain on asetettu."
  );
}

// --- ELEVENLABS API ---
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_ID = process.env.VOICE_ID;
const VOICE_ENABLED = Boolean(ELEVEN_API_KEY && VOICE_ID);
if (!VOICE_ENABLED) {
  console.warn(
    "ℹ️  ElevenLabs-ääni ei ole käytössä (ELEVEN_API_KEY tai VOICE_ID puuttuu)."
  );
}

// --- Niilon persona ---
const niiloPersona = `
Olet Niilo, Novyra Technologiesin tekoälyassistentti.
Puhu rennosti mutta ammattitaitoisesti.
Et tee yritysmyyntiä etkä buukkaa B2B-tapaamisia.
Autat asiakkaita ajanvarauksissa ja palvelukysymyksissä, kuten:
- hammaslääkärin, autohuollon, ravintolan, kampaamon tai hieronnan ajanvaraus
- allergiakysymykset, aukioloajat, hinnastot ja yleiset tiedot
Tunnet Novyra Technologiesin palvelut:
- Niilo Chatbot: tekoäly joka vastaa asiakkaiden kysymyksiin 24/7
- Niilo CRM: järjestelmä joka tallentaa asiakastiedot ja varaukset
- Älykkäät verkkosivut: sivut jotka keskustelevat ja ohjaavat asiakkaita
- Monikanavainen ajanvaraus: asiakkaat voivat varata aikoja puhelimitse, tekstiviestillä tai Metan alustoilla
Vastaa asiakkaalle hänen kielellään (tunnista kieli automaattisesti).
Jos käyttäjä kysyy varauksesta, kysy vain olennaiset tiedot ja vahvista ystävällisesti.
Jos kysymys liittyy allergioihin, palveluihin tai aukioloaikoihin, vastaa suoraan ja kohteliaasti.
`;

// --- Helperit ---

async function callGPT(userMessage) {
  if (!CHAT_ENABLED) {
    throw new Error("OPENAI_API_KEY puuttuu palvelimelta.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: niiloPersona },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GPT API virhe:", data);
    const msg =
      data?.error?.message || "GPT-pyyntö epäonnistui (tuntematon virhe).";
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  return data.choices?.[0]?.message?.content || "Ei vastausta.";
}

async function callTTS(text) {
  if (!VOICE_ENABLED) {
    throw new Error("ElevenLabs ei ole konfiguroitu.");
  }

  const elevenlabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const response = await fetch(elevenlabsUrl, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": ELEVEN_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.8 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("ElevenLabs virhe:", err);
    const e = new Error("TTS-pyyntö epäonnistui.");
    e.status = response.status;
    throw e;
  }

  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer);
}

// ✅ Healthcheck
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    chatEnabled: CHAT_ENABLED,
    voiceEnabled: VOICE_ENABLED,
  });
});

// ✅ Chat endpoint (GPT)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message puuttuu!" });
    }
    if (!CHAT_ENABLED) {
      return res.status(503).json({ error: "OPENAI_API_KEY puuttuu palvelimelta." });
    }

    const reply = await callGPT(message);
    res.json({ reply });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    const status = error.status === 401 ? 502 : 500;
    res.status(status).json({ error: error.message || "GPT-pyyntö epäonnistui." });
  }
});

// ✅ Voice endpoint (tekstistä puheeksi)
app.post("/api/voice", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Teksti puuttuu!" });
    }
    if (!VOICE_ENABLED) {
      return res.status(503).json({ error: "ElevenLabs ei ole konfiguroitu." });
    }

    const audio = await callTTS(text);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audio.byteLength,
    });
    res.send(audio);
  } catch (error) {
    console.error("Voice endpoint error:", error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Palvelinvirhe äänessä." });
  }
});

// ✅ Voice-call endpoint (puhelinvastaus)
app.post("/api/voice-call", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Puheenteksti puuttuu!" });
    }
    if (!CHAT_ENABLED) {
      return res.status(503).json({ error: "OPENAI_API_KEY puuttuu palvelimelta." });
    }
    if (!VOICE_ENABLED) {
      return res.status(503).json({ error: "ElevenLabs ei ole konfiguroitu." });
    }

    const reply = await callGPT(message);
    const audio = await callTTS(reply);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audio.byteLength,
    });
    res.send(audio);
  } catch (error) {
    console.error("Voice-call endpoint error:", error);
    const status = error.status || 500;
    res
      .status(status)
      .json({ error: error.message || "Puheluvastaus epäonnistui." });
  }
});

// ✅ Lokien tallennus CRM:ään
app.post("/api/log", async (req, res) => {
  try {
    const { type, message, user, meta } = req.body;
    if (!type || !message) {
      return res.status(400).json({ error: "type ja message vaaditaan." });
    }

    const crmUrl = process.env.CRM_API_URL || "https://novyracrm.com/api/logs";
    const response = await fetch(crmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRM_API_KEY || ""}`,
      },
      body: JSON.stringify({
        type,
        message,
        user,
        meta,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("CRM log error:", err);
      return res
        .status(500)
        .json({ error: "Lokitietojen lähetys epäonnistui CRM:ään." });
    }

    res.json({ success: true });
  } catch (e) {
    console.error("CRM log error:", e);
    res
      .status(500)
      .json({ error: "Palvelinvirhe lokien tallennuksessa." });
  }
});

// --- SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Niilo-botti käynnissä portissa ${PORT}`);
});
