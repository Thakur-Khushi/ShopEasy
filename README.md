# 🛍️ ShopEasy

A full-stack e-commerce web application built with **React, FastAPI, and MySQL**. ShopEasy provides a complete shopping experience — product browsing, authentication, cart management, checkout, order tracking, and an admin order dashboard.

**🚧 Live Demo:** Coming soon — currently runs locally (see [Getting Started](#-getting-started)).

---

## Overview

ShopEasy is a complete e-commerce platform demonstrating full-stack development. The frontend is built with **React and Vite**; the backend provides REST APIs using **FastAPI, SQLAlchemy, and JWT authentication**.

The application supports both customer and admin workflows — product discovery, cart operations, checkout, order history, and admin order status management.

> Designed and built solo — React frontend, FastAPI backend, database schema, and JWT authentication.

---

## ✨ Features

- Responsive e-commerce user interface
- Product catalog with category filtering
- Product search
- User registration and login
- JWT-based authentication
- Shopping cart management
- Checkout workflow
- Customer order history
- Admin order dashboard
- Admin order status updates
- Auto-seeded sample products
- Default admin account created on first run (see Setup — do not use in production without changing it)

---

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- CSS
- Lucide React icons

**Backend**
- FastAPI
- SQLAlchemy
- Pydantic
- JWT authentication
- Passlib (password hashing)

**Database**
- MySQL

---

## 🗂️ Project Structure

```
.
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── auth.py
│   └── db.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── styles.css
├── requirements.txt
└── README.md
```

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Create the MySQL database
```sql
CREATE DATABASE shopping_system;
```
Update the database credentials in `backend/db.py` — read them from environment variables rather than hardcoding, e.g.:
```python
import os
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
```

### 3. Run the backend

Create and activate a virtual environment:
```bash
python -m venv venv
```

macOS/Linux:
```bash
source venv/bin/activate
```

Windows:
```bash
venv\Scripts\activate
```

Install dependencies and start the API:
```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

- Backend URL: `http://localhost:8000`
- Interactive API docs (Swagger UI): `http://localhost:8000/docs`

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend URL: `http://127.0.0.1:5173`

```

Change the password immediately if you deploy this anywhere beyond local testing.

---

## 🌐 API Highlights

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/products` | Fetch products |
| GET | `/api/products/categories` | Fetch product categories |
| GET | `/api/cart` | Fetch cart items |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/{cart_item_id}` | Update cart item quantity |
| DELETE | `/api/cart/{cart_item_id}` | Remove item from cart |
| POST | `/api/checkout` | Place an order |
| GET | `/api/orders` | Fetch customer orders |
| GET | `/api/admin/orders` | Fetch all orders (admin) |
| PUT | `/api/admin/orders/{order_id}/status` | Update order status (admin) |

---

## 🔁 Main Workflows

- Browse products by category
- Search products
- Register or login as a user
- Add products to cart
- Update cart quantities
- Complete checkout
- View order history
- Manage order statuses as admin

---

## ✅ Testing

> Currently no automated tests. Planned additions:
> - API tests for auth, cart, and checkout endpoints (pytest + FastAPI's `TestClient`)
> - Frontend component tests for cart and checkout flows
>
> Run backend tests with: `pytest`

---

## 🚀 Deployment

Not yet deployed. Planned setup:
- Backend: Render or Railway
- Frontend: Vercel or Netlify
- Database: Railway MySQL or PlanetScale
- Environment variables for DB credentials, JWT secret, and admin account — never committed to source

---

## 🔭 Future Improvements

- Admin product management dashboard
- Payment gateway integration
- Product reviews and ratings
- Persistent wishlist feature
- Invoice generation
- Automated tests
- Deployment-ready environment configuration

---

## License

This project is intended for educational and portfolio purposes.
