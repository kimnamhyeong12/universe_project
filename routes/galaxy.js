const express = require('express');
const router = express.Router();
const Galaxy = require('../models/Galaxy');

// 모든 은하 조회
router.get('/', async (req, res) => {
  try {
    const galaxies = await Galaxy.find().populate('owner', 'username');
    res.json(galaxies);
  } catch (err) {
    res.status(500).json({ error: '은하 조회 실패' });
  }
});

// 은하 등록
router.post('/create', async (req, res) => {
  try {
    const { name, description, size, numberOfStars, discoveredBy, discoveredAt, owner } = req.body;
    const galaxy = new Galaxy({ name, description, size, numberOfStars, discoveredBy, discoveredAt, owner, isForSale: true });
    await galaxy.save();
    res.status(201).json({ message: '🌌 은하 등록 완료' });
  } catch (err) {
    res.status(500).json({ error: '은하 등록 실패' });
  }
});

module.exports = router;
