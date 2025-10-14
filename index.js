import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Testireitti (näkyy selaimessa tai Railwayn URL:ssa)
app.get("/", (req, res) => {
  res.send("👋 Niilo on hereillä ja toimii Railwaylla!");
});

// (Valinnainen: helppo statusreitti)
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Niilo hengittää" });
});

// Käynnistä serveri oikeassa portissa (Railway käyttää PORT-ympäristömuuttujaa)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Niilo käynnissä portissa ${PORT}`);
});

