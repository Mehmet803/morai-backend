// API/chat.js — Gemini 1.5 Flash *DOĞRU MODEL* + düzgün hata mesajı

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

    // 🔥 DOĞRU MODEL BURADA
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

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

    let replyText = "";

    if (data && data.candidates && data.candidates[0]?.content?.parts) {
      replyText = data.candidates[0].content.parts
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("\n")
        .trim();
    }

    if (!replyText) {
      if (data && data.error) {
        const code = data.error.code;
        const msg = data.error.message || "";
        replyText =
          "Gemini bir hata döndürdü (kod: " +
          code +
          "): " +
          msg;
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
