// Stop: trước khi Claude báo xong, quét mọi file đã đổi so với HEAD theo checklist CLAUDE.md.
// Chỉ chặn một lần (stop_hook_active) để không lặp vô hạn khi còn việc phải hỏi người dùng.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { checkFile, formatFindings, newFindings } from './lib/conventions.mjs';
import { changedFiles, readAtHead, readHookInput, readWorking, REPO_ROOT, emit } from './lib/hookIo.mjs';

const input = readHookInput();
if (input.stop_hook_active) process.exit(0);

const files = changedFiles().filter((f) => /^(backend|frontend)\/src\//.test(f));
if (files.length === 0) process.exit(0);

const problems = [];

for (const relPath of files) {
  const content = readWorking(relPath);
  if (content === null) continue;
  const added = newFindings(checkFile(relPath, readAtHead(relPath)), checkFile(relPath, content));
  if (added.length) problems.push(formatFindings(relPath, added));
}

// Service mới phải có test trong backend/tests/
const testSources = listTests().map((f) => readFileSync(f, 'utf8')).join('\n');
for (const relPath of files) {
  const m = relPath.match(/^backend\/src\/services\/(.+)\.js$/);
  if (!m || readAtHead(relPath) !== '' || readWorking(relPath) === null) continue;
  if (!testSources.includes(`services/${m[1]}.js`)) {
    problems.push(`- ${relPath} [service-test] Service mới chưa có test trong backend/tests/contracts/ (đúng, đầu vào sai, không tìm thấy).`);
  }
}

// R9 (frontendRules): hàm thuần mới trong helpers/ của trang phải có file test cạnh nó
for (const relPath of files) {
  const m = relPath.match(/^(frontend\/src\/.+\/helpers\/)(?!index\.js$)([^/]+?)(?<!\.test)\.js$/);
  if (!m || readAtHead(relPath) !== '' || readWorking(relPath) === null) continue;
  if (readWorking(`${m[1]}${m[2]}.test.js`) === null) {
    problems.push(`- ${relPath} [helper-test] R9: hàm thuần mới chưa có ${m[2]}.test.js cạnh nó.`);
  }
}

if (problems.length) {
  emit({
    decision: 'block',
    reason: `Checklist CLAUDE.md chưa qua với các file đã đổi:\n${problems.join('\n')}\nSửa xong rồi mới báo hoàn thành (hoặc giải thích cho người dùng vì sao giữ lại).`,
  });
}

function listTests() {
  const dir = path.join(REPO_ROOT, 'backend/tests');
  try {
    return readdirSync(dir, { recursive: true })
      .filter((f) => f.endsWith('.test.js'))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}
