// api/chat.js
export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", name: "MØR•AI backend" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul ediliyor." });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "message alanı zorunlu" });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
              "Sen MØR•AI isimli Türkçe konuşan yardımcı botsun. Kısa ama net cevap ver. Sallama ve emin olmadığın yerde bilmiyorum de.",
          },
          { role: "user", content: message }
        ],
        max_tokens: 350
      })
    });

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Cevap alınamadı reis, tekrar dener misin?";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI hata:", error);
    return res.status(500).json({ error: "Bir hata oluştu, tekrar dene." });
  }
}
