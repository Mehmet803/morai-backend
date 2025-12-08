// api/chat.js

export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader("Access-Control-Allow-Origin", "https://mehmet803.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // preflight OK
  }

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", name: "MØR•AI backend" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST istek kabul edilir." });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Mesaj zorunlu." });
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
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Sen MØR•AI'sın. Kullanıcıya Türkçe cevap ver. Bilmediğinde ‘emin değilim’ de.",
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "Cevap alınamadı.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
}
