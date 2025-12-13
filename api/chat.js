import formidable from "formidable";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Form parse error", detail: String(err) });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY eksik" });

      const messageRaw = fields.message;
      const message = Array.isArray(messageRaw) ? messageRaw[0] : (messageRaw || "");

      // Log amaçlı: gelen dosya var mı?
      const incomingFiles = files.files || files.file || files.upload || null;

      const payload = {
        contents: [{ parts: [{ text: message }] }]
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

      if (!r.ok) {
        return res.status(r.status).json({
          error: "Gemini error",
          status: r.status,
          detail: j,
          debug_received_files: incomingFiles ? true : false
        });
      }

      const reply =
        j?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("\n") || "";

      // Burada artık "Boş yanıt"ı direkt debug ile döndürüyoruz
      if (!reply) {
        return res.status(200).json({
          reply: "",
          warning: "Gemini reply boş döndü",
          raw: j,
          debug_received_files: incomingFiles ? true : false
        });
      }

      return res.status(200).json({ reply, debug_received_files: incomingFiles ? true : false });
    } catch (e) {
      return res.status(500).json({ error: "Server crash", detail: String(e?.message || e) });
    }
  });
}
