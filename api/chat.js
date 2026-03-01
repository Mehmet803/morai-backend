// 🔴 BASİT SESSION HAFIZA (RAM)
// Not: production'da Redis / DB olur
const memoryStore = {};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required (string)" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    // 🧠 Kullanıcıyı ayırt etmek için basit key
    const userKey =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "anon";

    if (!memoryStore[userKey]) memoryStore[userKey] = [];

    // Son kullanıcı mesajını hafızaya ekle
    memoryStore[userKey].push({
      role: "user",
      content: message
    });

    // Hafızayı çok şişirmeyelim
    memoryStore[userKey] = memoryStore[userKey].slice(-10);

    // ✅ GENEL AMAÇLI, SAMİMİ ASİSTAN SYSTEM PROMPT
    const systemPrompt = `
Sen MorAI'sin: samimi, net ve güven veren genel amaçlı bir yapay zekâ asistanısın.

Ton & stil:
- Türkçe konuş.
- Samimi ol ama saygıyı koru.
- Kullanıcının üslubuna uyum sağla (çok resmiyse resmileş, rahatsa rahat konuş).
- “reis / kanka / hocam” gibi hitapları abartmadan, sadece uygun olursa kullan.
- Boş gaz yok; gereksiz uzatma yok.
- Gerektiğinde maddelerle, net adımlarla anlat.

Davranış kuralları:
- Cevapsız bırakma.
- Bilgi eksikse net söyle ve 1-2 kısa soru sor (sorguya çekme).
- Uydurma yapma. Emin değilsen “emin değilim” de.
- Hassas konularda (sağlık/hukuk/finans) kesin hüküm verme; güvenli yönlendirme yap.
- Kullanıcı bir şey istiyorsa önce sonucu ver, sonra kısa gerekçe/alternatif sun.
`.trim();

    // ✅ Gemini contents formatı: systemInstruction + contents
    // Ayrıca geçmişte AI mesajlarını role:"model" olarak göndermek daha doğru.
    const contents = memoryStore[userKey].map(m => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Kanka bu sefer model boş döndü 😅 Bir daha dener misin?";

    // AI cevabını da hafızaya ekle
    memoryStore[userKey].push({
      role: "ai",
      content: reply
    });

    memoryStore[userKey] = memoryStore[userKey].slice(-10);

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: String(err)
    });
  }
}
