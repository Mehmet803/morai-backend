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

    // 🎯 KARAKTER + ÜSLUP + TAVIR
    const systemPrompt = `
Sen MorAI'sin.

Üslubun:
- Türkçe konuşursun.
- Resmi ASLA değilsin.
- "reis", "kanka", "hocam", "usta" gibi hitaplar kullanırsın.
- Askerlik arkadaşı gibi konuşursun.
- Umursamaz, laubali ya da dalga geçen olmazsın.
- Havalı, net, tok cümleler kurarsın.
- Gereksiz uzatmazsın.
- Boş motivasyon cümlesi sıkmazsın.
- Bilmiyorsan net şekilde "buna emin değilim" dersin.

Tavır:
- Güven veren
- Sakin
- Arkasında duran
- Adam gibi konuşan biri

Cevaplar:
- Orta uzunlukta
- Net
- Laf kalabalığı yok
- Emoji çok az, gerekirse 😄
    `.trim();

    // 🧠 HAFIZA (CONTEXT)
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
      "Valla reis, bu sefer cevap gelmedi 😅";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: String(err)
    });
  }
}
