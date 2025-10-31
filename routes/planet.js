const express = require('express');
const router = express.Router();
const Planet = require('../models/Planet');

// 모든 행성 조회
router.get('/', async (req, res) => {
  const planets = await Planet.find().populate('owner', 'username');
  res.json(planets);
});

// 행성 등록
router.post('/create', async (req, res) => {
  const { name, description, imageUrl, price, owner } = req.body;
  const planet = new Planet({ name, description, imageUrl, price, isForSale: true, owner });
  await planet.save();
  res.status(201).json({ message: '행성 등록 완료' });
});

module.exports = router;
