// PreToolUse (Bash): chặn lệnh git trái quy trình CLAUDE.md.
import { checkGitCommand } from './lib/gitPolicy.mjs';
import { emit, git, readHookInput } from './lib/hookIo.mjs';

const command = readHookInput().tool_input?.command || '';
if (!/\bgit\b/.test(command)) process.exit(0);

const reason = checkGitCommand(command, git(['branch', '--show-current']));
if (reason) {
  emit({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `${reason} (quy trình trong CLAUDE.md, mục "Quy trình")`,
    },
  });
}
