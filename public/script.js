const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
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
  sendBtn.disabled = isLoading;
  sendBtn.textContent = isLoading ? "Lähetetään..." : "Lähetä";
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
  } else {
    msg.classList.add("bg-red-700");
    msg.textContent = text;
  }

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

