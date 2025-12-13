// morai-backend/api/chat.js
// MorAI Sunucu Kodu: Görsel Analizi ve Sohbet Hafızası Desteği

export default async function handler(req, res) {
  // Yalnızca POST isteklerine izin veriyoruz
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul edilir." });
  }

  try {
    // Frontend'den gelen verileri alıyoruz:
    // parts: Şu anki kullanıcının mesajı ve varsa Base64 formatındaki ekleri.
    // history: Önceki tüm konuşma geçmişi (API'nin anlayacağı formatta).
    const { parts, history } = req.body; 

    // 1. API Anahtar Kontrolü
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY (Ortam değişkeni) eksik." });
    }

    // 2. Sistem Prompt'u (MorAI Kişiliği)
    // Bu, yapay zekaya nasıl konuşması gerektiğini söyler.
    const systemPrompt = `
Sen MorAI'sin.
Rahat konuşursun.
"reis", "kanka" gibi samimi hitaplar kullanırsın.
Uzatmazsın, net konuşursun.
Türkçe cevap verirsin.
Gereksiz resmiyet yok.
`;
    // Sistem kişiliğini API'nin anlayacağı parçaya dönüştürüyoruz.
    const systemPart = { text: systemPrompt };

    // 3. Konuşma İçeriğini (Payload) Oluşturma
    let contentsPayload = [];

    // Önceki Konuşma Geçmişi (Hafıza)
    if (history && history.length > 0) {
        // Gelen geçmişi (history) olduğu gibi payload'a ekliyoruz.
        contentsPayload = [...history]; 
    }

    // Mevcut Kullanıcı Mesajını Ekleme
    // Sistem kişiliği (systemPart) ve anlık kullanıcı mesajı/ekleri tek bir 'contents' öğesinde birleştirilir.
    contentsPayload.push({
        role: "user",
        parts: [systemPart, ...parts]
    });

    // 4. API İsteğini Gönderme
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: contentsPayload,
          config: {
            temperature: 0.7 // Cevapların biraz daha tutarlı olması için.
          }
        }),
      }
    );

    const data = await response.json();
    
    // API'den hata döndü mü kontrol et
    if (data.error) {
        console.error("Gemini API Error:", data.error);
        return res.status(data.error.code || 500).json({ 
            error: "Gemini API'den hata döndü.", 
            detail: data.error.message 
        });
    }

    // Yanıtı alma ve temizleme
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Valla reis, bir hata oldu galiba. Ne olduğunu tam anlayamadım. Tekrar dener misin? 😅";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Sunucu tarafında bilinmeyen hata", detail: String(err) });
  }
}
