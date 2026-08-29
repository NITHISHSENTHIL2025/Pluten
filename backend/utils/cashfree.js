const { Cashfree: CashfreeSDK } = require('cashfree-pg');
require('dotenv').config();

const appId = String(
  process.env.CASHFREE_APP_ID || '',
).trim();

const secretKey = String(
  process.env.CASHFREE_SECRET_KEY || '',
).trim();

const apiVersion = String(
  process.env.CASHFREE_API_VERSION || '2025-01-01',
).trim();

const isProduction =
  String(process.env.CASHFREE_MODE || '')
    .trim()
    .toLowerCase() === 'production';

if (!appId || !secretKey) {
  console.warn(
    '[CASHFREE] Credentials are not configured at process startup.',
  );
}

/*
 * cashfree-pg v6 uses an instance-based client.
 * The v5+ Node SDK documentation shows:
 *
 *   new Cashfree(Cashfree.SANDBOX, clientId, clientSecret)
 *
 * Do not use the pre-v5 static XClientId/XEnvironment API.
 */
const environment = isProduction
  ? CashfreeSDK.PRODUCTION
  : CashfreeSDK.SANDBOX;

const Cashfree = new CashfreeSDK(
  environment,
  appId,
  secretKey,
);
console.log('[CASHFREE CONFIG]', {
  mode: isProduction ? 'production' : 'sandbox',
  appIdPresent: Boolean(appId),
  secretPresent: Boolean(secretKey),
  appIdLength: appId.length,
  secretLength: secretKey.length,
  apiVersion,
});
module.exports = {
  Cashfree,
  CASHFREE_API_VERSION: apiVersion,
};