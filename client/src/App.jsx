import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
const getToken = () => localStorage.getItem('token');
const setAuth = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};
setAuth(getToken());
function AuthGuard({ children }) {
  const token = getToken();
  return token ? children : <Navigate to='/login' replace />;
}
function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { if (getToken()) loadProfile(); loadProducts(); }, []);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  const loadProfile = async () => {
    try { setLoading(true); const { data } = await api.get('/auth/profile'); setUser(data); localStorage.setItem('user', JSON.stringify(data)); } catch { logout(); } finally { setLoading(false); }
  };
  const loadProducts = async () => { const { data } = await api.get('/products'); setProducts(data); };
  const loadOrders = async () => { const { data } = await api.get('/orders/mine'); setOrders(data); };
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token); setAuth(data.token); setUser(data.user); localStorage.setItem('user', JSON.stringify(data.user)); navigate('/');
  };
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token); setAuth(data.token); setUser(data.user); localStorage.setItem('user', JSON.stringify(data.user)); navigate('/');
  };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setAuth(null); setUser(null); setCart([]); navigate('/login'); };
  const addToCart = (product) => setCart((prev) => {
    const existing = prev.find((item) => item.productId === product._id);
    if (existing) return prev.map((item) => item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item);
    return [...prev, { productId: product._id, title: product.title, price: product.price, quantity: 1 }];
  });
  const removeItem = (id) => setCart((prev) => prev.filter((item) => item.productId !== id));
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const checkout = async () => {
    if (!cart.length) return;
    await api.post('/orders', { products: cart, total }); setCart([]); await loadOrders(); navigate('/orders');
  };
  const createProduct = async (product) => { await api.post('/products', product); loadProducts(); };
  const updateProduct = async (id, updates) => { await api.put(`/products/${id}`, updates); loadProducts(); };
  const deleteProduct = async (id) => { await api.delete(`/products/${id}`); loadProducts(); };
  if (loading) return <div className='min-h-screen flex items-center justify-center'>Loading...</div>;
  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <header className='bg-slate-900 text-white p-4'>
        <div className='container mx-auto flex flex-wrap gap-2 items-center justify-between'>
          <div className='text-xl font-bold'>E-Commerce</div>
          <nav className='flex flex-wrap gap-3'>
            <Link to='/' className='hover:text-cyan-300'>Shop</Link>
            <Link to='/cart' className='hover:text-cyan-300'>Cart ({cart.length})</Link>
            <Link to='/orders' className='hover:text-cyan-300'>Orders</Link>
            {user?.role === 'admin' && <Link to='/admin' className='hover:text-cyan-300'>Admin</Link>}
            {user ? <button onClick={logout} className='px-3 py-1 rounded bg-cyan-500'>Logout</button> : <Link to='/login' className='px-3 py-1 rounded bg-cyan-500'>Login</Link>}
          </nav>
        </div>
      </header>
      <main className='container mx-auto p-4'>
        <Routes>
          <Route path='/login' element={<LoginPage onLogin={login} onRegister={register} />} />
          <Route path='/' element={<AuthGuard><HomePage products={products} addToCart={addToCart} /></AuthGuard>} />
          <Route path='/cart' element={<AuthGuard><CartPage cart={cart} removeItem={removeItem} total={total} checkout={checkout} /></AuthGuard>} />
          <Route path='/orders' element={<AuthGuard><OrdersPage orders={orders} loadOrders={loadOrders} /></AuthGuard>} />
          <Route path='/admin' element={<AuthGuard>{user?.role === 'admin' ? <AdminPage products={products} createProduct={createProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} /> : <div>Admin only</div>}</AuthGuard>} />
        </Routes>
      </main>
    </div>
  );
}
function LoginPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { setError(''); if (mode === 'login') await onLogin(email, password); else await onRegister(name || 'User', email, password); } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };
  return (
    <div className='max-w-md mx-auto p-6 bg-white rounded shadow'>
      <h1 className='text-2xl font-bold mb-4'>{mode === 'login' ? 'Login' : 'Register'}</h1>
      <form onSubmit={submit} className='space-y-4'>
        {mode === 'register' && (<input value={name} onChange={(e) => setName(e.target.value)} placeholder='Name' className='w-full p-3 border rounded' />)}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' className='w-full p-3 border rounded' />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type='password' placeholder='Password' className='w-full p-3 border rounded' />
        <button className='w-full py-3 bg-slate-900 text-white rounded'>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        {error && <div className='text-red-600'>{error}</div>}
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className='mt-4 text-cyan-600'>Switch to {mode === 'login' ? 'Register' : 'Login'}</button>
    </div>
  );
}
function HomePage({ products, addToCart }) {
  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Products</h1>
      <div className='grid gap-4 md:grid-cols-3'>
        {products.map((product) => (
          <div key={product._id} className='bg-white p-4 rounded shadow'>
            <h2 className='font-semibold text-xl'>{product.title}</h2>
            <p className='text-slate-600 mt-2'>{product.description}</p>
            <div className='mt-4 flex items-center justify-between'>
              <span className='font-bold'>${product.price}</span>
              <button onClick={() => addToCart(product)} className='px-3 py-1 bg-cyan-500 text-white rounded'>Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function CartPage({ cart, removeItem, total, checkout }) {
  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Cart</h1>
      <div className='space-y-4'>
        {cart.map((item) => (
          <div key={item.productId} className='bg-white p-4 rounded shadow flex justify-between items-center'>
            <div><div className='font-semibold'>{item.title}</div><div className='text-sm text-slate-600'>Qty: {item.quantity}</div></div>
            <div className='text-right'><div className='font-bold'>${(item.price * item.quantity).toFixed(2)}</div><button onClick={() => removeItem(item.productId)} className='mt-2 text-red-600'>Remove</button></div>
          </div>
        ))}
      </div>
      <div className='mt-6 p-4 bg-white rounded shadow'>
        <div className='flex justify-between items-center'><span className='font-semibold'>Total</span><span className='font-bold'>${total.toFixed(2)}</span></div>
        <button onClick={checkout} className='mt-4 w-full py-3 bg-slate-900 text-white rounded'>Checkout</button>
      </div>
    </div>
  );
}
function OrdersPage({ orders, loadOrders }) {
  useEffect(() => { loadOrders(); }, []);
  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Orders</h1>
      <div className='space-y-4'>
        {orders.map((order) => (
          <div key={order._id} className='bg-white p-4 rounded shadow'>
            <div className='flex justify-between'><div className='font-semibold'>Order {order._id.slice(-6)}</div><div>{order.status}</div></div>
            <div className='text-sm text-slate-600'>Total: ${order.total.toFixed(2)}</div>
            <div className='mt-2 space-y-1'>{order.products.map((item) => (<div key={item.productId}>{item.quantity}x {item.title}</div>))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function AdminPage({ products, createProduct, updateProduct, deleteProduct }) {
  const [title, setTitle] = useState('New Product');
  const [price, setPrice] = useState(10);
  const [description, setDescription] = useState('Description');
  const [editing, setEditing] = useState(null);
  const save = async () => {
    if (editing) await updateProduct(editing._id, { title, price, description });
    else await createProduct({ title, price, description });
    setTitle('New Product'); setPrice(10); setDescription('Description'); setEditing(null);
  };
  const startEdit = (product) => { setEditing(product); setTitle(product.title); setPrice(product.price); setDescription(product.description); };
  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Admin</h1>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='bg-white p-4 rounded shadow'>
          <h2 className='font-semibold mb-3'>{editing ? 'Edit Product' : 'New Product'}</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className='w-full p-3 border rounded mb-3' placeholder='Title' />
          <input type='number' value={price} onChange={(e) => setPrice(Number(e.target.value))} className='w-full p-3 border rounded mb-3' placeholder='Price' />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className='w-full p-3 border rounded mb-3' placeholder='Description' />
          <button onClick={save} className='w-full py-3 bg-cyan-500 text-white rounded'>{editing ? 'Update' : 'Create'}</button>
        </div>
        <div className='space-y-4'>
          {products.map((product) => (
            <div key={product._id} className='bg-white p-4 rounded shadow'>
              <div className='font-semibold'>{product.title}</div>
              <div className='text-slate-600'>${product.price}</div>
              <div className='mt-3 flex gap-2'><button onClick={() => startEdit(product)} className='px-3 py-1 bg-slate-900 text-white rounded'>Edit</button><button onClick={() => deleteProduct(product._id)} className='px-3 py-1 bg-red-500 text-white rounded'>Delete</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default App;
