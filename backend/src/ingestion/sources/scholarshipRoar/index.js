'use strict';

const { createWordPressSource } = require('../../shared/createWordPressSource');
const config = require('./config');
const mapper = require('./mapper');

module.exports = createWordPressSource({ config, mapper });
