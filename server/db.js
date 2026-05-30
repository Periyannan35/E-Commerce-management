const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dataFile = process.env.VERCEL
  ? path.join(os.tmpdir(), 'ecommerce-data.json')
  : path.join(__dirname, 'data.json');

const defaultData = {
  users: [
    {
      _id: crypto.randomUUID(),
      name: 'Admin',
      email: 'admin@admin.com',
      password: bcrypt.hashSync('123456', 10),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  products: [
    {
      _id: crypto.randomUUID(),
      title: 'Basic Tee',
      description: 'A comfortable cotton shirt for everyday wear.',
      price: 19.99,
      image: '',
      createdAt: new Date().toISOString()
    },
    {
      _id: crypto.randomUUID(),
      title: 'Casual Sneakers',
      description: 'Lightweight shoes for walking and weekend outings.',
      price: 49.99,
      image: '',
      createdAt: new Date().toISOString()
    },
    {
      _id: crypto.randomUUID(),
      title: 'Coffee Mug',
      description: 'Modern ceramic mug for a clean desk setup.',
      price: 12.99,
      image: '',
      createdAt: new Date().toISOString()
    }
  ],
  orders: []
};

const readData = () => {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
    return JSON.parse(JSON.stringify(defaultData));
  }
};

const writeData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

const ensureData = () => {
  if (!fs.existsSync(dataFile)) {
    writeData(defaultData);
  }
};

const generateId = () => crypto.randomUUID();

const getUsers = () => readData().users;
const findUserByEmail = (email) => getUsers().find((user) => user.email === email.toLowerCase());
const findUserById = (id) => getUsers().find((user) => user._id === id);
const createUser = ({ name, email, password, role }) => {
  const data = readData();
  const user = {
    _id: generateId(),
    name,
    email: email.toLowerCase(),
    password,
    role,
    createdAt: new Date().toISOString()
  };
  data.users.push(user);
  writeData(data);
  return user;
};

const getProducts = () => readData().products.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const createProduct = ({ title, description, price, image }) => {
  const data = readData();
  const product = {
    _id: generateId(),
    title,
    description: description || '',
    price: Number(price) || 0,
    image: image || '',
    createdAt: new Date().toISOString()
  };
  data.products.push(product);
  writeData(data);
  return product;
};
const updateProduct = (id, updates) => {
  const data = readData();
  const index = data.products.findIndex((product) => product._id === id);
  if (index === -1) return null;
  data.products[index] = { ...data.products[index], ...updates };
  writeData(data);
  return data.products[index];
};
const deleteProduct = (id) => {
  const data = readData();
  data.products = data.products.filter((product) => product._id !== id);
  writeData(data);
};

const getOrdersByUser = (userId) => readData().orders.slice().filter((order) => order.user === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const createOrder = ({ user, products, total }) => {
  const data = readData();
  const order = {
    _id: generateId(),
    user,
    products,
    total: Number(total) || 0,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  data.orders.push(order);
  writeData(data);
  return order;
};

module.exports = {
  ensureData,
  findUserByEmail,
  findUserById,
  createUser,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrdersByUser,
  createOrder
};
