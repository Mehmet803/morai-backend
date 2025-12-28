// MORAI CHAT + HAFIZA

const API_URL = "https://morai-backend-git-main-mehmets-projects-5ba929d4.vercel.app/api/chat";

// Hafıza (localStorage)
let memory = JSON.parse(localStorage.getItem("morai_memory")) || [];

// Mesaj gönderme
async function sendMessage(text) {
  // Kullanıcı mesajını hafızaya ekle
  memory.push({ role: "user", content: text });

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: memory
      })
    });

    if (!res.ok) throw new Error("Sunucu hatası");

    const data = await res.json();

    // Bot cevabını hafızaya ekle
    memory.push({ role: "assistant", content: data.reply });

    // Hafızayı kaydet
    localStorage.setItem("morai_memory", JSON.stringify(memory));

    return data.reply;
  } catch (err) {
    return "Sunucu hatası: Failed to fetch";
  }
}

// Hafızayı temizle
function clearMemory() {
  memory = [];
  localStorage.removeItem("morai_memory");
}
