'use strict';

const { extractFacts } = require('./heuristicExtractor');
const { createGeminiExtractor } = require('./geminiExtractor');
const { parseDeadline } = require('./dateParser');
const { findCountry, countryFromSlug } = require('./countries');

module.exports = { extractFacts, createGeminiExtractor, parseDeadline, findCountry, countryFromSlug };
