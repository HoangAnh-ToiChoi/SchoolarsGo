import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isChunkLoadError } from './isChunkLoadError.js';

describe('isChunkLoadError', () => {
  it('nhận lỗi tải module động của Chrome, Safari, Firefox', () => {
    assert.equal(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js')), true);
    assert.equal(isChunkLoadError(new TypeError('Importing a module script failed.')), true);
    assert.equal(isChunkLoadError(new TypeError('error loading dynamically imported module')), true);
  });

  it('nhận lỗi có name ChunkLoadError', () => {
    const error = new Error('Loading chunk 3 failed');
    error.name = 'ChunkLoadError';
    assert.equal(isChunkLoadError(error), true);
  });

  it('lỗi render thường và giá trị rỗng không phải lỗi chunk', () => {
    assert.equal(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'title')")), false);
    assert.equal(isChunkLoadError(null), false);
    assert.equal(isChunkLoadError(undefined), false);
    assert.equal(isChunkLoadError('chuỗi'), false);
  });
});
