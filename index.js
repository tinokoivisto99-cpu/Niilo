// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");

const app = express();

// OpenAI-asiakas
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

// Testireitti, joka kysyy OpenAI:lta vastauksen
app.get("/", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY puuttuu. Tarkista .env-tiedosto tai Railway Variables.");
      return res.status(500).send("Serverin konfiguraatio-ongelma.");
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Olet avulias avustaja." },
        { role: "user", content: "Hei GPT! Tämä on testi Railway-palvelimelta." }
      ],
    });

    const vastaus = completion.choices[0].message.content;
    console.log("✅ Vastaus:", vastaus);
    res.send(`GPT vastasi: ${vastaus}`);
  } catch (err) {
    console.error("❌ Virhe:", err);
    res.status(500).send("Virhe palvelussa: " + err.message);
  }
});

// Portti (Railway asettaa sen automaattisesti)
const PORT = process.env.PORT || 3000;

// Käynnistetään palvelin
app.listen(PORT, () => {
  console.log(`🚀 Serveri käynnissä portissa ${PORT}`);
});

