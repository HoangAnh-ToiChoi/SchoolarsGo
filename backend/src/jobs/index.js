const fs = require('fs');
const path = require('path');

function startJobs() {
  fs.readdirSync(__dirname)
    .filter((fileName) => fileName.endsWith('.js') && fileName !== 'index.js')
    .sort()
    .forEach((fileName) => {
      const job = require(path.join(__dirname, fileName));

      Object.entries(job)
        .filter(([name, startJob]) => name.startsWith('start') && typeof startJob === 'function')
        .forEach(([, startJob]) => startJob());
    });
}

module.exports = { startJobs };
