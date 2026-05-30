const express = require('express');
const auth = require('../middleware/auth');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const products = getProducts();
  res.json(products);
});

router.post('/', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const product = createProduct(req.body);
  res.json(product);
});

router.put('/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const product = updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
});

router.delete('/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  deleteProduct(req.params.id);
  res.json({ success: true });
});

module.exports = router;
