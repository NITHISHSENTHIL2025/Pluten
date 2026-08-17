const { Cashfree } = require('cashfree-pg');
require('dotenv').config();

const appId = String(process.env.CASHFREE_APP_ID || '').trim();
const secretKey = String(process.env.CASHFREE_SECRET_KEY || '').trim();
const apiVersion = String(process.env.CASHFREE_API_VERSION || '2025-01-01').trim();

if (!appId || !secretKey) {
  console.warn('[CASHFREE] Credentials are not configured at process startup.');
}

Cashfree.XClientId = appId;
Cashfree.XClientSecret = secretKey;
Cashfree.XEnvironment = process.env.CASHFREE_MODE === 'production'
  ? Cashfree.Environment.PRODUCTION
  : Cashfree.Environment.SANDBOX;
Cashfree.XApiVersion = apiVersion;

module.exports = { Cashfree, CASHFREE_API_VERSION: apiVersion };
