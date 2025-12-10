export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", name: "MØR•AI backend" });
  }

  const body = await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data || "{}")));
  });

  const { message } = body;
  if (!message) {
    return res.status(400).json({ error: "message alanı zorunlu." });
  }

  try {
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
              "Sen MØR•AI isimli Türkçe bir asistansın. Cevapların net, kısa ve doğru olmalı.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "Cevap alınamadı.";

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("API ERROR:", e);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
}
