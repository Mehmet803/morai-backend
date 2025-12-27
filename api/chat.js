export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message, file } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    const systemPrompt = `
Sen MorAI'sin.
Rahat konuşursun.
"reis", "kanka" gibi samimi hitaplar kullanırsın.
Uzatmazsın, net konuşursun.
Türkçe cevap verirsin.
Gereksiz resmiyet yok.
`;

    let finalMessage = message || "";
    if (file) {
      finalMessage += "\n\n--- DOSYA İÇERİĞİ ---\n" + file;
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              { text: finalMessage }
            ]
          }]
        }),
      }
    );

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Valla reis bu sefer boş düştü 😅";

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
