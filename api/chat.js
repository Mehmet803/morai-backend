// API/chat.js — STABİL SÜRÜM
// v1 endpoint + gemini-pro  (Google dokümandaki örnek ile aynı mantık)

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
        .json({
          reply: "Hata: İstek gövdesinde 'message' adlı metin alanı bekleniyor.",
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(200)
        .json({ reply: "Hata: Sunucuda GEMINI_API_KEY tanımlı değil." });
    }

    // 🔥 RESMİ ÖRNEK FORMAT: v1 + gemini-pro
    // https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent
    const url =
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,     // key’i header’da gönderiyoruz
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
      // JSON parse edilemezse ham metni direkt göstereceğiz
    }

    let replyText = "";

    // Normal cevap
    if (data && data.candidates && data.candidates[0]?.content?.parts) {
      replyText = data.candidates[0].content.parts
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("\n")
        .trim();
    }

    // Hata veya boş cevap durumunda
    if (!replyText) {
      if (data && data.error) {
        const code = data.error.code;
        const msg = data.error.message || "";
        replyText =
          "Gemini bir hata döndürdü (kod: " + code + "): " + msg;
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
