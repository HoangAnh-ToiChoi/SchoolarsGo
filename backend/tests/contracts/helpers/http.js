import express from 'express';
import responseController from '~/controllers/response.controller.js';
import errorHandleController from '~/controllers/errorHandle.controller.js';

const createJsonApp = (mount) => {
  const app = express();
  app.use(responseController.attach);
  app.use(express.json());
  mount(app);
  app.use(errorHandleController.handle);
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

export { createJsonApp, withServer, requestJson };