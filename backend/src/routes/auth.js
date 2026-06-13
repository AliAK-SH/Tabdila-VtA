const pool = require('../config/db');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const otpStore = new Map();

/*
Send OTP
POST /auth/send-otp
*/
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(phone, otp);

  if (process.env.MOCK_OTP === "true") {
    console.log(`MOCK OTP for ${phone}: ${otp}`);
  } else {
    // Here is where Kavenegar SMS will be integrated later
  }

  res.json({ success: true, message: "OTP sent" });
});


/*
Verify OTP
POST /auth/verify-otp
*/
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  const storedOtp = otpStore.get(phone);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ error: "Invalid OTP" });
  }

  otpStore.delete(phone);

  try {
    // Check if user exists
    let userResult = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create new user
      const newUser = await pool.query(
        'INSERT INTO users (phone) VALUES ($1) RETURNING *',
        [phone]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        is_subscribed: user.is_subscribed
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
