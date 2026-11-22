import { DOC_TYPE_PATTERNS } from '../constants';

export function guessDocType(itemName) {
  return DOC_TYPE_PATTERNS.find(([, pattern]) => pattern.test(itemName))?.[0] ?? 'other';
}
