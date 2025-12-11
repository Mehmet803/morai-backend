// API/chat.js — GEMINI BACKEND (güncellenmiş)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message alanı gerekli" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY eksik" });
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
      apiKey;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini Error:", data);
      return res
        .status(500)
        .json({ error: "Gemini isteği başarısız", detail: data });
    }

    // ---- METNİ DAHA SAĞLAM ÇEK ----
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts
      .map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("\n")
      .trim();

    let reply;
    if (text) {
      reply = text;
    } else {
      // Hâlâ metin yoksa ham yanıtı göster ki boş kalmasın
      reply =
        "Gemini'den beklenen metin gelmedi, ham yanıt:\n\n" +
        JSON.stringify(data, null, 2);
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Backend error:", err);
    return res
      .status(500)
      .json({ error: "Sunucu hatası", detail: err.message });
  }
}
