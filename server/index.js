const express = require('express');
const cors = require('cors');
const { ensureData } = require('./db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

ensureData();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

module.exports = app;
