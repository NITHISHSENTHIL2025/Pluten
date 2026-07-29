// backend/utils/cashfree.js
const { Cashfree } = require("cashfree-pg");
require("dotenv").config();

// THE FIX: .trim() completely destroys any accidental invisible spaces copied from the dashboard
Cashfree.XClientId = (process.env.CASHFREE_APP_ID || "").trim();
Cashfree.XClientSecret = (process.env.CASHFREE_SECRET_KEY || "").trim();

Cashfree.XEnvironment = process.env.CASHFREE_MODE === 'production' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

module.exports = { Cashfree };