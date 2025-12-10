// api/chat.js

export default async function handler(req, res) {
  // CORS (ileride başka yerden çağırmak istersen sorun çıkmasın diye)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", name: "MØR•AI backend" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Reis, sadece POST kabul ediyorum." });
  }

  // Gövdeyi (body) güvenli şekilde oku
  let rawBody = "";
  req.on("data", (chunk) => {
    rawBody += chunk;
  });

  req.on("end", async () => {
    try {
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      const message = parsed.message;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ reply: "Reis, önce bir şey yazman lazım." });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res
          .status(500)
          .json({ reply: "Reis, beynim bağlantısız: OPENAI_API_KEY tanımlı değil." });
      }

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Sen MØR•AI isimli Türkçe konuşan bir asistansın. Sallama, uydurma. Emin değilsen 'bilmiyorum' de. Kısa ve net cevap ver.",
            },
            { role: "user", content: message },
          ],
          max_tokens: 300,
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text().catch(() => "");
        console.error("OpenAI hata:", openaiRes.status, errText);
        return res
          .status(500)
          .json({ reply: `Reis, OpenAI hata verdi (kod: ${openaiRes.status}).` });
      }

      const data = await openaiRes.json();
      const reply =
        data?.choices?.[0]?.message?.content ||
        "Reis, OpenAI'den düzgün bir cevap çekemedim.";

      return res.status(200).json({ reply });
    } catch (err) {
      console.error("Sunucu hatası:", err);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ reply: "Reis, sunucu tarafında beklenmeyen bir hata oldu." });
      }
    }
  });
}
