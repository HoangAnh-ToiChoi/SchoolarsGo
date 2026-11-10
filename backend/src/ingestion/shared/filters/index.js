'use strict';

const { RULES, checkBeforeExtract, checkAfterExtract } = require('./hardRules');
const { score } = require('./scorer');

module.exports = { RULES, checkBeforeExtract, checkAfterExtract, score };
