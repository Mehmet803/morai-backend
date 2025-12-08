// api/chat.js

export default async function handler(req, res) {
  // ===== CORS AYARLARI =====
  res.setHeader("Access-Control-Allow-Origin", "https://mehmet803.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (OPTIONS) isteği
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // =========================

  // Sağlık kontrolü
  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", name: "MØR•AI backend" });
  }

  // Sadece POST kabul
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST istek kabul edilir." });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "message alanı zorunlu." });
  }

  try {
    // OpenAI Chat Completion isteği
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // OPENAI_API_KEY Vercel Environment Variable içinde olmalı
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Sen MØR•AI isimli Türkçe konuşan bir asistansın. Sallama, kısa ve net cevap ver. Emin olmadığın yerde 'bilmiyorum' de.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 300,
      }),
    });

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
      "Reis, OpenAI'den düzgün bir cevap çekemedim.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Sunucu hatası:", err);
    return res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
  }
}
