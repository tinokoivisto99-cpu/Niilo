// index.js
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());
app.use(express.static("public")); // näyttää public-kansion sisällön (frontend)

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// testiviesti kun käynnistyy
app.get("/", (req, res) => {
  res.send("🤖 Botti on hereillä! Käytä POST /chat lähettääksesi viestin.");
});

// chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Viesti puuttuu." });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Olet ystävällinen ja avulias suomenkielinen assistentti." },
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveri käynnissä portissa ${PORT}`));

