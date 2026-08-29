const axios = require('axios');
require('dotenv').config();

const appId = String(process.env.CASHFREE_APP_ID || '').trim();
const secretKey = String(process.env.CASHFREE_SECRET_KEY || '').trim();
const apiVersion = String(
  process.env.CASHFREE_API_VERSION || '2025-01-01'
).trim();

const isProduction =
  String(process.env.CASHFREE_MODE || '').trim().toLowerCase() === 'production';

const baseURL = isProduction
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const createOrder = async (request) => {
  const response = await axios.post(
    `${baseURL}/orders`,
    request,
    {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      timeout: 15000,
    }
  );

  return response;
};

const fetchPayments = async (orderId) => {
  const response = await axios.get(
    `${baseURL}/orders/${encodeURIComponent(orderId)}/payments`,
    {
      headers: {
        accept: 'application/json',
        'x-api-version': apiVersion,
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      timeout: 15000,
    }
  );

  return response;
};

module.exports = {
  createOrder,
  fetchPayments,
  CASHFREE_API_VERSION: apiVersion,
};