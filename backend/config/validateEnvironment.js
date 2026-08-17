const requiredInProduction = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'GOOGLE_CLIENT_ID',
  'CASHFREE_APP_ID',
  'CASHFREE_SECRET_KEY',
  'CASHFREE_MODE',
  'CASHFREE_API_VERSION',
  'CLOUD_REGION',
  'CLOUD_BUCKET_NAME',
  'CLOUD_ACCESS_KEY',
  'CLOUD_SECRET_KEY',
];

module.exports = function validateEnvironment() {
  const missing = requiredInProduction.filter((name) => !String(process.env[name] || '').trim());
  if (missing.length && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (missing.length) console.warn('[CONFIG] Missing optional development variables:', missing.join(', '));
  return { missing };
};
