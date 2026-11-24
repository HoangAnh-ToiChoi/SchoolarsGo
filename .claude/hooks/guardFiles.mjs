// PreToolUse (Write|Edit|MultiEdit): bảo vệ file không được sửa tùy tiện.
import { fileDecision } from './lib/filePolicy.mjs';
import { emit, readAtHead, readHookInput, toRelPath } from './lib/hookIo.mjs';

const filePath = readHookInput().tool_input?.file_path;
if (!filePath) process.exit(0);

const relPath = toRelPath(filePath);
const decision = fileDecision(relPath, { existsAtHead: readAtHead(relPath) !== '' });
if (decision) {
  emit({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision.action,
      permissionDecisionReason: decision.reason,
    },
  });
}
