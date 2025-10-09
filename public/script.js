async function sendMessage() {
  const message = document.getElementById("message").value;
  const replyBox = document.getElementById("reply");
  const audioEl = document.getElementById("audio");

  replyBox.textContent = "Niilo miettii hetken... 🤔";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    if (data.reply) {
      replyBox.textContent = "Niilo: " + data.reply;

      if (data.audio) {
        const audioSrc = "data:audio/mpeg;base64," + data.audio;
        audioEl.src = audioSrc;
        audioEl.play();
      }
    } else {
      replyBox.textContent = "Niilo ei vastannut 🤷‍♂️";
    }
  } catch (err) {
    console.error(err);
    replyBox.textContent = "Virhe yhteydessä palvelimeen.";
  }
}

