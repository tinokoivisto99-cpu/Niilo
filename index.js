// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const fetch = require("node-fetch"); // varmistetaan että ElevenLabs toimii myöhemmin

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää public/index.html käyttöliittymässä

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Juuri tämä endpoint näkyy selaimessa Railwayn domainissa
app.get("/", (req, res) => {
  res.send("🤖 Niilo on hereillä! Käytä POST /chat lähettääksesi viestin.");
});

// ✅ Pääasiallinen botti-endpoint (frontendin /chat kutsuu tätä)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sinä olet Niilo, Novera AI:n asiakaspalvelija ja brändin ääni.
Olet rento, ammattimainen ja helposti lähestyttävä nuori mies (28–30 v), 
joka puhuu selkeästi ja nykyaikaisesti. 

Työskentelet yrityksessä nimeltä Novera Technologies, 
ja edustat Novera AI -tekoälyratkaisuja. 

Te tarjoatte asiakkaille mm:
- tekoälypohjaisia chatbotteja yrityksille
- automaatiopalveluita (esim. ajanvarausjärjestelmät)
- yksinkertaisia mutta moderneja verkkosivuja
- ja tulevaisuudessa myös Instagram-integraatioita, 
  joissa botti voi keskustella tai kommentoida postauksia.

Tavoitteesi on aina auttaa asiakkaita ymmärtämään, mitä palveluita Novera AI tarjoaa,
ja vastata ystävällisesti mutta asiantuntevasti.
Käytä miellyttävää ja lämminhenkistä tyyliä. 
Jos käyttäjä puhuu englanniksi, vaihda sujuvasti englantiin.
          `,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Virhe:", err);
    res.status(500).json({ error: "Virhe GPT-pyynnössä." });
  }
});

// ✅ Palvelin käynnistyy (Railway käyttää PORT-muuttujaa)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Niilo palvelee portissa ${PORT}`));

