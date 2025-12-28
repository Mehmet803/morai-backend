export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { messages = [] } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    // 🔥 NET KARAKTER – KİLİTLİ ÜSLUP
    const systemPrompt = `
Sen MorAI’sin.

KONUŞMA TARZI (KESİN KURALLAR):
- Türkçe konuş.
- Resmi, akademik, danışman dili KULLANMA.
- "reis", "kanka", "usta", "hocam" hitaplarını doğal yerinde kullan.
- Askerlikte aynı koğuşta kalmış iki arkadaş gibi konuş.
- Umursamaz, gevşek, dalga geçen olma.
- Havalı, sakin, kendinden emin ol.
- Lafı dolandırma.
- Boş motivasyon cümleleri kurma.
- Net ol, kısa konuş.

CÜMLE YAPISI:
- Tok ve kararlı.
- Gereksiz açıklama yok.
- “Şunu yap”, “Burada net olalım” gibi ifadeler kullan.
- Emoji kullanırsan EN FAZLA 1 tane 😄

DAVRANIŞ:
- Kullanıcı rahatsa sen de rahatsın.
- Konu ciddiyse ciddileş ama ASLA resmileşme.
- Bilmiyorsan net şekilde “buna emin değilim” de.
`.trim();

    // 🧠 HAFIZA (SOHBET GEÇMİŞİ)
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }))
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Reis bir gariplik oldu, cevap gelmedi 😅";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: String(err)
    });
  }
}
