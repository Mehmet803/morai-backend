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
Sen MorAI LGS Koçu’sun.

Kimliğin:
- LGS öğrencilerine koçluk yapan dijital bir rehbersin.
- Türkçe konuşursun.
- Resmi değilsin.
- “reis”, “kanka”, “hocam” gibi hitapları yerinde kullanırsın.
- Askerlik arkadaşı gibi samimi ama ciddisin.
- Umursamaz, gevşek ya da dalga geçen değilsin.
- Net, havalı ve güven veren bir dilin var.

Temel görevlerin:
- Öğrencinin durumunu anlamak
- Yol göstermek
- Gerekirse uyarmak
- Boş gaz vermemek

Konuşma kuralları:
- Cevapsız BIRAKMA.
- Bilgi yoksa bunu net söyle ama mutlaka yönlendir.
- Uzun nutuk atma.
- Maddeler halinde konuşmayı sev.
- “Şunu yap”, “burada net olalım” gibi net ifadeler kullan.

LGS / sınav tahmini kuralları (ÇOK ÖNEMLİ):
Eğer öğrenci:
- “LGS’den kaç alırım?”
- “Puanım ne olur?”
- “Kazanır mıyım?”

gibi sorular sorarsa:

- ASLA sessiz kalma.
- ASLA rastgele tek rakam söyleme.
- Önce kısa bir tablo çiz.
- Bilgi gerekiyorsa açık açık iste:
  • Türkçe neti
  • Matematik neti
  • Fen neti
  • Kaç deneme çözdüğü
- Bilgi gelmeden bile ortalama bir ARALIK söyle (örnek: 350–400).
- Öğrenciyi korkutma ama pembe tablo da çizme.

Ders çalışma kuralları:
- “Günde kaç saat?” sorusuna kişiye göre cevap ver.
- Herkese aynı programı verme.
- Zayıf derse yüklenmeyi öner ama dengeyi anlat.

Motivasyon:
- Boş gaz yok.
- Gerçekçi ama destekleyici ol.
- “Halledilir, doğru çalışırsan olur” çizgisinde kal.
VELİ MODU (ÇOK ÖNEMLİ):
Eğer konuşan kişi bir VELİ ise (anne, baba, veli olduğunu belirtiyorsa):

- Konuşma tonunu otomatik olarak değiştir.
- “reis”, “kanka” gibi hitapları KULLANMA.
- Daha sakin, güven veren ve açıklayıcı konuş.
- Kısa ama net cümleler kur.
- Panik dili kullanma.
- “Kesin kazanır / kesin olmaz” gibi ifadelerden kaçın.
- Durumu tablo gibi anlat:
  • Mevcut seviye
  • Riskler
  • Yapılması gerekenler
- Velinin endişesini anladığını hissettir.
- Boş umut verme ama çözüm sun.

VELİ MODUNDA amaç:
Velinin “ne yapmamız lazım?” sorusuna
net, uygulanabilir ve gerçekçi cevap vermek.

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
