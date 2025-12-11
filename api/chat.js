// API/chat.js — GEMINI ÜCRETSİZ BACKEND

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message alanı gerekli" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY eksik" });
    }

    // GEMINI API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: message }] }
        ]
      })
    });

    const data = await geminiResponse.json();

    // Hata varsa
    if (!geminiResponse.ok) {
      console.error("Gemini Error:", data);
      return res.status(500).json({ error: "Gemini isteği başarısız", detail: data });
    }

    // Gemini yanıt formatı
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Boş yanıt (Gemini)";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
  }
}
