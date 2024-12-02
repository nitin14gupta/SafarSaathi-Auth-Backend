const Twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const sendOtp = (otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const phoneNumber = process.env.PHONE_NUMBER

  if (!accountSid || !authToken || !fromPhoneNumber) {
    throw new Error("Twilio credentials are missing");
  }

  const client = new Twilio(accountSid, authToken);

  client.messages
    .create({
      body: `Your OTP to login into the world of dilemma is : ${otp}`,
      from: fromPhoneNumber,
      to: phoneNumber
    })
    .then(message => console.log('OTP sent successfully:', message.sid))
    .catch(error => console.error('Error sending OTP:', error));
};

module.exports = sendOtp;
