// Luật quy ước của CLAUDE.md có thể kiểm tra bằng máy.
// Hàm thuần: nhận đường dẫn tương đối từ gốc repo + nội dung file, trả danh sách vi phạm.
// Luật cần đọc hiểu nghiệp vụ (auth đúng chỗ, lọc user_id, đủ 4 trạng thái UI…) để cho agent review.

const LINE_LIMITS = [
  { test: (p) => /^backend\/src\/controllers\/.+\.js$/.test(p), limit: 100, kind: 'controller' },
  { test: (p) => /^backend\/src\/services\/.+\.js$/.test(p), limit: 200, kind: 'service' },
  { test: (p) => /^backend\/src\/models\/.+\.js$/.test(p), limit: 250, kind: 'model' },
  { test: (p) => /^frontend\/src\/(hooks\/.+|.*\/use[A-Z]\w*)\.js$/.test(p), limit: 150, kind: 'hook' },
  { test: (p) => /^frontend\/src\/services\/.+\.js$/.test(p), limit: 200, kind: 'service FE' },
  { test: (p) => /^frontend\/src\/(components|pages|layouts)\/.+\.jsx$/.test(p), limit: 200, kind: 'component' },
];

const TAILWIND_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|via|to|outline|divide|placeholder|decoration|shadow|accent|caret)-(?:slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

const isBackendSrc = (p) => p.startsWith('backend/src/') && p.endsWith('.js');
const isFrontendSrc = (p) => p.startsWith('frontend/src/') && /\.(js|jsx)$/.test(p);
// shadcn và legacy giữ nguyên kiểu gốc; không bắt theo luật màu/kiểu export
const isFrontendOwned = (p) =>
  isFrontendSrc(p) && !p.startsWith('frontend/src/components/ui/') && !p.startsWith('frontend/src/components/legacy/');

const LINE_RULES = [
  {
    id: 'select-star',
    applies: isBackendSrc,
    re: /select\(\s*['"`]\*['"`]|SELECT\s+\*/,
    message: "Không SELECT * / select('*'): chọn cột cụ thể.",
  },
  {
    id: 'commonjs',
    applies: (p) => isBackendSrc(p) || isFrontendSrc(p),
    re: /\brequire\(|module\.exports/,
    message: 'Dự án là ESM: dùng import/export, không require/module.exports.',
  },
  {
    id: 'parent-import',
    applies: (p) => isBackendSrc(p) || isFrontendSrc(p),
    re: /(?:from\s+|import\(\s*)['"]\.\.\//,
    message: "Import nội bộ dùng '~/', không dùng '../'.",
  },
  {
    id: 'async-arrow',
    applies: (p) => isBackendSrc(p) || isFrontendSrc(p),
    re: /\basync\s+(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/,
    message: 'Hàm bất đồng bộ dùng `async function` (hoặc method `async ten() {}`), không async arrow.',
  },
  {
    id: 'console-log',
    applies: (p) => isBackendSrc(p) || isFrontendSrc(p),
    re: /\bconsole\.log\(/,
    message: 'Không để console.log.',
  },
  {
    id: 'controller-try',
    applies: (p) => /^backend\/src\/controllers\/(?!errorHandle|response).+\.js$/.test(p),
    re: /\btry\s*\{/,
    message: 'Controller không try/catch: Express 5 tự chuyển lỗi sang errorHandle.controller.',
  },
  {
    id: 'controller-raw-json',
    applies: (p) => /^backend\/src\/controllers\/(?!errorHandle|response).+\.js$/.test(p),
    re: /res\.status\([^)]*\)\.json\(|res\.json\(/,
    message: 'Trả response bằng res.success / res.created / res.error, không tự viết JSON.',
  },
  {
    id: 'service-db-client',
    applies: (p) => /^backend\/src\/services\/.+\.js$/.test(p),
    re: /getSupabase\(|from\s+['"]@supabase\/|from\s+['"]pg['"]|configs\/database/,
    message: 'Service không gọi DB client trực tiếp: đưa truy vấn vào models/.',
  },
  {
    id: 'hex-color',
    applies: (p) => isFrontendOwned(p),
    re: /['"`\s(:]#[0-9a-fA-F]{3,8}\b/,
    message: 'Component không viết mã màu: dùng token (brand-600, fg, line…) hoặc color() ở utils/palette.js.',
  },
  {
    id: 'tailwind-palette',
    applies: (p) => isFrontendOwned(p),
    re: TAILWIND_PALETTE,
    message: 'Không dùng màu Tailwind mặc định (text-blue-500…): dùng token của dự án.',
  },
  {
    id: 'axios-outside-services',
    applies: (p) => isFrontendSrc(p) && !/^frontend\/src\/(services|utils)\//.test(p),
    re: /from\s+['"]axios['"]|from\s+['"]~\/utils\/apiClient/,
    message: 'Gọi API qua services/ + hook TanStack Query, không gọi axios/apiClient trong component.',
  },
  {
    id: 'page-imports-service',
    applies: (p) => /^frontend\/src\/pages\/(?:[^/]+\/)*index\.jsx$/.test(p) && !p.includes('/components/'),
    re: /from\s+['"]~\/services\//,
    message: 'Trang chỉ ghép component, không gọi service: dùng hook trong hooks/.',
  },
];

function lineRuleFindings(relPath, lines) {
  const findings = [];
  for (const rule of LINE_RULES) {
    if (!rule.applies(relPath)) continue;
    lines.forEach((text, i) => {
      const code = text.replace(/\/\/.*$/, '');
      if (rule.re.test(code)) findings.push({ rule: rule.id, line: i + 1, text: text.trim(), message: rule.message });
    });
  }
  return findings;
}

function fileRuleFindings(relPath, content, lines) {
  const findings = [];

  const limit = LINE_LIMITS.find((l) => l.test(relPath));
  if (limit && lines.length > limit.limit) {
    findings.push({
      rule: 'line-limit',
      line: lines.length,
      text: `${limit.kind}:${limit.limit}`,
      message: `File ${limit.kind} có ${lines.length} dòng, vượt ngưỡng ${limit.limit}: tách trước khi thêm code.`,
    });
  }

  // Bản dùng chung phải export thẳng `export default new X();`
  if (/^backend\/src\/(models|services|controllers)\/.+\.js$/.test(relPath)) {
    const assigned = content.match(/const\s+(\w+)\s*=\s*new\s+\w+\([^)]*\);?[\s\S]*export\s+default\s+(\w+)\s*;/);
    if (assigned && assigned[1] === assigned[2]) {
      findings.push({
        rule: 'export-instance',
        line: lines.findIndex((t) => /export\s+default/.test(t)) + 1,
        text: assigned[0].split('\n').pop().trim(),
        message: 'Cuối file chỉ `export default new TenClass();`, không gán ra biến rồi mới export.',
      });
    }
    if (/constructor\s*\([^)]+\)/.test(content)) {
      findings.push({
        rule: 'constructor-deps',
        line: lines.findIndex((t) => /constructor\s*\(/.test(t)) + 1,
        text: 'constructor(...)',
        message: 'Constructor không nhận phụ thuộc: import model/service ở đầu file rồi gọi thẳng.',
      });
    }
  }

  if (isFrontendSrc(relPath) && content.includes('dangerouslySetInnerHTML') && !content.includes('sanitizeHtml(')) {
    findings.push({
      rule: 'xss-inner-html',
      line: lines.findIndex((t) => t.includes('dangerouslySetInnerHTML')) + 1,
      text: 'dangerouslySetInnerHTML',
      message: 'dangerouslySetInnerHTML bắt buộc đi qua sanitizeHtml().',
    });
  }

  if (isFrontendSrc(relPath)) {
    for (const m of content.matchAll(/target=["']_blank["']/g)) {
      const start = content.lastIndexOf('<', m.index);
      const end = content.indexOf('>', m.index);
      const tag = content.slice(start, end === -1 ? undefined : end);
      if (!/noopener/.test(tag)) {
        findings.push({
          rule: 'blank-without-rel',
          line: content.slice(0, m.index).split('\n').length,
          text: 'target="_blank"',
          message: 'Link tab mới phải có rel="noopener noreferrer".',
        });
      }
    }
  }

  if (isFrontendOwned(relPath) && /\/index\.jsx$/.test(relPath) && /export\s+default\s+(?!function\s+[A-Z])/.test(content)) {
    findings.push({
      rule: 'component-export',
      line: lines.findIndex((t) => /export\s+default/.test(t)) + 1,
      text: 'export default',
      message: 'Component viết `export default function TenComponent()`.',
    });
  }

  return findings;
}

/** Trả mọi vi phạm của một file. relPath tính từ gốc repo, dùng dấu '/'. */
export function checkFile(relPath, content) {
  const lines = content.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return [...lineRuleFindings(relPath, lines), ...fileRuleFindings(relPath, content, lines)];
}

/**
 * Chỉ giữ vi phạm mới so với bản cũ của file (cùng luật + cùng nội dung dòng).
 * Vì sao: file legacy đã có sẵn vi phạm, chỉ chặn cái do lần sửa này thêm vào.
 */
export function newFindings(before, after) {
  const remaining = new Map();
  for (const f of before) {
    const key = `${f.rule}|${f.text}`;
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  return after.filter((f) => {
    const key = `${f.rule}|${f.text}`;
    const count = remaining.get(key) || 0;
    if (count > 0) {
      remaining.set(key, count - 1);
      return false;
    }
    return true;
  });
}

export function formatFindings(relPath, findings) {
  return findings.map((f) => `- ${relPath}:${f.line} [${f.rule}] ${f.message}`).join('\n');
}
