const crypto = require('crypto');

module.exports = function requestId(req, res, next) {
  const incoming = String(req.get('x-request-id') || '').trim();
  const id = incoming && incoming.length <= 100 ? incoming : crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};
