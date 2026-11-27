// Kiểm một tập file đã đổi theo checklist CLAUDE.md. Dùng chung cho hook Stop (so với HEAD) và CI (so với nhánh gốc của PR).
// readBase(relPath) → nội dung bản gốc ('' nếu file mới); readHead(relPath) → nội dung hiện tại (null nếu đã xóa).
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { checkFile, formatFindings, newFindings } from './conventions.mjs';

const SOURCE_FILE = /^(backend|frontend)\/src\//;
const SERVICE_FILE = /^backend\/src\/services\/(.+)\.js$/;
const HELPER_FILE = /^(frontend\/src\/.+\/helpers\/)(?!index\.js$)([^/]+?)(?<!\.test)\.js$/;

export function sourceFiles(files) {
  return files.filter((f) => SOURCE_FILE.test(f));
}

/** Vi phạm quy ước mới so với bản gốc (file legacy không bị nhắc lại lỗi cũ). */
export function conventionProblems(files, { readBase, readHead }) {
  const problems = [];
  for (const relPath of files) {
    const content = readHead(relPath);
    if (content === null) continue;
    const before = checkFile(relPath, readBase(relPath));
    const added = newFindings(before, checkFile(relPath, content));
    if (added.length) problems.push(formatFindings(relPath, added));
  }
  return problems;
}

/** Service BE mới phải có test nhắc tới nó; hàm mới trong helpers/ FE phải có .test.js cạnh nó (R9). */
export function missingTestProblems(files, { readBase, readHead, testSources }) {
  const problems = [];
  for (const relPath of files) {
    const isNew = readBase(relPath) === '' && readHead(relPath) !== null;
    if (!isNew) continue;

    const service = relPath.match(SERVICE_FILE);
    if (service && !testSources.includes(`services/${service[1]}.js`)) {
      problems.push(`- ${relPath} [service-test] Service mới chưa có test trong backend/tests/contracts/ (đúng, đầu vào sai, không tìm thấy).`);
    }

    const helper = relPath.match(HELPER_FILE);
    if (helper && readHead(`${helper[1]}${helper[2]}.test.js`) === null) {
      problems.push(`- ${relPath} [helper-test] R9: hàm thuần mới chưa có ${helper[2]}.test.js cạnh nó.`);
    }
  }
  return problems;
}

/** Gộp nội dung mọi file test backend để tra service nào đã có test. */
export function readBackendTestSources(repoRoot) {
  const dir = path.join(repoRoot, 'backend/tests');
  try {
    return readdirSync(dir, { recursive: true })
      .filter((f) => f.endsWith('.test.js'))
      .map((f) => readFileSync(path.join(dir, f), 'utf8'))
      .join('\n');
  } catch {
    return '';
  }
}
