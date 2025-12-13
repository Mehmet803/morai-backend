export default async function handler(req, res) {
  // Sadece POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Gemini hata döndürürse direkt göster
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gemini API error",
        detail: data,
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join("") || "";

    // Boş gelirse bile açıklama yaz
    if (!reply) {
      return res.status(200).json({
        reply: "⚠️ Gemini boş yanıt döndürdü.",
        raw: data,
      });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: String(err?.message || err),
    });
  }
}
