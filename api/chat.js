import formidable from "formidable";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Form parse error", detail: String(err) });

      // formidable bazen alanları array döndürür
      const messageRaw = fields.message;
      const message = Array.isArray(messageRaw) ? messageRaw[0] : messageRaw;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY eksik (Vercel env)" });

      // Not: Bu endpoint video/mp4 görmez. Sadece metin işler.
      const payload = {
        contents: [{ parts: [{ text: message || "" }] }]
      };

      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey;

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json();

      // Gemini error döndürürse aynen göster
      if (!r.ok) {
        return res.status(r.status).json({
          error: "Gemini error",
          status: r.status,
          detail: j?.error || j,
        });
      }

      const reply = j?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("\n") || "";

      if (!reply) {
        return res.status(200).json({
          reply: "Gemini boş döndü. (Muhtemelen kota/rate limit/model erişimi) — detay için console/log.",
          raw: j
        });
      }

      return res.status(200).json({ reply });
    } catch (e) {
      return res.status(500).json({ error: "Server crash", detail: String(e?.message || e) });
    }
  });
}
