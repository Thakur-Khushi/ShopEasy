// API Configuration
const API_BASE = 'http://localhost:8000/api';
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let products = [];
let categories = [];
let cart = [];
let currentCategory = 'all';

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
  checkAuthStatus();
  loadProducts();
  loadCategories();
  updateCartCount();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Search on enter key
  document
    .getElementById('search-input')
    .addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchProducts();
      }
    });

  // Form submissions
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document
    .getElementById('register-form')
    .addEventListener('submit', handleRegister);
}

// Authentication Functions
async function checkAuthStatus() {
  if (authToken) {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        currentUser = data;
        showUserInfo();
      } else {
        localStorage.removeItem('authToken');
        authToken = null;
        showGuestInfo();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      showGuestInfo();
    }
  } else {
    showGuestInfo();
  }
}

function showUserInfo() {
  document.getElementById('guest-actions').classList.add('hidden');
  document.getElementById('user-actions').classList.remove('hidden');
  document.getElementById('username').textContent = currentUser.username;
  document.getElementById('user-avatar').textContent = currentUser.username
    .charAt(0)
    .toUpperCase();
}

function showGuestInfo() {
  document.getElementById('guest-actions').classList.remove('hidden');
  document.getElementById('user-actions').classList.add('hidden');
  currentUser = null;
}

// Page Navigation
function showHomePage() {
  hideAllPages();
  document.getElementById('home-page').classList.remove('hidden');
  setActiveNav('Home');
}

function showLoginForm() {
  hideAllPages();
  document.getElementById('login-page').classList.remove('hidden');
}

function showRegisterForm() {
  hideAllPages();
  document.getElementById('register-page').classList.remove('hidden');
}

function showOrdersPage() {
  hideAllPages();
  document.getElementById('orders-page').classList.remove('hidden');
  loadOrders();
}

function hideAllPages() {
  const pages = document.querySelectorAll('#main-content > div');
  pages.forEach((page) => page.classList.add('hidden'));
}

function setActiveNav(category) {
  // Remove active class from all nav items
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.classList.remove('active');
  });

  // Add active class to current category
  document.querySelectorAll('.nav-links a').forEach((link) => {
    if (
      link.textContent === category ||
      (category === 'Home' && link.textContent === 'Home')
    ) {
      link.classList.add('active');
    }
  });
}

// API Functions
async function loadProducts(category = null) {
  try {
    let url = `${API_BASE}/products`;
    if (category && category !== 'all') {
      url += `?category=${category}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    products = data.products;
    displayProducts(products);
    updateProductsTitle(category);
  } catch (error) {
    console.error('Error loading products:', error);
    showNotification('Error loading products', 'error');
  }
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE}/products/categories`);
    const data = await response.json();
    categories = data.categories;
    displayCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    // Use default categories if API fails
    categories = [
      'Electronics',
      'Fashion',
      'Home',
      'Kitchen',
      'Sports',
      'Beauty',
      'Books',
    ];
    displayCategories();
  }
}

async function loadCart() {
  try {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/cart`, { headers });
    const data = await response.json();
    cart = data.cart;
    displayCart();
  } catch (error) {
    console.error('Error loading cart:', error);
  }
}

async function loadOrders() {
  if (!authToken) {
    showNotification('Please login to view orders', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    displayOrders(data.orders);
  } catch (error) {
    console.error('Error loading orders:', error);
    showNotification('Error loading orders', 'error');
  }
}

// Display Functions
function displayProducts(productsToDisplay) {
  const container = document.getElementById('products-list');
  container.innerHTML = '';

  if (productsToDisplay.length === 0) {
    container.innerHTML =
      '<p class="empty-cart">No products found in this category</p>';
    return;
  }

  productsToDisplay.forEach((product) => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
            <div style="position: relative;">
                <img src="${
                  product.image_url || 'https://via.placeholder.com/300x200'
                }" alt="${product.name}" class="product-img">
                <button class="quick-view-btn" onclick="quickView(${
                  product.id
                })">Quick View</button>
            </div>
            <div class="product-info">
                <div class="product-category">${
                  product.category || 'General'
                }</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-stock">${
                  product.stock_quantity || 10
                } in stock</div>
                <button class="add-to-cart" onclick="addToCart(${product.id})" 
                        ${
                          (product.stock_quantity || 10) === 0 ? 'disabled' : ''
                        }>
                    ${
                      (product.stock_quantity || 10) === 0
                        ? 'Out of Stock'
                        : 'Add to Cart'
                    }
                </button>
            </div>
        `;
    container.appendChild(productCard);
  });
}

function displayCategories() {
  const container = document.getElementById('categories-list');
  container.innerHTML = '';

  const categoryImages = {
    Electronics:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150&q=80',
    Fashion:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150&q=80',
    Home: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150&q=80',
    Kitchen:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150&q=80',
    Sports:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150&q=80',
    Beauty:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150&q=80',
    Books:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150&q=80',
  };

  categories.forEach((category) => {
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    categoryCard.innerHTML = `
            <img src="${
              categoryImages[category] || 'https://via.placeholder.com/300x150'
            }" alt="${category}">
            <h3>${category}</h3>
        `;
    categoryCard.onclick = () => filterByCategory(category);
    container.appendChild(categoryCard);
  });
}

function displayCart() {
  const container = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');

  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    totalElement.textContent = '0.00';
    return;
  }

  container.innerHTML = '';
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.product.price * item.quantity;
    total += itemTotal;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
            <img src="${
              item.product.image_url || 'https://via.placeholder.com/80x80'
            }" 
                 alt="${item.product.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.product.name}</div>
                <div class="cart-item-price">$${item.product.price.toFixed(
                  2
                )}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateCartItem(${
                  item.id
                }, ${item.quantity - 1})">-</button>
                <input type="text" class="quantity-input" value="${
                  item.quantity
                }" readonly>
                <button class="quantity-btn" onclick="updateCartItem(${
                  item.id
                }, ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${
              item.id
            })">Remove</button>
        `;
    container.appendChild(cartItem);
  });

  totalElement.textContent = total.toFixed(2);
}

function displayOrders(orders) {
  const container = document.getElementById('orders-list');

  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-cart">No orders found</div>';
    return;
  }

  container.innerHTML = '';
  orders.forEach((order) => {
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item';
    orderItem.innerHTML = `
            <div class="order-header">
                <strong>Order #${order.id}</strong>
                <span>$${order.total.toFixed(2)}</span>
            </div>
            <div>Status: ${order.status}</div>
            <div>Date: ${new Date(order.created_at).toLocaleDateString()}</div>
            <div class="order-products">
                <div class="order-product">
                    <span>${order.name} (x${order.quantity})</span>
                    <span>$${order.price.toFixed(2)}</span>
                </div>
            </div>
        `;
    container.appendChild(orderItem);
  });
}

// Category Filtering
function filterByCategory(category) {
  currentCategory = category;
  loadProducts(category);
  showHomePage();
  updateFilterButtons(category);
  setActiveNav(category === 'all' ? 'Home' : category);
}

function updateFilterButtons(activeCategory) {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    if (
      btn.textContent === activeCategory ||
      (activeCategory === 'all' && btn.textContent === 'All Products')
    ) {
      btn.classList.add('active');
    }
  });
}

function updateProductsTitle(category) {
  const title = document.getElementById('products-title');
  if (category && category !== 'all') {
    title.textContent = `${category} Products`;
  } else {
    title.textContent = 'Featured Products';
  }
}

// Quick View Function
function quickView(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    showNotification(
      `Quick view: ${product.name} - $${product.price.toFixed(2)}`,
      'info'
    );
  }
}

// Cart Functions
async function addToCart(productId) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product_id: productId,
        quantity: 1,
      }),
    });

    if (response.ok) {
      showNotification('Product added to cart', 'success');
      updateCartCount();
      if (document.getElementById('cart-modal').style.display === 'flex') {
        loadCart();
      }
    } else {
      const error = await response.json();
      showNotification(error.detail || 'Error adding to cart', 'error');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('Error adding to cart', 'error');
  }
}

async function updateCartItem(itemId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(itemId);
    return;
  }

  try {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `${API_BASE}/cart/${itemId}?quantity=${newQuantity}`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (response.ok) {
      loadCart();
      updateCartCount();
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    showNotification('Error updating cart', 'error');
  }
}

async function removeFromCart(itemId) {
  try {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/cart/${itemId}`, {
      method: 'DELETE',
      headers,
    });

    if (response.ok) {
      loadCart();
      updateCartCount();
      showNotification('Item removed from cart', 'success');
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    showNotification('Error removing from cart', 'error');
  }
}

async function updateCartCount() {
  try {
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/cart`, { headers });
    const data = await response.json();
    const totalItems = data.cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
    document.getElementById('cart-count').textContent = totalItems;
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

// Auth Functions
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.access_token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;
      showUserInfo();
      showHomePage();
      showNotification('Login successful!', 'success');
      updateCartCount();
    } else {
      showNotification(data.detail || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Login failed', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById('register-email').value;
  const username = document.getElementById('register-username').value;
  const fullName = document.getElementById('register-fullname').value;
  const password = document.getElementById('register-password').value;

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        username,
        full_name: fullName,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.access_token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;
      showUserInfo();
      showHomePage();
      showNotification('Registration successful!', 'success');
    } else {
      showNotification(data.detail || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showNotification('Registration failed', 'error');
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  showGuestInfo();
  showHomePage();
  showNotification('Logged out successfully', 'success');
}

// Modal Functions
function showCart() {
  loadCart();
  document.getElementById('cart-modal').style.display = 'flex';
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

function showCheckoutForm() {
  if (cart.length === 0) {
    showNotification('Your cart is empty', 'error');
    return;
  }

  document.getElementById('checkout-modal').style.display = 'flex';
  document.getElementById('cart-modal').style.display = 'none';

  // Populate checkout form with user info if available
  if (currentUser) {
    document.getElementById('checkout-name').value =
      currentUser.full_name || '';
    document.getElementById('checkout-email').value = currentUser.email || '';
  }

  // Update checkout summary
  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total');

  checkoutItems.innerHTML = '';
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.product.price * item.quantity;
    total += itemTotal;

    const itemElement = document.createElement('div');
    itemElement.className = 'order-product';
    itemElement.innerHTML = `
            <span>${item.product.name} (x${item.quantity})</span>
            <span>$${itemTotal.toFixed(2)}</span>
        `;
    checkoutItems.appendChild(itemElement);
  });

  checkoutTotal.textContent = total.toFixed(2);
}

function closeCheckout() {
  document.getElementById('checkout-modal').style.display = 'none';
}

async function processCheckout() {
  const name = document.getElementById('checkout-name').value;
  const email = document.getElementById('checkout-email').value;
  const address = document.getElementById('checkout-address').value;
  const payment = document.getElementById('checkout-payment').value;

  if (!name || !email || !address) {
    showNotification('Please fill all required fields', 'error');
    return;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer_name: name,
        customer_email: email,
        shipping_address: address,
        payment_method: payment,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification('Order placed successfully!', 'success');
      closeCheckout();
      updateCartCount();
      if (authToken) {
        loadOrders();
      }
    } else {
      showNotification(data.detail || 'Checkout failed', 'error');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    showNotification('Checkout failed', 'error');
  }
}

// Utility Functions
function searchProducts() {
  const searchTerm = document
    .getElementById('search-input')
    .value.toLowerCase();
  if (searchTerm) {
    const filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm)) ||
        (product.category &&
          product.category.toLowerCase().includes(searchTerm))
    );
    displayProducts(filteredProducts);
    document.getElementById(
      'products-title'
    ).textContent = `Search Results for "${searchTerm}"`;
  } else {
    displayProducts(products);
    updateProductsTitle(currentCategory);
  }
}

function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  container.appendChild(notification);

  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);

  // Hide and remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Close modals when clicking outside
window.onclick = function (event) {
  const cartModal = document.getElementById('cart-modal');
  const checkoutModal = document.getElementById('checkout-modal');

  if (event.target === cartModal) {
    closeCart();
  }
  if (event.target === checkoutModal) {
    closeCheckout();
  }
};
