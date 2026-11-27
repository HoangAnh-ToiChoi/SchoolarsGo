// CI: kiểm file đã đổi trong PR theo cùng luật với hook Stop, để code người viết tay cũng qua cổng này.
// Cách dùng (ở gốc repo, cần lịch sử git đủ để tìm merge-base): node .claude/hooks/ciConventions.mjs origin/dev
import { conventionProblems, missingTestProblems, readBackendTestSources, sourceFiles } from './lib/changeCheck.mjs';
import { git, readWorking, REPO_ROOT } from './lib/hookIo.mjs';

const baseRef = process.argv[2];
if (!baseRef) {
  console.error('Thiếu nhánh gốc, ví dụ: node .claude/hooks/ciConventions.mjs origin/dev');
  process.exit(2);
}

const mergeBase = git(['merge-base', baseRef, 'HEAD']);
if (!mergeBase) {
  console.error(`Không tìm được merge-base với ${baseRef} (checkout cần fetch-depth: 0).`);
  process.exit(2);
}

const changed = git(['diff', '--name-only', '--diff-filter=ACMR', mergeBase, 'HEAD']).split('\n').filter(Boolean);
const files = sourceFiles(changed);

const readBase = (relPath) => git(['show', `${mergeBase}:${relPath}`]);
const readers = { readBase, readHead: readWorking };
const testSources = readBackendTestSources(REPO_ROOT);
const problems = [...conventionProblems(files, readers), ...missingTestProblems(files, { ...readers, testSources })];

if (problems.length) {
  console.error(`Vi phạm quy ước CLAUDE.md so với ${baseRef}:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`Quy ước: ${files.length} file nguồn đã đổi so với ${baseRef}, không có vi phạm mới.`);
