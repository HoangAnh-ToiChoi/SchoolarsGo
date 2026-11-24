// SessionStart: nạp bối cảnh ngắn về nhánh và môi trường để Claude theo đúng quy trình ngay từ đầu.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { git, REPO_ROOT } from './lib/hookIo.mjs';

const branch = git(['branch', '--show-current']) || '(detached)';
const hasDev = git(['rev-parse', '--verify', '--quiet', 'dev']) !== '' || git(['rev-parse', '--verify', '--quiet', 'origin/dev']) !== '';
const missingDeps = ['backend', 'frontend'].filter((d) => !existsSync(path.join(REPO_ROOT, d, 'node_modules')));
const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean).length;

const notes = [`Nhánh hiện tại: ${branch}${dirty ? ` (${dirty} file chưa commit)` : ''}.`];
if (['main', 'dev'].includes(branch)) {
  notes.push(`Đang ở "${branch}": trước khi sửa code phải tạo nhánh feat/… fix/… refactor/… docs/… từ dev.`);
}
if (!hasDev) notes.push('Chưa thấy nhánh dev ở local/origin: hỏi người dùng nhánh gốc trước khi tạo nhánh hoặc merge.');
if (missingDeps.length) notes.push(`Chưa cài node_modules ở: ${missingDeps.join(', ')} → chạy \`npm ci\` trước khi lint/build/test.`);
notes.push('Quy ước: CLAUDE.md. Lệnh harness: /verify, /review-diff, /new-endpoint, /new-page, /new-migration, /ship-dev (xem docs/harness.md).');

process.stdout.write(notes.join('\n'));
