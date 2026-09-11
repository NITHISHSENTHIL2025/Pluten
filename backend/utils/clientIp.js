module.exports = function getClientIp(req) {
  // Express resolves trusted proxy chains into req.ip when `trust proxy` is configured.
  const value = String(req.ip || req.socket?.remoteAddress || '').trim();
  return value ? value.slice(0, 120) : 'unknown';
};
