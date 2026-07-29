// backend/utils/cashfree.js
const { Cashfree } = require("cashfree-pg");
require("dotenv").config();

Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;

// THE FIX: Use a dedicated environment variable for Cashfree, defaulting to SANDBOX for safety.
// Add CASHFREE_MODE=production in Render Environment Variables ONLY when you are ready for real money.
Cashfree.XEnvironment = process.env.CASHFREE_MODE === 'production' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

module.exports = { Cashfree };