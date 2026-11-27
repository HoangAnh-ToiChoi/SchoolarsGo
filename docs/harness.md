# Harness Claude Code của ScholarsGo

Bộ hook + agent + skill trong `.claude/` giúp Claude Code (và người review) giữ đúng quy ước trong `CLAUDE.md`. **CLAUDE.md vẫn là nguồn luật duy nhất**: harness chỉ tự động kiểm những gì máy kiểm được và gom quy trình thành lệnh.

Chọn lọc từ [ECC](https://github.com/affaan-m/ECC) (submodule `vendor/ecc`, chỉ để tham khảo, không cài). Không dùng installer của ECC vì nó chép hàng trăm skill/agent không liên quan và hook cần cả thư viện `scripts/lib` của ECC; thay vào đó viết lại gọn, phụ thuộc duy nhất là Node.

## Hook (`.claude/settings.json` → `.claude/hooks/`)

| Sự kiện | Hook | Làm gì | Gốc ECC |
|---|---|---|---|
| SessionStart | `sessionContext.mjs` | Báo nhánh hiện tại, cảnh báo nếu đang ở main/dev, thiếu nhánh dev, thiếu `node_modules` | session-start (bỏ phần nhớ phiên) |
| PreToolUse Bash | `guardBash.mjs` | **Chặn** `--no-verify`, commit trên main/dev, merge vào dev thiếu `--no-ff`, sửa main tại chỗ, push main, force-push dev, `git add .env` | block-no-verify + luật git của dự án |
| PreToolUse Write/Edit | `guardFiles.mjs` | **Chặn** sửa `.env*`, `vendor/`; **hỏi** khi sửa cấu hình eslint/prettier hoặc migration đã commit | config-protection |
| PostToolUse Write/Edit | `checkConventions.mjs` | Kiểm file vừa sửa theo luật máy dò được; **chỉ báo vi phạm mới** (so với HEAD) để file legacy không bị nhắc mãi; file legacy vượt ngưỡng → nhắc tách | quality-gate, console-warn |
| Stop | `stopGate.mjs` | Quét mọi file đã đổi + "service mới phải có test"; còn lỗi → yêu cầu Claude sửa (chỉ chặn 1 lần) | stop-format-typecheck, check-console-log |

Luật nằm ở `.claude/hooks/lib/conventions.mjs` (quy ước code), `changeCheck.mjs` (kiểm một tập file đã đổi, dùng chung cho Stop và CI), `gitPolicy.mjs` (git), `filePolicy.mjs` (file được bảo vệ) — hàm thuần, có test:

```bash
node --test .claude/hooks/tests/*.test.mjs
```

Luật máy dò:

| Phía | Luật |
|---|---|
| BE | `select-star`, `commonjs`, `parent-import`, `async-arrow`, `console-log`, `controller-try`, `controller-raw-json`, `service-db-client`, `app-error-legacy` (phải `new AppError(nhom.MA)`), `process-env` (chỉ trong `configs/`), `export-instance`, `constructor-deps`, `line-limit` |
| FE | `hex-color`, `tailwind-palette`, `arbitrary-px` (R4), `hardcoded-route` (R6), `empty-catch` (R7), `loose-page-file` (R10), `axios-outside-services`, `page-imports-service`, `xss-inner-html`, `blank-without-rel`, `component-export`, `parent-import` (trong `hooks/ helpers/ constants/` của trang được `'../constants'`…), `line-limit` |
| Stop | `service-test` (service BE mới phải có test), `helper-test` (R9: hàm mới trong `helpers/` phải có `.test.js` cạnh nó) |

`components/ui/` (shadcn) và `components/legacy/` được miễn luật màu/kiểu export. Luật cần đọc hiểu (R1, R2, R3, R5, R8, R11, phân quyền, N+1…) để cho agent review.

Thêm luật: viết vào `LINE_RULES` hoặc `fileRuleFindings`, thêm test, chạy lại lệnh trên.

Tắt tạm cho một máy: thêm `"disableAllHooks": true` vào `.claude/settings.local.json` (không commit).

## CI (`.github/workflows/ci.yml`)

Hook chỉ chặn Claude; CI chặn mọi người. Chạy khi push vào `dev`/`main` và khi mở PR vào `dev`/`main` (kể cả PR từ fork).

| Job | Bước |
|---|---|
| Backend | `npm ci` · `lint` · `test:contract` · `test:ingestion` (Node 22: contract test cần `--experimental-test-module-mocks`) |
| Frontend | `npm ci` · `lint` · `npm test` (hàm thuần) · `build` |
| Integration | Supabase local (CLI 3.4.0) · `npm run migrate` hai lần (lần 2 không còn gì để áp) · `npm run test:integration`. Test `todo` = lỗi đã biết (mã R##), không làm job đỏ |
| Harness | `node --test .claude/hooks/tests/*.test.mjs` · **chỉ PR vào dev:** `node .claude/hooks/ciConventions.mjs origin/dev` — cùng luật với hook Stop, chỉ báo vi phạm mới so với merge-base, gồm `service-test` và `helper-test` |

Chạy thử bước quy ước trên máy: `node .claude/hooks/ciConventions.mjs upstream/dev` (tên remote theo máy mình). PR `dev → main` không chạy bước này vì mang theo lịch sử cũ đã được gác khi vào dev.

## Agent (`.claude/agents/`)

| Agent | Khi nào | Gốc ECC |
|---|---|---|
| `be-reviewer` | Sau khi sửa backend: tầng, phân quyền/`user_id`, query, lỗi, test | typescript-reviewer + database-reviewer |
| `fe-reviewer` | Sau khi sửa frontend: R1–R11 của `frontendRules.md`, cấu trúc, dữ liệu, 4 trạng thái, thiết kế, a11y | react-reviewer |
| `security-reviewer` | Đổi auth, route nhận dữ liệu, upload, chat AI, ingestion, cấu hình | security-reviewer |
| `be-test-writer` | Viết contract test `node:test` theo mẫu `mockService` | tdd-guide |

## Skill / lệnh (`.claude/skills/`)

| Lệnh | Làm gì |
|---|---|
| `/verify` | Lint + build + test theo phần đã đổi, đối chiếu checklist, báo PASS/FAIL |
| `/review-diff [base]` | Gọi song song be/fe/security-reviewer, gộp và xác minh phát hiện |
| `/new-endpoint` | Thêm API đúng luồng validation → test → model → service → controller → route |
| `/new-page` | Thêm trang FE đúng cấu trúc, đủ 4 trạng thái, đăng ký `PAGE_LOADERS` |
| `/new-migration` | Migration số tiếp theo, idempotent, có index |
| `/ship-dev` | Verify → push nhánh → PR (hoặc merge `--no-ff`) vào dev. Chỉ chạy khi người gõ |

Tên agent/skill dùng `kebab-case` vì Claude Code bắt buộc; file hook theo `camelCase` của dự án.

## Luồng làm việc gợi ý

```
nhánh feat/… từ dev
  → /new-endpoint hoặc /new-page (hoặc làm tay; hook kiểm từng lần sửa)
  → /verify
  → /review-diff dev
  → /ship-dev
```

## MCP (`.mcp.json`)

`context7` (tra tài liệu thư viện mới nhất) và `playwright` (chụp/kiểm giao diện ở nhiều độ rộng). Bật/tắt cho máy mình trong `.claude/settings.local.json` (`disabledMcpjsonServers`).
