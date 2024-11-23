// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const generateOtp = require('./utils/generateOtp');
const sendOtp = require('./utils/sendOtp');
const Otp = require('./models/OTP');
const dotenv = require('dotenv');
const connectDB = require('./utils/connectDB');

dotenv.config();  // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 8081;

// Middleware
app.use(bodyParser.json());

// Rate limiter: 5 requests per minute
const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 3,  // limit each IP to 5 requests per windowMs
  message: { success: false, message: "Too many requests, please try again after a minute" },
});

// Connect to MongoDB
connectDB();

// Route to generate and send OTP
app.post('/auth/phone/send-code', otpLimiter, async (req, res) => {
  const { phoneNumber } = req.body;

  // Validate phone number (basic check for 10 digit numbers)
  if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  try {
    // Save OTP to database
    const otpEntry = new Otp({ phoneNumber, otp, expiresAt });
    await otpEntry.save();

    // Send OTP via SMS
    await sendOtp(phoneNumber, otp);

    res.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
});

// Route to verify OTP
app.post('/auth/phone/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body;

  // Validate input
  if (!phoneNumber || !code) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
  }

  try {
    // Find the OTP entry for the given phone number
    const otpEntry = await Otp.findOne({ phoneNumber });

    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP not found for this phone number' });
    }

    // Check if OTP is expired
    if (new Date() > otpEntry.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Check if OTP is correct
    if (otpEntry.otp !== code) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP is valid and not expired
    await Otp.deleteOne({ phoneNumber }); // Delete OTP after successful verification

    res.json({ success: true, message: 'Phone number verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
