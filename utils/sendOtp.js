// utils/sendOtp.js
const axios = require('axios');

const sendOtp = async (phoneNumber, otp) => {
  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const url = `https://api.msg91.com/api/v5/otp?authkey=${apiKey}&template_id=${templateId}&mobile=${phoneNumber}&otp=${otp}`;

  try {
    const response = await axios.post(url);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

module.exports = sendOtp;
