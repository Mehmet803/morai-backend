// API/chat.js — Gemini 1.5 Flash, temiz + Türkçe hata mesajlı

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(200)
      .json({ reply: "Bu endpoint sadece POST isteklerini kabul eder." });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res
        .status(200)
        .json({ reply: "Hata: İstek gövdesinde 'message' (metin) bekleniyor." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(200)
        .json({ reply: "Hata: Sunucuda GEMINI_API_KEY tanımlı değil." });
    }

    // Daha yaygın model: gemini-1.5-flash
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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
    } catch (_) {
      // JSON değilse ham metni kullanacağız
    }

    // Normal cevap çıkarmayı dene
    let replyText = "";

    if (data && data.candidates && data.candidates[0]?.content?.parts) {
      replyText = data.candidates[0].content.parts
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("\n")
        .trim();
    }

    // Hata durumları için daha okunur mesaj
    if (!replyText) {
      if (data && data.error) {
        const code = data.error.code;
        const msg = data.error.message || "";
        if (code === 503) {
          replyText =
            "Gemini modeli şu an çok yoğun ve geçici olarak kullanılamıyor. " +
            "Biraz bekleyip tekrar dene.\n\nSunucu mesajı: " +
            msg;
        } else {
          replyText =
            "Gemini bir hata döndürdü (kod: " +
            code +
            "): " +
            msg;
        }
      } else {
        replyText =
          "Gemini'den beklenen metin gelmedi. Ham yanıt:\n\n" + rawText;
      }
    }

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    return res.status(200).json({
      reply: "Sunucu tarafında yakalanan bir hata oluştu:\n" + String(err),
    });
  }
}
