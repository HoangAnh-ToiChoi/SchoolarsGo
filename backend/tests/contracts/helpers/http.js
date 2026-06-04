const express = require('express');
const cookieParser = require('cookie-parser');
const errorHandler = require('../../../src/middlewares/errorHandler');

const createJsonApp = (mount) => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  mount(app);
  app.use(errorHandler);
  return app;
};

const withServer = async (app, run) => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const { port } = server.address();
  try {
    return await run({ baseUrl: `http://127.0.0.1:${port}` });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

const requestJson = async (baseUrl, path, { method = 'GET', token, body } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    json: await response.json(),
  };
};

module.exports = {
  createJsonApp,
  withServer,
  requestJson,
};
