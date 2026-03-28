const success = (res, data = null, message = 'OK', meta = null) => {
  const response = { success: true };
  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (meta) response.meta = meta;
  return res.json(response);
};

const created = (res, data = null, message = 'Created') => {
  const response = { success: true };
  if (data !== null) response.data = data;
  if (message) response.message = message;
  return res.status(201).json(response);
};

const error = (res, message, code = 400, errors = []) => {
  const response = { success: false, message, code };
  if (errors.length > 0) response.errors = errors;
  return res.status(code).json(response);
};

module.exports = { success, created, error };
