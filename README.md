# ShopEasy

A full-stack e-commerce web application built with React, FastAPI, and MySQL. ShopEasy provides a modern shopping experience with product browsing, authentication, cart management, checkout, order tracking, and admin order management.

## Overview

ShopEasy is a complete mini e-commerce platform designed to demonstrate full-stack development skills. The frontend is built with React and Vite, while the backend provides REST APIs using FastAPI, SQLAlchemy, and JWT authentication.

The application supports both customer and admin workflows, including product discovery, cart operations, checkout, order history, and admin order status updates.

## Features

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
- Default admin account creation on startup

## Tech Stack

### Frontend

- React
- Vite
- CSS
- Lucide React icons

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- JWT authentication
- Passlib password hashing

### Database

- MySQL

## Project Structure

```txt
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

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Create the MySQL Database

```sql
CREATE DATABASE shopping_system;
```

Update the database credentials in `backend/db.py` if your local MySQL configuration is different.

### 3. Run the Backend

Create and activate a virtual environment:

```bash
python -m venv venv
```

On macOS/Linux:

```bash
source venv/bin/activate
```

On Windows:

```powershell
venv\Scripts\activate
```

Install dependencies and start the API:

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Backend URL:

```txt
http://localhost:8000
```

API documentation:

```txt
http://localhost:8000/docs
```

### 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```txt
http://127.0.0.1:5173
```

## Default Admin Account

The backend creates a default admin account when the application starts:

```txt
Email: admin@shopeasy.com
Password: admin123
```

## API Highlights

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/products` - Fetch products
- `GET /api/products/categories` - Fetch product categories
- `GET /api/cart` - Fetch cart items
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/{cart_item_id}` - Update cart item quantity
- `DELETE /api/cart/{cart_item_id}` - Remove item from cart
- `POST /api/checkout` - Place an order
- `GET /api/orders` - Fetch customer orders
- `GET /api/admin/orders` - Fetch all orders as admin
- `PUT /api/admin/orders/{order_id}/status` - Update order status

## Main Workflows

- Browse products by category
- Search products
- Register or login as a user
- Add products to cart
- Update cart quantities
- Complete checkout
- View order history
- Manage order statuses as admin

## Future Improvements

- Admin product management dashboard
- Payment gateway integration
- Product reviews and ratings
- Persistent wishlist feature
- Invoice generation
- Deployment-ready environment configuration

## License

This project is intended for educational and portfolio purposes.
