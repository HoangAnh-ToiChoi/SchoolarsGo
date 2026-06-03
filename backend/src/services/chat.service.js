const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const OpenAI = require('openai');
const getSupabase = require('../utils/supabase');
const { extractIeltsScore } = require('../utils/helpers');
const { buildSystemInstruction } = require('./chat.policy');

// Regex-based filter extraction — không tốn Gemini quota
const COUNTRY_MAP = [
  { patterns: [/\b(úc|australia|australian)\b/i],      value: 'Australia' },
  { patterns: [/\b(anh|uk|united kingdom|britain)\b/i], value: 'UK' },
  { patterns: [/\b(mỹ|usa|america|united states)\b/i],  value: 'USA' },
  { patterns: [/\b(canada|canadian)\b/i],               value: 'Canada' },
  { patterns: [/\b(đức|germany|german)\b/i],            value: 'Germany' },
  { patterns: [/\b(pháp|france|french)\b/i],            value: 'France' },
  { patterns: [/\b(nhật|japan|japanese)\b/i],           value: 'Japan' },
  { patterns: [/\b(hàn|korea|korean|south korea)\b/i],  value: 'South Korea' },
  { patterns: [/\b(singapore)\b/i],                     value: 'Singapore' },
  { patterns: [/\b(new zealand|nz)\b/i],                value: 'New Zealand' },
  { patterns: [/\b(hà lan|netherlands|dutch)\b/i],      value: 'Netherlands' },
  { patterns: [/\b(thụy điển|sweden|swedish)\b/i],      value: 'Sweden' },
];

const extractFilters = (messages) => {
  const text = messages.slice(-8).map((m) => m.content).join(' ');
  const filters = {};

  // Country
  for (const { patterns, value } of COUNTRY_MAP) {
    if (patterns.some((p) => p.test(text))) { filters.country = value; break; }
  }

  // Degree
  if (/\b(tiến sĩ|phd|doctorate)\b/i.test(text))        filters.degree = 'PhD';
  else if (/\b(thạc sĩ|master|masters|sau đại học)\b/i.test(text)) filters.degree = 'Master';
  else if (/\b(đại học|cử nhân|bachelor|undergraduate)\b/i.test(text)) filters.degree = 'Bachelor';

  // GPA — match "GPA 3.5", "điểm 3.5", "3.5 GPA"
  const gpaMatch = text.match(/(?:gpa|điểm)\s*[:\s]?\s*([0-3]\.\d|4(?:\.0)?)/i)
    || text.match(/([0-3]\.\d|4(?:\.0)?)\s*(?:gpa|\/4)/i);
  if (gpaMatch) {
    const gpa = parseFloat(gpaMatch[1]);
    if (gpa > 0 && gpa <= 4) filters.min_gpa = gpa;
  }

  // IELTS — match "IELTS 7.0", "7.0 IELTS", "band 7"
  const ieltsMatch = text.match(/ielts\s*[:\s]?\s*(\d(?:\.\d)?)/i)
    || text.match(/(\d(?:\.\d)?)\s*ielts/i)
    || text.match(/band\s*(\d(?:\.\d)?)/i);
  if (ieltsMatch) {
    const ielts = parseFloat(ieltsMatch[1]);
    if (ielts > 0 && ielts <= 9) filters.min_ielts = ielts;
  }

  return filters;
};

const mergeProfileFilters = (filters, profile) => {
  if (!profile) return filters;
  const merged = { ...filters };
  if (!merged.country && profile.target_country) merged.country = profile.target_country;
  if (!merged.degree && profile.target_degree && profile.target_degree !== 'Any') merged.degree = profile.target_degree;
  if (!merged.min_gpa && profile.gpa) merged.min_gpa = parseFloat(profile.gpa);
  if (!merged.min_ielts && profile.english_level) {
    const ielts = extractIeltsScore(profile.english_level);
    if (ielts) merged.min_ielts = ielts;
  }
  return merged;
};

const getProfileForChat = async (userId) => {
  if (!userId) return null;
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('profiles')
      .select('bio, gpa, english_level, target_country, target_major, target_degree, target_intake')
      .eq('user_id', userId)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
};

const formatProfileContext = (profile) => {
  if (!profile) return '';
  const parts = [
    profile.gpa && `GPA: ${profile.gpa}/4.0`,
    profile.english_level && `Tiếng Anh: ${profile.english_level}`,
    profile.target_degree && `Bậc học mục tiêu: ${profile.target_degree}`,
    profile.target_country && `Quốc gia mục tiêu: ${profile.target_country}`,
    profile.target_major && `Ngành mục tiêu: ${profile.target_major}`,
    profile.target_intake && `Kỳ nhập học: ${profile.target_intake}`,
    profile.bio && `Ghi chú mục tiêu: ${profile.bio.slice(0, 500)}`,
  ].filter(Boolean);
  return parts.join('\n');
};

const queryScholarships = async (filters) => {
  const sb = getSupabase();
  const cols = 'title, provider, country, degree, amount, currency, deadline, min_gpa, min_ielts, field_of_study, coverage, application_url';

  let q = sb.from('scholarships').select(cols)
    .eq('is_active', true)
    .gte('deadline', new Date().toISOString());

  if (filters.country) q = q.ilike('country', `%${filters.country}%`);
  if (filters.degree)  q = q.or(`degree.eq.${filters.degree},degree.eq.Any`);
  if (filters.min_gpa) q = q.or(`min_gpa.is.null,min_gpa.lte.${filters.min_gpa}`);

  const { data } = await q.order('deadline', { ascending: true }).limit(8);
  return data || [];
};

const formatScholarships = (scholarships) => {
  if (!scholarships.length) return '\n\n[DB: Không tìm thấy học bổng phù hợp trong hệ thống. Không được bịa hoặc gợi ý học bổng ngoài danh sách này. Hãy thông báo cho user và đề nghị thay đổi tiêu chí tìm kiếm.]';
  const list = scholarships.map((s) => {
    const deadline = s.deadline ? new Date(s.deadline).toLocaleDateString('vi-VN') : 'Chưa rõ';
    const conditions = [s.min_gpa && `GPA ≥ ${s.min_gpa}`, s.min_ielts && `IELTS ≥ ${s.min_ielts}`, s.field_of_study && `Ngành: ${s.field_of_study}`].filter(Boolean).join(' | ');
    return `• **${s.title}** (${s.provider}) — ${s.country} — Deadline: ${deadline}${conditions ? `\n  Điều kiện: ${conditions}` : ''}${s.amount ? `\n  Giá trị: ${s.amount.toLocaleString()} ${s.currency || ''}` : ''}`;
  }).join('\n\n');
  return `\n\n[DỮ LIỆU HỌC BỔNG THỰC TẾ TỪ HỆ THỐNG — chỉ gợi ý từ danh sách này]\n${list}\n[HẾT DỮ LIỆU]`;
};

const isScholarshipQuery = (messages) => {
  const lastFew = messages.slice(-4).map((m) => m.content).join(' ').toLowerCase();
  return lastFew.match(/học bổng|scholarship|gợi ý|tìm|recommend|apply|nộp đơn|ứng tuyển|du học/);
};

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const is429 = (e) => e.status === 429 || (e.message && e.message.includes('429'));

const buildGeminiSession = (genAI, modelName, history, systemInstruction) => {
  // Gemini requires history to start with 'user' role
  const firstUserIdx = history.findIndex((m) => m.role === 'user');
  const safeHistory = firstUserIdx > 0 ? history.slice(firstUserIdx) : history;
  const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
  return model.startChat({ history: safeHistory });
};

const buildOpenAIMessages = (messages, prompt, systemInstruction) => [
  { role: 'system', content: systemInstruction },
  ...messages.slice(-20, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  })),
  { role: 'user', content: prompt },
];

const callGroq = async (messages, prompt, systemInstruction) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: buildOpenAIMessages(messages, prompt, systemInstruction),
    max_tokens: 1024,
  });
  return res.choices[0].message.content;
};

const callZhipu = async (messages, prompt, systemInstruction) => {
  const client = new OpenAI({
    apiKey: process.env.ZHIPU_API_KEY,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  });
  const res = await client.chat.completions.create({
    model: 'glm-4-flash',
    messages: buildOpenAIMessages(messages, prompt, systemInstruction),
    max_tokens: 1024,
  });
  return res.choices[0].message.content;
};

const chat = async (messages, { userId } = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('Gemini API chưa được cấu hình'), { statusCode: 503, isOperational: true });

  const genAI = new GoogleGenerativeAI(apiKey);
  const profile = await getProfileForChat(userId);
  const profileContext = formatProfileContext(profile);
  const systemInstruction = buildSystemInstruction({ profileContext });

  // Inject scholarship context nếu cần (regex-based, no Gemini quota)
  let scholarshipContext = '';
  let scholarships = [];
  if (isScholarshipQuery(messages)) {
    const filters = mergeProfileFilters(extractFilters(messages), profile);
    scholarships = await queryScholarships(filters);
    scholarshipContext = formatScholarships(scholarships);
  }

  // Convert sang Gemini format — giới hạn 20 turns để tránh vượt token limit
  const history = messages.slice(-20, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const lastMsg = messages[messages.length - 1];
  const prompt = scholarshipContext
    ? `${lastMsg.content}${scholarshipContext}`
    : lastMsg.content;

  // 1. Try Gemini models in order
  for (const modelName of GEMINI_MODELS) {
    try {
      const session = buildGeminiSession(genAI, modelName, history, systemInstruction);
      const result = await session.sendMessage(prompt);
      return result.response.text();
    } catch (e) {
      if (is429(e)) { console.info(`[Chat] ${modelName} quota exceeded, trying next...`); continue; }
      throw e;
    }
  }

  // 2. Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      console.info('[Chat] All Gemini models quota exceeded, falling back to Groq...');
      return await callGroq(messages, prompt, systemInstruction);
    } catch (e) {
      if (!is429(e)) throw e;
      console.info('[Chat] Groq also quota exceeded.');
    }
  }

  // 3. Fallback to Zhipu GLM-4-Flash
  if (process.env.ZHIPU_API_KEY) {
    try {
      console.info('[Chat] Falling back to Zhipu GLM-4-Flash...');
      return await callZhipu(messages, prompt, systemInstruction);
    } catch (e) {
      if (!is429(e)) throw e;
      console.info('[Chat] Zhipu also quota exceeded.');
    }
  }

  // 4. Last resort — return raw DB results
  if (scholarships.length > 0) {
    return `Mình đang quá tải, nhưng đây là học bổng phù hợp tìm thấy trong hệ thống:\n\n${formatScholarshipsPlain(scholarships)}\n\nBạn hãy truy cập website chính thức để biết thêm chi tiết nhé!`;
  }
  const err = new Error('ScholarsBot đang bận, vui lòng thử lại sau vài giây nhé!');
  err.statusCode = 503;
  err.isOperational = true;
  throw err;
};

const formatScholarshipsPlain = (scholarships) => scholarships.map((s) => {
  const deadline = s.deadline ? new Date(s.deadline).toLocaleDateString('vi-VN') : 'Chưa rõ';
  const parts = [`• ${s.title} (${s.provider}) — ${s.country} — Deadline: ${deadline}`];
  if (s.min_gpa)    parts.push(`  GPA tối thiểu: ${s.min_gpa}`);
  if (s.min_ielts)  parts.push(`  IELTS tối thiểu: ${s.min_ielts}`);
  if (s.amount)     parts.push(`  Giá trị: ${s.amount.toLocaleString()} ${s.currency || ''}`);
  if (s.application_url) parts.push(`  Link: ${s.application_url}`);
  return parts.join('\n');
}).join('\n\n');

// ── Chat history persistence ───────────────────────────────────────────────────

const saveMessages = async (userId, userContent, assistantContent) => {
  if (!userId) return;
  try {
    const sb = getSupabase();
    await sb.from('chat_messages').insert([
      { user_id: userId, role: 'user',      content: userContent      },
      { user_id: userId, role: 'assistant', content: assistantContent },
    ]);
  } catch {
    // Bỏ qua lỗi persistence (table chưa tồn tại, quota exceeded...)
  }
};

const getHistory = async (userId, limit = 40) => {
  if (!userId) return [];
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    // Trả về theo thứ tự chronological (cũ → mới)
    return (data || []).reverse().map(({ role, content }) => ({ role, content }));
  } catch {
    return [];
  }
};

module.exports = { chat, saveMessages, getHistory };
