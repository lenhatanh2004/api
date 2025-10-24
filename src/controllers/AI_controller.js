import { chat as llmChat } from '../services/llmService.js';

const USE_FALLBACK = String(process.env.AI_FALLBACK_ON_ERROR || '').toLowerCase() === 'true';

function fallbackChat(language = 'vi') {
  return language === 'vi'
    ? 'Tạm thời vượt hạn mức AI. Mẹo nhanh: thử hít 4s, giữ 7s, thở 8s trong 3–5 vòng để thư giãn.'
    : 'AI quota reached. Quick tip: try 4-7-8 breathing for 3–5 rounds to relax.';
}

const MAX_LEN = 2000;

export async function chat(req, res, next) {
  try {
    const { messages, language = 'vi' } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages must be non-empty array' });
    }
    // sanitize and clamp
    const trimmed = messages.slice(-15).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || m.text || '').slice(0, MAX_LEN)
    }));
    const system = {
      role: 'system',
      content: [
        'Bạn là trợ lý giấc ngủ FlowState: lịch sự, ngắn gọn, hữu ích. ',
        'Có thể kể chuyện ru ngủ, thiền 4-7-8, mẹo vệ sinh giấc ngủ. ',
        'Không chẩn đoán bệnh; khuyến khích gặp chuyên gia khi cần. ',
        `Trả lời bằng ngôn ngữ: ${language}.`
      ].join('')
    };
    const { text } = await llmChat([system, ...trimmed], { max_tokens: 550 });
    res.json({ success: true, reply: text });
  } catch (err) {
    // Map quota/429 to user-friendly message or fallback
    if ((err?.statusCode === 429 || err?.statusCode === 503) && USE_FALLBACK) {
      const { language = 'vi' } = req.body || {};
      return res.json({ success: true, reply: fallbackChat(language), _fallback: true });
    }
    if (err?.statusCode === 429) {
      return res.status(429).json({ success: false, message: 'AI quota exceeded. Please try later.' });
    }
    next(err);
  }
}
