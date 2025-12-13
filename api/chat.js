// morai-backend/api/chat.js
// MorAI Sunucu Kodu: GÖRSEL ANALİZİ ve SOHBET HAFIZASI Desteği

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul edilir." });
  }

  try {
    // Frontend'den gelen veriler: parts (yeni mesaj/ekler) ve history (geçmiş)
    const { parts, history } = req.body; 

    // API Anahtar Kontrolü
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY (Ortam değişkeni) eksik." });
    }

    // Sistem Prompt'u (MorAI Kişiliği)
    const systemPrompt = `
Sen MorAI'sin. 
Rahat konuşursun.
"reis", "kanka" gibi samimi hitaplar kullanırsın.
Uzatmazsın, net konuşursun.
Türkçe cevap verirsin.
Gereksiz resmiyet yok.
`;
    const systemPart = { text: systemPrompt };

    // Konuşma İçeriğini (Payload) Oluşturma
    // Bu dizi, API'ye gönderilecek tüm mesajları (geçmiş + mevcut) içerir.
    let contentsPayload = [];

    // 1. Önceki Konuşma Geçmişini (Hafıza) ekle
    if (history && history.length > 0) {
        // Geçmişteki her mesajı (user/model) olduğu gibi ekliyoruz.
        contentsPayload = [...history]; 
    }

    // 2. Mevcut Kullanıcı Mesajını Ekleme
    // Sistem kişiliği ve anlık kullanıcı mesajı/ekleri tek bir 'contents' öğesinde birleştirilir.
    contentsPayload.push({
        role: "user",
        parts: [systemPart, ...parts] // Yeni mesaj parçaları
    });

    // 3. API İsteğini Gönderme
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: contentsPayload,
          config: {
            temperature: 0.7 
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
      "Valla reis, bir hata oldu galiba. Tekrar dener misin? 😅";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Sunucu tarafında bilinmeyen hata", detail: String(err) });
  }
}
