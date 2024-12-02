//   routes/authRoutes.js
const express = require('express');
const router = express.Router();
const OTP = require('../models/otp');

const generateOtp = require('../utils/generateOtp');

app.post('/auth/phone/send-code', otpLimiter, async (req, res) => {
  const { phoneNumber } = req.body;

  const schema = Joi.object({
    phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  });

  const { error } = schema.validate({ phoneNumber });
  if (error) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  const otp = generateOtp(); // Generate a random 6-digit OTP
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

  try {
    const existingOtp = await Otp.findOne({ phoneNumber });
    if (existingOtp) {
      await Otp.deleteOne({ phoneNumber });
    }

    await new Otp({ phoneNumber, otp, expiresAt }).save();
    await sendOtp(phoneNumber, otp); // Send the generated OTP via SMS

    res.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send verification code', error: error.message });
  }
});



app.post('/auth/phone/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body;

  // Validate input
  if (!phoneNumber || !code) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
  }

  try {
    const otpEntry = await Otp.findOne({ phoneNumber });

    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP not found for this phone number' });
    }

    // Check if OTP has expired
    if (new Date() > otpEntry.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Check if OTP matches
    if (otpEntry.otp !== code) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP is valid, delete the OTP record from the database
    await Otp.deleteOne({ phoneNumber });

    // Check if the user already exists in the database
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      // If the user doesn't exist, create a new user
      user = new User({ phoneNumber });
      await user.save();
    }

    // Generate the JWT token
    const token = jwt.sign({ phoneNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      message: 'Phone number verified successfully and user saved to database',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
});

module.exports = router;

// is a file responsible for handling all the authentication routes like sending OTP and verifying OTP.