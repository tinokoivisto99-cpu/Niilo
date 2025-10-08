const form = document.querySelector("form");
const input = document.querySelector("#input");
const chat = document.querySelector("#chat");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.textContent = `Sinä: ${message}`;
  chat.appendChild(userMsg);

  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    const reply = data.reply || "Niilo ei nyt vastannut...";

    const botMsg = document.createElement("div");
    botMsg.className = "msg bot";
    botMsg.textContent = `Niilo: ${reply}`;
    chat.appendChild(botMsg);

    chat.scrollTop = chat.scrollHeight;
  } catch (err) {
    const errMsg = document.createElement("div");
    errMsg.className = "msg bot";
    errMsg.textContent = "Niilo: Jokin meni pieleen 😅";
    chat.appendChild(errMsg);
  }
});

