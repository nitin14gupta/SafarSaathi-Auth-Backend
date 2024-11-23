// utils/generateOtp.js
const crypto = require('crypto');

const generateOtp = () => {
  // Generate a 4-digit OTP using crypto
  return crypto.randomInt(1000, 9999).toString();
};

module.exports = generateOtp;
