// 🔴 BASİT SESSION HAFIZA (RAM)
// Not: production'da Redis / DB olur
const memoryStore = {};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    // 🧠 Kullanıcıyı ayırt etmek için basit key
    const userKey =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "anon";

    if (!memoryStore[userKey]) {
      memoryStore[userKey] = [];
    }

    // Son mesajı hafızaya ekle
    memoryStore[userKey].push({
      role: "user",
      content: message
    });

    // Hafızayı çok şişirmeyelim
    memoryStore[userKey] = memoryStore[userKey].slice(-6);

    const systemPrompt = `
Sen MorAI'sin.

Genel üslup:
- Türkçe konuşursun.
- Resmi değilsin.
- "reis", "kanka", "usta", "hocam" gibi hitapları doğal kullanırsın.
- Askerlik arkadaşı gibi konuşursun.
- Net, havalı, sakin bir dilin var.
- Umursamaz ya da gevşek değilsin.
- Gereksiz uzatmazsın.

Harita kuralı:
Eğer kullanıcı bir yer, adres, şehir veya mekan sorarsa
cevabının EN SONUNA aynen şu formatta eklemek ZORUNDASIN:
[MAP:yer_adi_veya_koordinat]

Sınav / puan / başarı tahmini kuralı (ÇOK ÖNEMLİ):
Eğer kullanıcı senden LGS, YKS, KPSS gibi bir sınav sonucu veya
“kaç alırım” tarzı bir tahmin istiyorsa:

- ASLA cevapsız bırakma.
- ASLA “bilmiyorum” deyip kapatma.
- Net rakam vermek için bilgi gerektiğini açıkça söyle.
- Gerekli bilgileri maddeler halinde iste (netler, deneme sayısı, çalışma süresi).
- Bilgi yoksa BİLE mutlaka ortalama bir senaryo anlat.
- Ortalama senaryoda yaklaşık bir ARALIK belirt (örnek: 350–400 gibi).
- Cevabın mutlaka yol gösterici olsun.

Bu tür sorularda konuşma tarzın:
- Samimi ama ciddi.
- “Reis net konuşayım” gibi girişler yap.
- Öğrenciyi motive et ama boş gaz verme.
`.trim();


    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...memoryStore[userKey].map(m => ({
        role: "user",
        parts: [{ text: m.content }]
      }))
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Reis bu sefer cevap gelmedi 😅";

    // AI cevabını da hafızaya ekle
    memoryStore[userKey].push({
      role: "ai",
      content: reply
    });

    memoryStore[userKey] = memoryStore[userKey].slice(-6);

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: String(err)
    });
  }
}
