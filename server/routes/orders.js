const express = require('express');
const auth = require('../middleware/auth');
const { getOrdersByUser, createOrder } = require('../db');
const router = express.Router();

router.post('/', auth, (req, res) => {
  const { products, total } = req.body;
  if (!products || !products.length) return res.status(400).json({ message: 'Cart empty' });
  const order = createOrder({ user: req.user._id, products, total });
  res.json(order);
});

router.get('/mine', auth, (req, res) => {
  const orders = getOrdersByUser(req.user._id);
  res.json(orders);
});

module.exports = router;
