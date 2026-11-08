'use strict';

const { toRow, cleanTitle } = require('./normalizer');
const { dedupKey } = require('./dedupKey');

module.exports = { toRow, cleanTitle, dedupKey };
