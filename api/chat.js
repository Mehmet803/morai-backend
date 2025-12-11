// API/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message alanı gerekli" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY eksik" });
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: message }],
        }),
      }
    );

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI Error:", data);
      return res.status(500).json({ error: "OpenAI hatası", detail: data });
    }

    const reply = data.choices?.[0]?.message?.content || "Boş yanıt";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
