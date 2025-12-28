export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Only POST allowed" });
  }

  try {
    const { messages } = req.body;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map(m => ({
            parts: [{ text: m.content }]
          }))
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Cevap alınamadı";

    // 🔴 HER ZAMAN JSON DÖN
    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);

    // 🔴 ASLA res.send / düz yazı YOK
    return res.status(500).json({
      reply: "Sunucu hatası"
    });
  }
}
