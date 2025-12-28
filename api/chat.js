/* ===============================
   MORAI CHAT.JS (HAFIZALI)
   =============================== */

const API_URL = "https://morai-backend-git-main-mehmets-projects-5ba929d4.vercel.app/api/chat";
const MEMORY_KEY = "morai_chat_memory";
const MAX_MEMORY = 20; // son 20 mesajı tutar

// Hafızayı yükle
function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || [];
  } catch {
    return [];
  }
}

// Hafızayı kaydet
function saveMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

// Hafızayı temizle
function clearMemory() {
  localStorage.removeItem(MEMORY_KEY);
}

// Ana gönderme fonksiyonu
async function sendMessageToMorAI(userText) {
  let memory = loadMemory();

  // Kullanıcı mesajı
  memory.push({
    role: "user",
    content: userText,
    time: Date.now()
  });

  // Hafızayı sınırla
  if (memory.length > MAX_MEMORY) {
    memory = memory.slice(-MAX_MEMORY);
  }

  saveMemory(memory);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: memory.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      throw new Error("API_ERROR");
    }

    const data = await response.json();

    const botReply = data.reply || "Cevap alınamadı.";

    // Bot cevabı
    memory.push({
      role: "assistant",
      content: botReply,
      time: Date.now()
    });

    if (memory.length > MAX_MEMORY) {
      memory = memory.slice(-MAX_MEMORY);
    }

    saveMemory(memory);

    return botReply;

  } catch (error) {
    console.error("MorAI hata:", error);
    return "❌ Sunucuya bağlanılamadı (Failed to fetch)";
  }
}

/* ===============================
   UI İÇİN YARDIMCI
   =============================== */

// Sayfa açılınca eski sohbeti al
function getConversation() {
  return loadMemory();
}

// Global erişim (HTML'den çağırabilmek için)
window.sendMessageToMorAI = sendMessageToMorAI;
window.clearMorAIMemory = clearMemory;
window.getMorAIConversation = getConversation;
