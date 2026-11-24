// PostToolUse (Write|Edit|MultiEdit): kiểm tra file vừa sửa theo CLAUDE.md.
// Vi phạm mới → trả về cho Claude sửa ngay. File legacy đã vượt ngưỡng → chỉ nhắc tách.
import { checkFile, formatFindings, newFindings } from './lib/conventions.mjs';
import { emit, readAtHead, readHookInput, readWorking, toRelPath } from './lib/hookIo.mjs';

const input = readHookInput();
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const relPath = toRelPath(filePath);
const content = readWorking(relPath);
if (content === null) process.exit(0);

const after = checkFile(relPath, content);
if (after.length === 0) process.exit(0);

const added = newFindings(checkFile(relPath, readAtHead(relPath)), after);

if (added.length > 0) {
  emit({
    decision: 'block',
    reason: `Vi phạm quy ước CLAUDE.md trong lần sửa này, sửa lại trước khi làm tiếp:\n${formatFindings(relPath, added)}`,
  });
  process.exit(0);
}

const legacyOverLimit = after.find((f) => f.rule === 'line-limit');
if (legacyOverLimit) {
  emit({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `${relPath} là file legacy đang vượt ngưỡng dòng (${legacyOverLimit.text}). CLAUDE.md: tách khi sửa tới, đừng làm file dài thêm.`,
    },
  });
}
