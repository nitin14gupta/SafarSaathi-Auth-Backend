// utils/generateOtp.js
const generateOtp = () => {
  const digits = '0123456789';
  let otp = '';

  while (otp.length < 6) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
};

const otp = generateOtp();
console.log('Generated OTP:', otp);

module.exports = generateOtp;
