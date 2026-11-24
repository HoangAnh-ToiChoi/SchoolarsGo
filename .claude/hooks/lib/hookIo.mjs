import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/** Đọc JSON mà Claude Code gửi vào stdin của hook. */
export function readHookInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

export function git(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

export function toRelPath(filePath) {
  return path.relative(REPO_ROOT, path.resolve(REPO_ROOT, filePath)).split(path.sep).join('/');
}

/** Nội dung file ở HEAD; file mới thì rỗng. */
export function readAtHead(relPath) {
  return git(['show', `HEAD:${relPath}`]);
}

export function readWorking(relPath) {
  try {
    return readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

/** File đã sửa so với HEAD + file mới chưa track. */
export function changedFiles() {
  const tracked = git(['diff', '--name-only', 'HEAD']).split('\n');
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n');
  return [...new Set([...tracked, ...untracked])].filter(Boolean);
}

export function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
}
