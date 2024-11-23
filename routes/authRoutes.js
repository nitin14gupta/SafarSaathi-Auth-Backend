//   routes/authRoutes.js
const express = require('express');
const router = express.Router();
const OTP = require('../models/OTP');
const { sendSMS } = require('../utils/sms');
const crypto = require('crypto');

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString();
};

// Send OTP Route
router.post('/phone/send-code', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  const otp = generateOTP();

  try {
    await OTP.create({ phoneNumber, otp });
    await sendSMS(phoneNumber, `Your verification code is ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP Route
router.post('/phone/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
  }

  try {
    const otpRecord = await OTP.findOne({ phoneNumber, otp: code });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await OTP.deleteOne({ _id: otpRecord._id }); // Delete OTP after verification
    res.json({ success: true, message: 'Phone number verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

module.exports = router;

// is a file responsible for handling all the authentication routes like sending OTP and verifying OTP.