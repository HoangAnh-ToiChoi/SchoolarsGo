// Stop: trước khi Claude báo xong, quét mọi file đã đổi so với HEAD theo checklist CLAUDE.md.
// Chỉ chặn một lần (stop_hook_active) để không lặp vô hạn khi còn việc phải hỏi người dùng.
import { conventionProblems, missingTestProblems, readBackendTestSources, sourceFiles } from './lib/changeCheck.mjs';
import { changedFiles, emit, readAtHead, readHookInput, readWorking, REPO_ROOT } from './lib/hookIo.mjs';

const input = readHookInput();
if (input.stop_hook_active) process.exit(0);

const files = sourceFiles(changedFiles());
if (files.length === 0) process.exit(0);

const readers = { readBase: readAtHead, readHead: readWorking };
const testSources = readBackendTestSources(REPO_ROOT);
const problems = [...conventionProblems(files, readers), ...missingTestProblems(files, { ...readers, testSources })];

if (problems.length) {
  emit({
    decision: 'block',
    reason: `Checklist CLAUDE.md chưa qua với các file đã đổi:\n${problems.join('\n')}\nSửa xong rồi mới báo hoàn thành (hoặc giải thích cho người dùng vì sao giữ lại).`,
  });
}
