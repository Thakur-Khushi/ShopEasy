from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
from backend import db, models, schemas, crud, auth

# Create FastAPI app
app = FastAPI(
    title="Shopping System API", 
    version="1.0.0",
    description="Complete e-commerce backend with authentication"
)

# --- ✅ CORS FIX ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ✅ Create database tables ---
@app.on_event("startup")
def startup_event():
    models.Base.metadata.create_all(bind=db.engine)
    seed_products()
    create_admin_user()

# ---------------------------------------------------------
# 👤 Authentication Routes
# ---------------------------------------------------------
@app.post("/api/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(db.get_db)):
    try:
        new_user = crud.create_user(db, user)
        access_token = auth.create_access_token(data={"sub": str(new_user.id)})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": new_user.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(db.get_db)):
    user = crud.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user.to_dict()
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_current_user(
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return current_user

# ---------------------------------------------------------
# 🛍️ Product Routes
# ---------------------------------------------------------
@app.post("/api/products", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    new_product = crud.create_product(db, product)
    return new_product

@app.get("/api/products")
def get_products(
    category: str = None,
    db: Session = Depends(db.get_db)
):
    products = crud.get_all_products(db, category)
    return {"products": [product.to_dict() for product in products]}

@app.get("/api/products/categories")
def get_categories(db: Session = Depends(db.get_db)):
    categories = crud.get_categories(db)
    return {"categories": categories}

@app.get("/api/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(db.get_db)):
    product = crud.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.to_dict()

# ---------------------------------------------------------
# 🛒 Cart Routes
# ---------------------------------------------------------
def get_session_id(request: Request):
    """Get or create session ID for cart management."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id

@app.get("/api/cart")
def get_cart_items(
    request: Request,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session_id = get_session_id(request)
    user_id = current_user.id if current_user else None
    cart_items = crud.get_cart_items(db, user_id=user_id, session_id=session_id)
    return {"cart": cart_items}

@app.post("/api/cart/add")
def add_cart_item(
    cart_item: schemas.CartItemBase,
    request: Request,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session_id = get_session_id(request)
    user_id = current_user.id if current_user else None
    
    try:
        result = crud.add_to_cart(
            db, 
            cart_item.product_id, 
            cart_item.quantity, 
            user_id=user_id, 
            session_id=session_id
        )
        return {"message": "Item added to cart successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/cart/{cart_item_id}")
def update_cart_item(
    cart_item_id: int,
    quantity: int,
    request: Request,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session_id = get_session_id(request)
    user_id = current_user.id if current_user else None
    
    try:
        result = crud.update_cart_item_quantity(
            db, cart_item_id, quantity, 
            user_id=user_id,
            session_id=session_id
        )
        return {"message": "Cart updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/cart/{cart_item_id}")
def remove_cart_item(
    cart_item_id: int,
    request: Request,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session_id = get_session_id(request)
    user_id = current_user.id if current_user else None
    
    success = crud.remove_from_cart(
        db, cart_item_id, 
        user_id=user_id,
        session_id=session_id
    )
    if success:
        return {"message": "Item removed from cart"}
    else:
        raise HTTPException(status_code=404, detail="Cart item not found")

@app.delete("/api/cart")
def clear_cart_items(
    request: Request,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session_id = get_session_id(request)
    user_id = current_user.id if current_user else None
    
    crud.clear_cart(
        db, 
        user_id=user_id,
        session_id=session_id
    )
    return {"message": "Cart cleared successfully"}

# ---------------------------------------------------------
# 🧾 Orders & Checkout Routes
# ---------------------------------------------------------
@app.post("/api/checkout")
def checkout(
    checkout_data: schemas.CheckoutRequest,
    request: Request,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session_id = get_session_id(request)
    user_id = current_user.id if current_user else None
    
    result = crud.checkout(
        db, checkout_data, 
        user_id=user_id,
        session_id=session_id
    )
    return result

@app.get("/api/orders")
def get_orders(
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    user_id = current_user.id if current_user else None
    orders = crud.get_orders(db, user_id=user_id)
    return {"orders": orders}

@app.get("/api/orders/{order_id}")
def get_order(
    order_id: int, 
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    order = crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user and order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return order

# ---------------------------------------------------------
# 🌱 Auto Seed Products & Admin User
# ---------------------------------------------------------
def seed_products():
    """Auto populate DB with default products if empty."""
    session: Session = next(db.get_db())

    if session.query(models.Product).count() == 0:
        default_products = [
            {
                "name": "Wireless Headphones Pro", 
                "price": 129.99, 
                "description": "Premium noise-canceling headphones with 30-hour battery life.",
                "image_url": "https://via.placeholder.com/300x200?text=Headphones",
                "category": "Electronics",
                "stock_quantity": 50
            },
            {
                "name": "Smart Fitness Watch", 
                "price": 199.99, 
                "description": "Track your health and fitness goals with advanced sensors.",
                "image_url": "https://via.placeholder.com/300x200?text=Smart+Watch",
                "category": "Electronics",
                "stock_quantity": 30
            },
            {
                "name": "Designer Leather Jacket", 
                "price": 249.99, 
                "description": "Genuine leather jacket with modern fit and timeless style.",
                "image_url": "https://via.placeholder.com/300x200?text=Leather+Jacket",
                "category": "Fashion",
                "stock_quantity": 25
            },
            {
                "name": "Portable Bluetooth Speaker", 
                "price": 79.99, 
                "description": "Waterproof speaker with 360° sound and deep bass.",
                "image_url": "https://via.placeholder.com/300x200?text=Bluetooth+Speaker",
                "category": "Electronics",
                "stock_quantity": 40
            },
            {
                "name": "Modern Coffee Table", 
                "price": 159.99, 
                "description": "Minimalist coffee table with storage.",
                "image_url": "https://via.placeholder.com/300x200?text=Coffee+Table",
                "category": "Home",
                "stock_quantity": 15
            },
            {
                "name": "Running Shoes Elite", 
                "price": 119.99, 
                "description": "Professional running shoes with responsive cushioning.",
                "image_url": "https://via.placeholder.com/300x200?text=Running+Shoes",
                "category": "Sports",
                "stock_quantity": 35
            },
        ]
        for p in default_products:
            session.add(models.Product(**p))
        session.commit()
        print("✅ Default products added to DB.")
    else:
        print("✅ Products already exist in DB.")
    session.close()

def create_admin_user():
    """Create admin user if not exists."""
    session: Session = next(db.get_db())
    
    if session.query(models.User).filter(models.User.email == "admin@shopeasy.com").first() is None:
        admin_user = models.User(
            email="admin@shopeasy.com",
            username="admin",
            full_name="System Administrator",
            hashed_password=db.get_password_hash("admin123"),
            is_admin=True
        )
        session.add(admin_user)
        session.commit()
        print("✅ Admin user created: admin@shopeasy.com / admin123")
    session.close()

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Shopping System API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}