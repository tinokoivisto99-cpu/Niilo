document.getElementById("send").addEventListener("click", async () => {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");
  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `<div class="msg user">🧑‍💻 ${message}</div>`;
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  chat.innerHTML += `<div class="msg bot">🤖 ${data.reply}</div>`;
  chat.scrollTop = chat.scrollHeight;

  // 🎧 Jos ääni löytyy, toistetaan se
  if (data.audio) {
    const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
    audio.play();
  }
});

