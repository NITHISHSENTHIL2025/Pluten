// backend/utils/cashfree.js
const { Cashfree } = require("cashfree-pg");
require("dotenv").config();

const appId = (process.env.CASHFREE_APP_ID || "").trim();
const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();

// THE FIX: This will print the first 8 characters to your Render logs so we know it's loading!
console.log("//////////////////////////////////////");
console.log("[SECURITY CHECK] Loading Cashfree Keys...");
console.log(`App ID: ${appId ? appId.substring(0, 8) + "********" : "MISSING!"}`);
console.log(`Secret Key: ${secretKey ? "PRESENT (Hidden for security)" : "MISSING!"}`);
console.log(`Environment: ${process.env.CASHFREE_MODE === 'production' ? 'PRODUCTION' : 'SANDBOX'}`);
console.log("//////////////////////////////////////");

Cashfree.XClientId = appId;
Cashfree.XClientSecret = secretKey;
Cashfree.XEnvironment = process.env.CASHFREE_MODE === 'production' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

module.exports = { Cashfree };