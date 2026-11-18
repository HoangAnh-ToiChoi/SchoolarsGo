const fs = require('fs');
const path = require('path');
const { Router } = require('express');

const router = fs.readdirSync(__dirname)
  .filter((fileName) => fileName.endsWith('.routes.js'))
  .sort()
  .reduce((routes, fileName) => {
    const routeName = fileName.replace(/\.routes\.js$/, '');
    routes.use(`/${routeName}`, require(path.join(__dirname, fileName)));
    return routes;
  }, Router());

module.exports = router;
