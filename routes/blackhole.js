const express = require('express');
const router = express.Router();
const Blackhole = require('../models/Blackhole');

// 모든 블랙홀 조회
router.get('/', async (req, res) => {
  try {
    const blackholes = await Blackhole.find().populate('owner', 'username').populate('galaxy', 'name');
    res.json(blackholes);
  } catch (err) {
    res.status(500).json({ error: '블랙홀 조회 실패' });
  }
});

// 블랙홀 등록
router.post('/create', async (req, res) => {
  try {
    const { name, mass, radius, description, galaxy, owner } = req.body;
    const blackhole = new Blackhole({ name, mass, radius, description, galaxy, owner, isForSale: true });
    await blackhole.save();
    res.status(201).json({ message: '🌀 블랙홀 등록 완료' });
  } catch (err) {
    res.status(500).json({ error: '블랙홀 등록 실패' });
  }
});

module.exports = router;
