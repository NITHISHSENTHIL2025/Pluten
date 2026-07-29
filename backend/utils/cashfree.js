// backend/utils/cashfree.js
const { Cashfree } = require("cashfree-pg");
require("dotenv").config();

const appId = (process.env.CASHFREE_APP_ID || "").trim();
const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();

Cashfree.XClientId = appId;
Cashfree.XClientSecret = secretKey;
Cashfree.XEnvironment = process.env.CASHFREE_MODE === 'production' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

// THE FIX: Explicitly declare the API version to prevent Cashfree from rejecting the handshake
Cashfree.XApiVersion = "2023-08-01"; 

module.exports = { Cashfree };