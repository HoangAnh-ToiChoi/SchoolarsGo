// Luật git của dự án, tách khỏi hook để test được.
const PROTECTED = ['main', 'dev'];

// Tách lệnh ghép (&&, ||, ;, |) thành từng lệnh con để xét riêng
function splitCommands(command) {
  return command.split(/&&|\|\||;|\|/).map((c) => c.trim()).filter(Boolean);
}

function switchedTo(sub) {
  const m = sub.match(/^git\s+(?:checkout|switch)\s+(?:-[a-zA-Z]\s+)*([\w./-]+)\s*$/);
  return m ? m[1] : null;
}

/**
 * Trả lý do chặn (chuỗi) hoặc null nếu cho chạy.
 * branch = nhánh hiện tại trước khi chạy lệnh; lệnh checkout/switch trong chuỗi sẽ cập nhật nó.
 */
export function checkGitCommand(command, branch) {
  let current = branch;

  for (const sub of splitCommands(command)) {
    if (!/^git\b/.test(sub)) continue;

    const target = switchedTo(sub);
    if (target) {
      current = target;
      continue;
    }

    if (/--no-verify\b/.test(sub)) return 'Không bỏ qua hook bằng --no-verify: sửa lỗi mà hook báo.';

    if (/^git\s+add\b/.test(sub) && /(^|[\s/])\.env(?!\.example)(\.[\w]+)?(\s|$)/.test(sub)) {
      return 'Không commit .env / khóa API.';
    }

    if (/^git\s+commit\b/.test(sub) && PROTECTED.includes(current)) {
      return `Không commit thẳng trên "${current}": tạo nhánh feat/… fix/… từ dev, commit ở đó rồi merge --no-ff vào dev.`;
    }

    if (/^git\s+(merge|rebase|cherry-pick|revert)\b/.test(sub) && current === 'main') {
      return 'Không đổi "main" tại chỗ: đưa code vào main qua Pull Request.';
    }

    if (/^git\s+merge\b/.test(sub) && current === 'dev' && !/--no-ff\b/.test(sub) && !/--abort\b/.test(sub)) {
      return 'Merge vào dev phải dùng `git merge --no-ff <nhánh>`.';
    }

    if (/^git\s+push\b/.test(sub)) {
      const forced = /\s(-f|--force|--force-with-lease)(\s|=|$)|\s\+[\w/-]+/.test(sub);
      const args = sub.split(/\s+/).slice(2).filter((a) => !a.startsWith('-'));
      const refspecs = args.slice(1);
      const targets = refspecs.length ? refspecs.map((r) => r.replace(/^\+/, '').split(':').pop()) : [current];

      if (targets.includes('main')) return 'Không push thẳng lên main: mở Pull Request vào dev.';
      if (forced && targets.includes('dev')) return 'Cấm force-push dev.';
    }
  }

  return null;
}
