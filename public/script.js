const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const statusBanner = document.getElementById("statusBanner");

let chatEnabled = true;
let voiceEnabled = true;

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

checkHealth();

async function sendMessage() {
  if (!chatEnabled) {
    addMessage("error", "Niilo ei voi vastata juuri nyt. Yritä hetken päästä uudelleen.");
    return;
  }

  if (sendBtn.disabled) return;
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";
  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      let errorMessage = "Virhe palvelimessa";
      try {
        const payload = await response.json();
        if (payload?.error) {
          errorMessage = payload.error;
        }
      } catch (error) {
        // Ei JSON-runkoa
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const reply = data.reply?.trim();

    if (!reply) throw new Error("Tyhjä vastaus");

    addMessage("niilo", reply);

    playVoice(reply);

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : null;
    addMessage("error", message || "😬 Jotain meni pieleen. Yritä uudelleen.");
  } finally {
    setLoading(false);
  }
}

async function playVoice(text) {
  if (!voiceEnabled) return;

  try {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        console.info("ElevenLabs ei ole käytössä:", await response.text());
      } else {
        console.warn("TTS ei käytettävissä");
      }
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    const cleanup = () => URL.revokeObjectURL(audioUrl);
    audio.addEventListener("ended", cleanup, { once: true });

    try {
      await audio.play();
    } catch (error) {
      cleanup();
      throw error;
    }
  } catch (error) {
    console.error("Äänen toisto epäonnistui:", error);
  }
}

function setLoading(isLoading) {
  const unavailable = !chatEnabled;
  sendBtn.disabled = isLoading || unavailable;
  userInput.disabled = isLoading || unavailable;

  if (unavailable) {
    sendBtn.textContent = "Ei käytettävissä";
    userInput.placeholder = "Niilo ei ole juuri nyt käytettävissä";
  } else {
    sendBtn.textContent = isLoading ? "Lähetetään..." : "Lähetä";
    userInput.placeholder = "Kirjoita viesti Niilolle...";
  }
}

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("p-3", "rounded-lg", "max-w-lg");

  if (sender === "user") {
    msg.classList.add("bg-green-700", "self-end", "ml-auto");
    msg.textContent = `🧑 ${text}`;
  } else if (sender === "niilo") {
    msg.classList.add("bg-gray-700", "self-start");
    msg.textContent = `🤖 ${text}`;
  } else if (sender === "info") {
    msg.classList.add("bg-blue-700", "self-center", "text-sm", "text-center");
    msg.textContent = text;
  } else {
    msg.classList.add("bg-red-700");
    msg.textContent = text;
  }

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

async function checkHealth() {
  try {
    const response = await fetch("/health");
    if (!response.ok) throw new Error("Palvelin ei vastaa");

    const data = await response.json();
    chatEnabled = data.chatEnabled !== false;
    voiceEnabled = data.voiceEnabled === undefined ? true : Boolean(data.voiceEnabled);

    if (!chatEnabled) {
      updateStatus("🔴 Niilo on tauolla (chat ei käytettävissä)", "error");
      addMessage("error", "Niilo ei ole käytettävissä, koska OPENAI_API_KEY puuttuu.");
    } else if (!voiceEnabled) {
      updateStatus("🟡 Niilo on linjoilla (ilman ääntä)", "warn");
      addMessage("info", "ℹ️  Äänivastaus ei ole käytössä.");
    } else {
      updateStatus("🟢 Niilo on linjoilla", "ok");
    }
  } catch (error) {
    chatEnabled = false;
    voiceEnabled = false;
    updateStatus("🔴 Niiloon ei saada yhteyttä", "error");
    addMessage("error", "Palvelimeen ei saatu yhteyttä. Yritä myöhemmin uudelleen.");
  } finally {
    setLoading(false);
  }
}

function updateStatus(text, tone = "neutral") {
  if (!statusBanner) return;

  statusBanner.textContent = text;

  const toneClassMap = {
    ok: "text-green-400",
    warn: "text-yellow-400",
    error: "text-red-400",
    neutral: "text-gray-400",
  };

  const toneClasses = Object.values(toneClassMap);
  statusBanner.classList.remove(...toneClasses);

  const selectedClass = toneClassMap[tone] ?? toneClassMap.neutral;
  statusBanner.classList.add(selectedClass);
}

