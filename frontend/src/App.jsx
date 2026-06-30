import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  ChevronRight,
  Heart,
  LogIn,
  LogOut,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  UserPlus,
  X,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

const fallbackCategories = [
  'Electronics',
  'Fashion',
  'Home',
  'Kitchen',
  'Sports',
  'Beauty',
  'Books',
];

const categoryImages = {
  Electronics:
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80',
  Fashion:
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80',
  Home: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80',
  Kitchen:
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=700&q=80',
  Sports:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=700&q=80',
  Beauty:
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80',
  Books:
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80',
};

const money = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  });
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(fallbackCategories);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [notice, setNotice] = useState(null);

  useScrollReveal();

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.description, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, searchTerm]);

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      ),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    loadProducts(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (token) {
      checkAuthStatus();
      loadCart();
    } else {
      setCurrentUser(null);
      setCart([]);
    }
  }, [token]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.skipAuth ? {} : authHeaders),
        ...options.headers,
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(data.detail || 'Something went wrong');
    }
    return data;
  }

  async function checkAuthStatus() {
    try {
      const user = await api('/auth/me');
      setCurrentUser(user);
    } catch {
      localStorage.removeItem('authToken');
      setToken(null);
    }
  }

  async function loadProducts(category = 'all') {
    setLoadingProducts(true);
    try {
      const suffix = category && category !== 'all' ? `?category=${category}` : '';
      const data = await api(`/products${suffix}`, { skipAuth: true });
      setProducts(data.products || []);
    } catch (error) {
      showNotice(error.message || 'Error loading products', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await api('/products/categories', { skipAuth: true });
      const uniqueCategories = [
        ...new Set([...(data.categories || []), ...fallbackCategories]),
      ];
      setCategories(uniqueCategories);
    } catch {
      setCategories(fallbackCategories);
    }
  }

  async function loadCart() {
    if (!token) return;
    try {
      const data = await api('/cart');
      setCart(data.cart || []);
    } catch (error) {
      showNotice(error.message || 'Could not load cart', 'error');
    }
  }

  async function loadOrders() {
    if (!token) {
      showNotice('Please login to view orders', 'error');
      setPage('login');
      return;
    }

    try {
      const endpoint = currentUser?.is_admin ? '/admin/orders' : '/orders';
      const data = await api(endpoint);
      setOrders(data.orders || []);
      setPage('orders');
    } catch (error) {
      showNotice(error.message || 'Could not load orders', 'error');
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      await api(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      showNotice('Order status updated', 'success');
      loadOrders();
    } catch (error) {
      showNotice(error.message || 'Could not update order', 'error');
    }
  }

  async function handleLogin(formData) {
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      localStorage.setItem('authToken', data.access_token);
      setToken(data.access_token);
      setCurrentUser(data.user);
      setPage('home');
      showNotice('Login successful', 'success');
    } catch (error) {
      showNotice(error.message || 'Login failed', 'error');
    }
  }

  async function handleRegister(formData) {
    const payload = Object.fromEntries(formData);
    payload.full_name = payload.full_name || null;

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      localStorage.setItem('authToken', data.access_token);
      setToken(data.access_token);
      setCurrentUser(data.user);
      setPage('home');
      showNotice('Account created', 'success');
    } catch (error) {
      showNotice(error.message || 'Registration failed', 'error');
    }
  }

  function logout() {
    localStorage.removeItem('authToken');
    setToken(null);
    setCurrentUser(null);
    setPage('home');
    showNotice('Logged out successfully', 'success');
  }

  function chooseCategory(category) {
    setActiveCategory(category);
    setSearchTerm('');
    setPage('home');
  }

  async function addToCart(productId) {
    if (!token) {
      showNotice('Please login before adding items to cart', 'info');
      setPage('login');
      return;
    }

    try {
      await api('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      await loadCart();
      showNotice('Product added to cart', 'success');
    } catch (error) {
      showNotice(error.message || 'Could not add item', 'error');
    }
  }

  async function updateCartItem(itemId, quantity) {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    try {
      await api(`/cart/${itemId}?quantity=${quantity}`, { method: 'PUT' });
      loadCart();
    } catch (error) {
      showNotice(error.message || 'Could not update cart', 'error');
    }
  }

  async function removeFromCart(itemId) {
    try {
      await api(`/cart/${itemId}`, { method: 'DELETE' });
      await loadCart();
      showNotice('Item removed from cart', 'success');
    } catch (error) {
      showNotice(error.message || 'Could not remove item', 'error');
    }
  }

  async function processCheckout(formData) {
    try {
      await api('/checkout', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      setCheckoutOpen(false);
      await loadCart();
      showNotice('Order placed successfully', 'success');
    } catch (error) {
      showNotice(error.message || 'Checkout failed', 'error');
    }
  }

  function showNotice(message, type = 'info') {
    setNotice({ message, type });
  }

  return (
    <>
      <Header
        activeCategory={activeCategory}
        cartCount={cartCount}
        categories={categories}
        currentUser={currentUser}
        onCart={() => {
          if (!token) {
            showNotice('Please login to view your cart', 'info');
            setPage('login');
            return;
          }
          void loadCart();
          setCartOpen(true);
        }}
        onCategory={chooseCategory}
        onLogin={() => setPage('login')}
        onLogout={logout}
        onOrders={loadOrders}
        onRegister={() => setPage('register')}
        onSearch={setSearchTerm}
        onHome={() => {
          setPage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchTerm={searchTerm}
      />

      <main>
        {page === 'home' && (
          <HomePage
            activeCategory={activeCategory}
            categories={categories}
            loading={loadingProducts}
            onAddToCart={addToCart}
            onCategory={chooseCategory}
            products={filteredProducts}
            productTitle={
              searchTerm
                ? `Search results for "${searchTerm}"`
                : activeCategory === 'all'
                  ? 'Featured Products'
                  : `${activeCategory} Products`
            }
          />
        )}

        {page === 'login' && (
          <AuthPage mode="login" onSubmit={handleLogin} onSwitch={() => setPage('register')} />
        )}

        {page === 'register' && (
          <AuthPage
            mode="register"
            onSubmit={handleRegister}
            onSwitch={() => setPage('login')}
          />
        )}

        {page === 'orders' && (
          <OrdersPage
            isAdmin={Boolean(currentUser?.is_admin)}
            orders={orders}
            onStatusChange={updateOrderStatus}
          />
        )}
      </main>

      <Footer
        onHome={() => {
          setPage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOrders={loadOrders}
      />

      {cartOpen && (
        <CartModal
          cart={cart}
          total={cartTotal}
          onCheckout={() => {
            if (!cart.length) {
              showNotice('Your cart is empty', 'error');
              return;
            }
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onUpdate={updateCartItem}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          currentUser={currentUser}
          total={cartTotal}
          onClose={() => setCheckoutOpen(false)}
          onSubmit={processCheckout}
        />
      )}

      {notice && <div className={`notice ${notice.type}`}>{notice.message}</div>}
    </>
  );
}

function Header({
  activeCategory,
  cartCount,
  categories,
  currentUser,
  onCart,
  onCategory,
  onHome,
  onLogin,
  onLogout,
  onOrders,
  onRegister,
  onSearch,
  searchTerm,
}) {
  return (
    <header className="site-header">
      <div className="header-main shell">
        <button className="brand" onClick={onHome}>
          <ShoppingBag size={28} />
          <span>
            Shop<span>Easy</span>
          </span>
        </button>

        <label className="search-field">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search products, categories, gifts..."
          />
        </label>

        <div className="header-actions">
          {currentUser ? (
            <>
              <button className="profile-pill" onClick={onOrders}>
                <span className="avatar">{currentUser.username?.charAt(0).toUpperCase()}</span>
                <span>{currentUser.username}</span>
                {currentUser.is_admin && <BadgeCheck size={16} />}
              </button>
              <IconButton label="Orders" onClick={onOrders}>
                <Package size={19} />
              </IconButton>
              <IconButton label="Logout" onClick={onLogout}>
                <LogOut size={19} />
              </IconButton>
            </>
          ) : (
            <>
              <button className="text-action" onClick={onLogin}>
                <LogIn size={18} />
                Login
              </button>
              <button className="text-action" onClick={onRegister}>
                <UserPlus size={18} />
                Register
              </button>
            </>
          )}

          <button className="cart-button" onClick={onCart}>
            <ShoppingCart size={20} />
            <span>{cartCount}</span>
          </button>
        </div>
      </div>

      <nav className="category-nav shell" aria-label="Product categories">
        <button
          className={activeCategory === 'all' ? 'active' : ''}
          onClick={() => onCategory('all')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            className={activeCategory === category ? 'active' : ''}
            key={category}
            onClick={() => onCategory(category)}
          >
            {category === 'Home' ? 'Home & Kitchen' : category}
          </button>
        ))}
      </nav>
    </header>
  );
}

function HomePage({
  activeCategory,
  categories,
  loading,
  onAddToCart,
  onCategory,
  products,
  productTitle,
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-content shell">
          <div className="hero-copy" data-reveal>
            <div className="eyebrow">
              <Sparkles size={16} />
              Premium marketplace experience
            </div>
            <h1>Curated essentials for modern shopping.</h1>
            <p>
              Browse quality products, compare departments quickly, and checkout with a
              smooth account-first shopping flow.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => onCategory('all')}>
                Shop Products
                <ChevronRight size={18} />
              </button>
              <button className="secondary-button" onClick={() => onCategory('Electronics')}>
                Explore Tech
              </button>
            </div>
            <div className="hero-stats" aria-label="ShopEasy highlights">
              <div>
                <strong>7+</strong>
                <span>Departments</span>
              </div>
              <div>
                <strong>24h</strong>
                <span>Order updates</span>
              </div>
              <div>
                <strong>4.8</strong>
                <span>Customer rating</span>
              </div>
            </div>
          </div>
          <div className="hero-panel" aria-hidden="true" data-reveal>
            <div className="hero-showcase">
              <img
                alt=""
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=760&q=80"
              />
            </div>
            <div className="hero-card card-a">
              <span>Top rated</span>
              <strong>Wireless Headphones Pro</strong>
            </div>
            <div className="hero-card card-b">
              <span>Today</span>
              <strong>Up to 50% off</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="shell benefit-strip" aria-label="Store benefits" data-reveal>
        <div>
          <Truck size={22} />
          <span>Fast delivery</span>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>Secure checkout</span>
        </div>
        <div>
          <Star size={22} />
          <span>Quality selection</span>
        </div>
        <div>
          <Heart size={22} />
          <span>Easy support</span>
        </div>
      </section>

      <section className="shell section" data-reveal>
        <div className="section-heading">
          <div>
            <p className="section-kicker">Categories</p>
            <h2>Shop by department</h2>
          </div>
          <span>{categories.length} departments</span>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button
              className={`category-tile ${activeCategory === category ? 'active' : ''}`}
              key={category}
              onClick={() => onCategory(category)}
            >
              <img
                alt=""
                src={categoryImages[category] || 'https://via.placeholder.com/700x450'}
              />
              <span>{category === 'Home' ? 'Home & Kitchen' : category}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="shell section" data-reveal>
        <div className="section-heading">
          <div>
            <p className="section-kicker">Catalog</p>
            <h2>{productTitle}</h2>
          </div>
          <span>{products.length} items</span>
        </div>

        {loading ? (
          <div className="state-box">Loading products...</div>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        ) : (
          <div className="state-box">No products found.</div>
        )}
      </section>
    </>
  );
}

function ProductCard({ product, onAddToCart }) {
  const stock = product.stock_quantity ?? 0;

  return (
    <article className="product-card" data-reveal>
      <div className="product-media">
        <img
          alt={product.name}
          src={product.image_url || 'https://via.placeholder.com/700x450'}
        />
        <span>{product.category || 'General'}</span>
        <button className="wish-button" type="button" title="Save product">
          <Heart size={17} />
          <span className="sr-only">Save product</span>
        </button>
      </div>
      <div className="product-body">
        <div>
          <div className="rating-row">
            <Star size={15} fill="currentColor" />
            <span>4.8</span>
          </div>
          <h3>{product.name}</h3>
          <p>{product.description || 'A selected ShopEasy product ready for checkout.'}</p>
        </div>
        <div className="product-meta">
          <strong>{money(product.price)}</strong>
          <span>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span>
        </div>
        <button
          className="primary-button full"
          disabled={stock <= 0}
          onClick={() => onAddToCart(product.id)}
        >
          <ShoppingCart size={18} />
          {stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}

function AuthPage({ mode, onSubmit, onSwitch }) {
  const isLogin = mode === 'login';

  return (
    <section className="auth-screen shell" data-reveal>
      <form
        className="auth-card"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        <div className="auth-icon">{isLogin ? <LogIn /> : <UserPlus />}</div>
        <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p>
          {isLogin
            ? 'Sign in to manage your cart and track orders.'
            : 'Register once and keep your shopping flow moving.'}
        </p>

        <label>
          Email
          <input name="email" type="email" required />
        </label>

        {!isLogin && (
          <>
            <label>
              Username
              <input name="username" type="text" required />
            </label>
            <label>
              Full name
              <input name="full_name" type="text" />
            </label>
          </>
        )}

        <label>
          Password
          <input name="password" type="password" required />
        </label>

        <button className="primary-button full" type="submit">
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button className="switch-button" type="button" onClick={onSwitch}>
          {isLogin ? 'Need an account? Register' : 'Already registered? Login'}
        </button>
      </form>
    </section>
  );
}

function OrdersPage({ isAdmin, orders, onStatusChange }) {
  return (
    <section className="shell section page-section" data-reveal>
      <div className="section-heading">
        <div>
          <p className="section-kicker">{isAdmin ? 'Admin' : 'Account'}</p>
          <h2>{isAdmin ? 'All Orders' : 'My Orders'}</h2>
        </div>
        <span>{orders.length} orders</span>
      </div>

      {orders.length ? (
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-top">
                <div>
                  <strong>Order #{order.id}</strong>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={order.status} />
              </div>
              {isAdmin && (
                <p className="muted">
                  {order.customer_name || 'Customer'} - {order.customer_email || 'No email'}
                </p>
              )}
              <div className="order-line">
                <span>
                  {order.name} x {order.quantity}
                </span>
                <strong>{money(order.total)}</strong>
              </div>
              {order.shipping_address && <p className="muted">{order.shipping_address}</p>}
              {isAdmin && (
                <select
                  className="status-select"
                  value={order.status}
                  onChange={(event) => onStatusChange(order.id, event.target.value)}
                >
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )
                  )}
                </select>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="state-box">No orders found.</div>
      )}
    </section>
  );
}

function CartModal({ cart, onCheckout, onClose, onRemove, onUpdate, total }) {
  return (
    <Modal title="Shopping Cart" onClose={onClose}>
      {cart.length ? (
        <div className="cart-list">
          {cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img
                alt={item.product.name}
                src={item.product.image_url || 'https://via.placeholder.com/160x160'}
              />
              <div>
                <strong>{item.product.name}</strong>
                <span>{money(item.product.price)}</span>
              </div>
              <div className="quantity-control">
                <button onClick={() => onUpdate(item.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdate(item.id, item.quantity + 1)}>+</button>
              </div>
              <button className="remove-button" onClick={() => onRemove(item.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="state-box">Your cart is empty.</div>
      )}
      <div className="modal-summary">
        <span>Total</span>
        <strong>{money(total)}</strong>
      </div>
      <button className="primary-button full" onClick={onCheckout}>
        Proceed to Checkout
      </button>
    </Modal>
  );
}

function CheckoutModal({ cart, currentUser, onClose, onSubmit, total }) {
  return (
    <Modal title="Checkout" onClose={onClose}>
      <form
        className="checkout-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        <div className="checkout-fields">
          <label>
            Full name
            <input
              name="customer_name"
              defaultValue={currentUser?.full_name || ''}
              required
            />
          </label>
          <label>
            Email
            <input
              name="customer_email"
              defaultValue={currentUser?.email || ''}
              type="email"
              required
            />
          </label>
          <label>
            Shipping address
            <textarea name="shipping_address" rows="4" required />
          </label>
          <label>
            Payment method
            <select name="payment_method" defaultValue="card">
              <option value="card">Credit/Debit Card</option>
              <option value="paypal">PayPal</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </label>
        </div>
        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          {cart.map((item) => (
            <div className="summary-row" key={item.id}>
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <strong>{money(item.product.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="modal-summary">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="primary-button full" type="submit" disabled={!cart.length}>
            Place Order
          </button>
        </aside>
      </form>
    </Modal>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{status}</span>;
}

function IconButton({ children, label, onClick }) {
  return (
    <button className="icon-button" onClick={onClick} title={label} type="button">
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function Footer({ onHome, onOrders }) {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <button className="brand footer-brand" onClick={onHome}>
            <ShoppingBag size={24} />
            <span>
              Shop<span>Easy</span>
            </span>
          </button>
          <p>Quality products, clear ordering, and a smoother shopping experience.</p>
        </div>
        <div>
          <h3>Shop</h3>
          <button onClick={onHome}>Products</button>
          <button onClick={onOrders}>Orders</button>
        </div>
        <div>
          <h3>Support</h3>
          <span>support@shopeasy.com</span>
          <span>+1 (555) 123-4567</span>
        </div>
      </div>
    </footer>
  );
}

export default App;
