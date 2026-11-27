import test from 'node:test';
import assert from 'node:assert/strict';

import { checkFile, newFindings } from '../lib/conventions.mjs';
import { checkGitCommand } from '../lib/gitPolicy.mjs';
import { fileDecision } from '../lib/filePolicy.mjs';
import { conventionProblems, missingTestProblems, sourceFiles } from '../lib/changeCheck.mjs';

const rules = (path, content) => checkFile(path, content).map((f) => f.rule);

test('BE: bắt select(*), require, ../, async arrow, console.log', () => {
  const src = [
    "import x from '../utils/a.js';",
    "const a = require('fs');",
    "const run = async (id) => id;",
    "console.log('x');",
    "db.from('t').select('*');",
  ].join('\n');
  const found = rules('backend/src/models/x.model.js', src);
  for (const r of ['parent-import', 'commonjs', 'async-arrow', 'console-log', 'select-star']) assert.ok(found.includes(r), r);
});

test('BE: controller không try và không res.json; service không gọi getSupabase', () => {
  assert.deepEqual(rules('backend/src/controllers/a.controller.js', 'try {\n} catch {}\nres.status(200).json({});'), [
    'controller-try',
    'controller-raw-json',
  ]);
  assert.deepEqual(rules('backend/src/services/a.service.js', 'const { data } = await getSupabase().from("x");'), ['service-db-client']);
  assert.deepEqual(rules('backend/src/controllers/response.controller.js', 'res.status(200).json({});'), []);
});

test('BE: export bản dùng chung qua biến và constructor nhận phụ thuộc bị bắt', () => {
  const src = 'class A {\n  constructor(model) {}\n}\nconst a = new A();\nexport default a;';
  assert.deepEqual(rules('backend/src/services/a.service.js', src), ['export-instance', 'constructor-deps']);
  assert.deepEqual(rules('backend/src/services/a.service.js', 'class A {}\nexport default new A();'), []);
});

test('Ngưỡng dòng theo loại file', () => {
  const lines = (n) => Array.from({ length: n }, () => 'x;').join('\n');
  assert.deepEqual(rules('backend/src/controllers/a.controller.js', lines(101)), ['line-limit']);
  assert.deepEqual(rules('backend/src/controllers/a.controller.js', lines(100)), []);
  assert.deepEqual(rules('frontend/src/hooks/useA.js', lines(151)), ['line-limit']);
});

test('FE: màu cứng, palette Tailwind, axios trong component, link tab mới thiếu rel', () => {
  const src = [
    "import axios from 'axios';",
    'const c = "#FF0000";',
    '<p className="text-blue-500 text-fg" />',
    '<a href={u} target="_blank">x</a>',
    'export default function A() {}',
  ].join('\n');
  const found = rules('frontend/src/components/a/index.jsx', src);
  for (const r of ['axios-outside-services', 'hex-color', 'tailwind-palette', 'blank-without-rel']) assert.ok(found.includes(r), r);
  assert.deepEqual(rules('frontend/src/components/a/index.jsx', '<a target="_blank" rel="noopener noreferrer">x</a>'), []);
});

test('FE: token dự án (neutral, brand) không bị bắt; components/ui được miễn', () => {
  assert.deepEqual(rules('frontend/src/components/a/index.jsx', '<p className="text-neutral-900 bg-brand-600" />'), []);
  assert.deepEqual(rules('frontend/src/components/ui/button.jsx', '<p className="text-blue-500" />'), []);
});

test('FE: component phải export default function, trang không import service', () => {
  assert.deepEqual(rules('frontend/src/pages/a/index.jsx', 'const A = () => null;\nexport default A;'), ['component-export']);
  assert.ok(rules('frontend/src/pages/a/index.jsx', "import s from '~/services/a.service';\nexport default function A() {}").includes('page-imports-service'));
});

test('FE: dangerouslySetInnerHTML phải qua sanitizeHtml', () => {
  assert.deepEqual(rules('frontend/src/components/a/index.jsx', 'export default function A() { return <p dangerouslySetInnerHTML={{ __html: h }} />; }'), ['xss-inner-html']);
  assert.deepEqual(rules('frontend/src/components/a/index.jsx', 'export default function A() { return <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(h) }} />; }'), []);
});

test('newFindings chỉ giữ vi phạm do lần sửa thêm vào', () => {
  const before = checkFile('backend/src/models/a.model.js', "x.select('*');");
  const after = checkFile('backend/src/models/a.model.js', "x.select('*');\ny.select('*', { count: 1 });");
  assert.equal(newFindings(before, after).length, 1);
  assert.equal(newFindings(after, after).length, 0);
});

test('git: chặn commit trên main/dev, --no-verify, push main, force-push dev, add .env', () => {
  assert.match(checkGitCommand('git commit -m "x"', 'dev'), /dev/);
  assert.match(checkGitCommand('git commit -m "x"', 'main'), /main/);
  assert.match(checkGitCommand('git checkout dev && git commit -m x', 'feat/a'), /dev/);
  assert.match(checkGitCommand('git commit --no-verify -m x', 'feat/a'), /no-verify/);
  assert.match(checkGitCommand('git push origin main', 'feat/a'), /main/);
  assert.match(checkGitCommand('git push -f origin dev', 'feat/a'), /force/);
  assert.match(checkGitCommand('git add backend/.env', 'feat/a'), /\.env/);
  assert.match(checkGitCommand('git merge feat/a', 'dev'), /--no-ff/);
});

test('git: cho phép quy trình chuẩn', () => {
  assert.equal(checkGitCommand('git commit -m "feat: x"', 'feat/a'), null);
  assert.equal(checkGitCommand('git push -u origin feat/a', 'feat/a'), null);
  assert.equal(checkGitCommand('git checkout dev && git merge --no-ff feat/a && git push origin dev', 'feat/a'), null);
  assert.equal(checkGitCommand('git add backend/.env.example', 'feat/a'), null);
});

test('file: chặn .env và vendor/, hỏi khi sửa cấu hình lint và migration đã commit', () => {
  assert.equal(fileDecision('backend/.env', { existsAtHead: false }).action, 'deny');
  assert.equal(fileDecision('backend/.env.example', { existsAtHead: true }), null);
  assert.equal(fileDecision('vendor/ecc/README.md', { existsAtHead: true }).action, 'deny');
  assert.equal(fileDecision('backend/.eslintrc.cjs', { existsAtHead: true }).action, 'ask');
  assert.equal(fileDecision('backend/scripts/migrations/006_userSessions.sql', { existsAtHead: true }).action, 'ask');
  assert.equal(fileDecision('backend/scripts/migrations/009_new.sql', { existsAtHead: false }), null);
  assert.equal(fileDecision('backend/src/app.js', { existsAtHead: true }), null);
});

test('BE: AppError kiểu cũ và process.env trong service bị bắt', () => {
  assert.deepEqual(rules('backend/src/services/a.service.js', "throw AppError.notFound('x', 'X');"), ['app-error-legacy']);
  assert.deepEqual(rules('backend/src/services/a.service.js', "throw new AppError('Sai', 400);"), ['app-error-legacy']);
  assert.deepEqual(rules('backend/src/services/a.service.js', 'throw new AppError(saved.ALREADY_SAVED);'), []);
  assert.deepEqual(rules('backend/src/services/a.service.js', 'const k = process.env.GEMINI_API_KEY;'), ['process-env']);
  assert.deepEqual(rules('backend/src/configs/gemini.config.js', 'const k = process.env.GEMINI_API_KEY;'), []);
});

test('FE: [Npx], route gõ tay, try/catch rỗng, file lẻ cạnh index.jsx', () => {
  assert.deepEqual(rules('frontend/src/pages/a/components/b/index.jsx', 'export default function B() { return <p className="pt-[22px]" />; }'), ['arbitrary-px']);
  assert.deepEqual(rules('frontend/src/pages/a/index.jsx', "export default function A() { navigate('/applications'); }"), ['hardcoded-route']);
  assert.deepEqual(rules('frontend/src/pages/a/index.jsx', 'export default function A() { try { x(); } catch {} }'), ['empty-catch']);
  assert.deepEqual(rules('frontend/src/pages/a/helper.js', 'export const x = 1;'), ['loose-page-file']);
  assert.deepEqual(rules('frontend/src/pages/a/useThing.js', 'export function useThing() {}'), ['loose-page-file']);
  assert.deepEqual(rules('frontend/src/pages/a/hooks/useThing.js', 'export function useThing() {}'), []);
});

test('FE: helpers của trang được import ../constants; comment và forwardRef không bị bắt nhầm', () => {
  assert.deepEqual(rules('frontend/src/pages/a/helpers/getX.js', "import { A } from '../constants';"), []);
  assert.deepEqual(rules('frontend/src/pages/a/helpers/getX.js', "import { A } from '../../b/constants';"), ['parent-import']);
  assert.deepEqual(rules('frontend/src/components/common/x/index.jsx', [
    '/** Luôn có target="_blank" */',
    'const X = forwardRef(function X(p, ref) { return <a ref={ref} target="_blank" rel="noopener noreferrer" />; });',
    'export default X;',
  ].join('\n')), []);
});

// Bộ đọc giả: base = bản gốc, head = bản hiện tại (null = đã xóa)
function readersOf(base, head) {
  return { readBase: (p) => base[p] ?? '', readHead: (p) => (p in head ? head[p] : null) };
}

test('changeCheck: chỉ lấy file nguồn, chỉ báo vi phạm mới, bỏ file đã xóa', () => {
  assert.deepEqual(sourceFiles(['backend/src/a.js', 'docs/x.md', 'frontend/src/b.jsx', '.github/ci.yml']), ['backend/src/a.js', 'frontend/src/b.jsx']);
  const legacy = "console.log('cũ');";
  const readers = readersOf(
    { 'backend/src/models/a.model.js': legacy },
    { 'backend/src/models/a.model.js': `${legacy}\nconsole.log('mới');` },
  );
  const problems = conventionProblems(['backend/src/models/a.model.js', 'backend/src/models/gone.model.js'], readers);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /a\.model\.js:2 \[console-log\]/);
});

test('changeCheck: service mới và helper mới phải có test; file cũ thì không bắt', () => {
  const head = {
    'backend/src/services/new.service.js': 'class A {}',
    'backend/src/services/tested.service.js': 'class B {}',
    'backend/src/services/old.service.js': 'class C {}',
    'frontend/src/pages/x/helpers/toGpa4.js': 'export default 1;',
    'frontend/src/pages/x/helpers/ok.js': 'export default 1;',
    'frontend/src/pages/x/helpers/ok.test.js': 'test',
  };
  const readers = readersOf({ 'backend/src/services/old.service.js': 'class C {}' }, head);
  const rulesFound = missingTestProblems(Object.keys(head), { ...readers, testSources: "import('~/services/tested.service.js')" })
    .map((p) => p.match(/^- (\S+) \[([\w-]+)\]/).slice(1).join(' '));
  assert.deepEqual(rulesFound, ['backend/src/services/new.service.js service-test', 'frontend/src/pages/x/helpers/toGpa4.js helper-test']);
});
