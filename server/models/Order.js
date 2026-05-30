const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, title: String, price: Number, quantity: Number }],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending' }
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
