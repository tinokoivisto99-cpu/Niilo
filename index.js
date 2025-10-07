require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

async function main() {
  try {
    if (!process.env.OPEN_API_KEY) {
      console.error("❌ OPEN_API_KEY puuttuu. Tarkista .env-tiedosto.");
      process.exit(1);
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hei GPT! Tämä on testi Node.js:llä." }
      ]
    });

    console.log("✅ Vastaus:", completion.choices[0].message.content);
  } catch (err) {
    console.error("❌ Virhe:", err);
  }
}

main();

