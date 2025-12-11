// API/chat.js — Gemini backend (debug + çalışır versiyon)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ reply: "Sadece POST isteği kabul ediliyor." });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res
        .status(200)
        .json({ reply: "Hata: body içinde 'message' string bekleniyor." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(200)
        .json({ reply: "Hata: Sunucuda GEMINI_API_KEY tanımlı değil." });
    }

    // Güncel Gemini endpoint + model
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const rawText = await geminiResponse.text();

    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // JSON değilse ham metni göstereceğiz
    }

    // Önce normal metni çıkarmayı dene
    let replyText = "";

    if (data && data.candidates && data.candidates[0]?.content?.parts) {
      replyText = data.candidates[0].content.parts
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("\n")
        .trim();
    }

    // Hâlâ boşsa: HTTP kod + ham response'u göster
    if (!replyText) {
      replyText =
        "Gemini HTTP status: " +
        geminiResponse.status +
        "\n\nHam yanıt:\n" +
        rawText;
    }

    // Ne olursa olsun 200 ve reply dönüyoruz ki frontend düzgün göstersin
    return res.status(200).json({ reply: replyText });
  } catch (err) {
    return res.status(200).json({
      reply: "Sunucu tarafında yakalanan hata:\n" + String(err),
    });
  }
}
