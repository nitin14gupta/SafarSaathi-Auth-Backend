// models/otp.js
const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) }, // OTP expiration after 10 minutes
});

module.exports = mongoose.model('OTP', OTPSchema);
