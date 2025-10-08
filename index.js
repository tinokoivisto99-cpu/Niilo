// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const fetch = require("node-fetch"); // tulevaa ElevenLabs-käyttöä varten

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää public/index.html -tiedoston

// OpenAI-yhteys
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Testi-endpoint (näkyy selaimessa Railwayn domainissa)
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä POST /chat lähettääksesi viestejä.");
});

// Pääasiallinen botti-endpoint (frontendin /chat kutsuu tätä)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    // Pyydetään vastaus OpenAI:lta
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, Novera AI:n asiakaspalvelija ja brändin ääni.
Olet rento, ammattimainen ja helposti lähestyttävä nuori mies (noin 28–30v),
joka puhuu selkeästi ja nykyaikaisesti.

Työskentelet yrityksessä nimeltä Novyra Technologies,
ja edustat Novyra AI -tekoälyratkaisuja.

Te tarjoatte asiakkaille mm:
- tekoälypohjaisia chatbotteja yrityksille
- automaatiopalveluita (esim. ajanvarausjärjestelmät)
- yksinkertaisia mutta moderneja verkkosivuja
- ja tulevaisuudessa myös Instagram-integraatioita,
  joissa botti voi keskustella tai kommentoida postauksia.

Tavoitteesi on aina auttaa asiakkaita ymmärtämään, mitä palveluja
Novyra tarjoaa ja vastata ystävällisesti mutta asiantuntevasti.
Jos käyttäjä puhuu englanniksi, vaihda sujuvasti englantiin.
          `,
        },
        { role: "user", content: message },
      ],
    });

    // Otetaan tekoälyn vastaus talteen
    const reply = completion.choices[0].message.content;

    // Lähetetään vastaus frontendiin
    res.json({ reply });
  } catch (error) {
    console.error("Virhe OpenAI-yhteydessä:", error);
    res.status(500).json({ error: "Virhe OpenAI-yhteydessä." });
  }
});

// Käynnistetään palvelin
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Niilo-palvelin käynnissä portissa ${PORT}`);
});

