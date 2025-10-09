const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";

  try {
    const response = await fetch("/chat-endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) throw new Error("Virhe palvelimessa");
    const data = await response.json();

    addMessage("niilo", data.reply);

    if (data.audioUrl) {
      const audio = new Audio(data.audioUrl);
      audio.play().catch(err => console.error("Äänen toisto epäonnistui:", err));
    }

  } catch (err) {
    console.error(err);
    addMessage("error", "😬 Jotain meni pieleen. Yritä uudelleen.");
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
  } else {
    msg.classList.add("bg-red-700");
    msg.textContent = text;
  }

  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

