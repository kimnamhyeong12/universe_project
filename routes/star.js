const express = require('express');
const router = express.Router();
const Star = require('../models/Star');

// 모든 별 조회
router.get('/', async (req, res) => {
  try {
    const stars = await Star.find().populate('owner', 'username').populate('galaxy', 'name');
    res.json(stars);
  } catch (err) {
    res.status(500).json({ error: '별 조회 실패' });
  }
});

// 별 등록
router.post('/create', async (req, res) => {
  try {
    const { name, type, mass, radius, temperature, galaxy, description, owner } = req.body;
    const star = new Star({ name, type, mass, radius, temperature, galaxy, description, owner, isForSale: true });
    await star.save();
    res.status(201).json({ message: '⭐ 별 등록 완료' });
  } catch (err) {
    res.status(500).json({ error: '별 등록 실패' });
  }
});

module.exports = router;
