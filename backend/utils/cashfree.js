// backend/utils/cashfree.js
const { Cashfree } = require("cashfree-pg");
require("dotenv").config();

Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;

// THE FIX (Audit Issue #5): Dynamic Environment Switching
Cashfree.XEnvironment = process.env.NODE_ENV === 'production' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

module.exports = { Cashfree };