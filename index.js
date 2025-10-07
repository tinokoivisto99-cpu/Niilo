// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");

const app = express();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY puuttuu. Tarkista .env-tiedosto.");
      return res.status(500).send("API-avain puuttuu.");
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hei GPT! Tämä on testi Node.js:llä." },
      ],
    });

    const reply = completion.choices[0].message.content;
    console.log("✅ Vastaus:", reply);
    res.send(`✅ GPT vastasi: ${reply}`);
  } catch (err) {
    console.error("💥 Virhe:", err);
    res.status(500).send("Virhe palvelussa.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveri käynnissä portissa ${PORT}`);
});

