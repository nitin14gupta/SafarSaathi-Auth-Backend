const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const generateOtp = require('./utils/generateOtp');
const sendOtp = require('./utils/sendOtp');
const Otp = require('./models/otp');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const connectDB = require('./utils/connectDB');
const cors = require('cors');
const morgan = require('morgan');
const Joi = require('joi'); //input validation
const User = require('./models/user'); // Import the User model

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));

// route for the root path so no need to go to /api
app.get('/', (req, res) => {
  res.send('Welcome to the OTP Authentication Server!');
});

//5 requests per minute - that is the rate limit maine daala hai
const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: 'Too many requests, please try again after a minute' },
});

// Connect to MongoDB
connectDB();

app.post('/auth/phone/send-code', otpLimiter, async (req, res) => {
  const { phoneNumber } = req.body;

  // Validate input of phone number enter
  const schema = Joi.object({
    phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  });

  const { error } = schema.validate({ phoneNumber });
  if (error) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

  try {
    const existingOtp = await Otp.findOne({ phoneNumber });
    if (existingOtp) {
      await Otp.deleteOne({ phoneNumber });
    }

    // Save OTP to database
    const otpEntry = new Otp({ phoneNumber, otp, expiresAt });
    await otpEntry.save();

    // Send OTP via Twilio
    await sendOtp(otp);

    res.json({ success: true, message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send verification code', error: error.message });
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
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
