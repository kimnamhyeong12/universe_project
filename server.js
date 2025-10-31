// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const planetRoutes = require('./routes/planet');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/planets', planetRoutes);

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
})
.catch(err => console.error('❌ MongoDB 연결 실패:', err));
