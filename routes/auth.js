const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    res.status(400).json({ error: '회원가입 실패' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    res.json({ message: '로그인 성공', user });
  } else {
    res.status(401).json({ error: '로그인 실패' });
  }
});

module.exports = router;
