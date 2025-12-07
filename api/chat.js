// api/chat.js

export default async function handler(req, res) {
  // CORS ayarları (GitHub Pages'ten istek gelsin diye)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (OPTIONS) isteği geldiyse hemen dön
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Sağlık kontrolü için GET
  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", name: "MØR•AI backend" });
  }

  // Sadece POST ile sohbet alacağız
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Sadece POST isteği kabul ediliyor." });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "message alanı zorunlu" });
  }

  try {
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "Sen MØR•AI isimli Türkçe konuşan yardımcı botsun. Sallamadan, kısa ama net cevaplar ver. Emin olmadığın konularda 'bilmiyorum' de.",
            },
            { role: "user", content: message },
          ],
          max_tokens: 350,
        }),
      }
    );

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI hata:", errText);
      return res
        .status(500)
        .json({ error: "OpenAI isteği başarısız oldu, loglara bakmak lazım." });
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Cevap alınamadı reis, birazdan tekrar dener misin?";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Sunucu hatası:", err);
    return res.status(500).json({
      error: "Sunucu tarafında bir hata oluştu, biraz sonra tekrar dene reis.",
    });
  }
}
