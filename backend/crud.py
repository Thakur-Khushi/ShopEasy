from sqlalchemy.orm import Session
from backend import models, schemas, db
from backend.db import get_password_hash, verify_password

# ---------------------------------------------------------
# 👤 User CRUD
# ---------------------------------------------------------
def create_user(db: Session, user: schemas.UserCreate):
    """Create a new user."""
    # Check if user already exists
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise ValueError("Email already registered")
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise ValueError("Username already taken")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_user_by_id(db: Session, user_id: int):
    """Get user by ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

# ---------------------------------------------------------
# 🛍️ Product CRUD
# ---------------------------------------------------------
def create_product(db: Session, product_data):
    """Add a new product to the database."""
    new_product = models.Product(
        name=product_data.name,
        price=product_data.price,
        description=product_data.description,
        image_url=product_data.image_url,
        category=product_data.category,
        stock_quantity=product_data.stock_quantity
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def get_all_products(db: Session, category: str = None):
    """Retrieve all products."""
    query = db.query(models.Product).filter(models.Product.is_active == True)
    if category and category != "all":
        query = query.filter(models.Product.category == category)
    return query.all()

def get_product_by_id(db: Session, product_id: int):
    """Get a single product by ID."""
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_categories(db: Session):
    """Get all product categories."""
    categories = db.query(models.Product.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]

# ---------------------------------------------------------
# 🛒 CART MANAGEMENT
# ---------------------------------------------------------
def get_cart_items(db: Session, user_id: int = None, session_id: str = None):
    """Retrieve cart items."""
    query = db.query(models.CartItem)
    
    if user_id:
        query = query.filter(models.CartItem.user_id == user_id)
    elif session_id:
        query = query.filter(models.CartItem.session_id == session_id)
    else:
        return []
    
    cart_items = query.all()
    
    # Include product details
    result = []
    for item in cart_items:
        product = get_product_by_id(db, item.product_id)
        if product and product.is_active:
            result.append({
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "product": product.to_dict()
            })
    return result

def add_to_cart(db: Session, product_id: int, quantity: int = 1, user_id: int = None, session_id: str = None):
    """Add a product to the cart."""
    product = get_product_by_id(db, product_id)
    if not product or not product.is_active:
        raise ValueError("Product not found")
    
    if product.stock_quantity < quantity:
        raise ValueError("Insufficient stock")

    # Check if item already exists in cart
    query = db.query(models.CartItem).filter(models.CartItem.product_id == product_id)
    if user_id:
        query = query.filter(models.CartItem.user_id == user_id)
    elif session_id:
        query = query.filter(models.CartItem.session_id == session_id)
    else:
        raise ValueError("Either user_id or session_id is required")
    
    cart_item = query.first()
    
    if cart_item:
        new_quantity = cart_item.quantity + quantity
        if product.stock_quantity < new_quantity:
            raise ValueError("Insufficient stock")
        cart_item.quantity = new_quantity
    else:
        cart_item = models.CartItem(
            product_id=product_id, 
            quantity=quantity, 
            user_id=user_id,
            session_id=session_id
        )
        db.add(cart_item)

    db.commit()
    db.refresh(cart_item)
    return cart_item

def update_cart_item_quantity(db: Session, cart_item_id: int, quantity: int, user_id: int = None, session_id: str = None):
    """Update cart item quantity."""
    query = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id)
    if user_id:
        query = query.filter(models.CartItem.user_id == user_id)
    elif session_id:
        query = query.filter(models.CartItem.session_id == session_id)
    else:
        raise ValueError("Either user_id or session_id is required")
    
    cart_item = query.first()
    
    if not cart_item:
        raise ValueError("Cart item not found")
    
    product = get_product_by_id(db, cart_item.product_id)
    if quantity > product.stock_quantity:
        raise ValueError("Insufficient stock")
    
    if quantity <= 0:
        db.delete(cart_item)
    else:
        cart_item.quantity = quantity
    
    db.commit()
    return cart_item

def remove_from_cart(db: Session, cart_item_id: int, user_id: int = None, session_id: str = None):
    """Remove item from cart."""
    query = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id)
    if user_id:
        query = query.filter(models.CartItem.user_id == user_id)
    elif session_id:
        query = query.filter(models.CartItem.session_id == session_id)
    else:
        return False
    
    cart_item = query.first()
    
    if cart_item:
        db.delete(cart_item)
        db.commit()
        return True
    return False

def clear_cart(db: Session, user_id: int = None, session_id: str = None):
    """Clear cart."""
    query = db.query(models.CartItem)
    if user_id:
        query = query.filter(models.CartItem.user_id == user_id)
    elif session_id:
        query = query.filter(models.CartItem.session_id == session_id)
    else:
        return
    
    query.delete()
    db.commit()

# ---------------------------------------------------------
# 🧾 CHECKOUT & ORDERS
# ---------------------------------------------------------
def checkout(db: Session, checkout_data, user_id: int = None, session_id: str = None):
    """Convert cart items to orders and clear the cart."""
    cart_items = get_cart_items(db, user_id=user_id, session_id=session_id)
    if not cart_items:
        return {"message": "Cart is empty"}

    orders = []
    total_amount = 0
    
    for item in cart_items:
        product = get_product_by_id(db, item["product_id"])
        if product and product.stock_quantity >= item["quantity"]:
            # Update product stock
            product.stock_quantity -= item["quantity"]
            
            total = product.price * item["quantity"]
            total_amount += total
            
            order = models.Order(
                user_id=user_id,
                product_id=product.id,
                name=product.name,
                price=product.price,
                quantity=item["quantity"],
                total=total,
                customer_name=checkout_data.customer_name,
                customer_email=checkout_data.customer_email,
                shipping_address=checkout_data.shipping_address,
                status="pending"
            )
            db.add(order)
            orders.append(order)

    # Clear cart after checkout
    clear_cart(db, user_id=user_id, session_id=session_id)
    db.commit()
    
    return {
        "message": "Checkout completed successfully", 
        "order_count": len(orders),
        "total_amount": total_amount
    }

def get_orders(db: Session, user_id: int = None):
    """Retrieve orders."""
    query = db.query(models.Order)
    if user_id:
        query = query.filter(models.Order.user_id == user_id)
    return query.order_by(models.Order.created_at.desc()).all()

def get_order_by_id(db: Session, order_id: int):
    """Get a single order by ID."""
    return db.query(models.Order).filter(models.Order.id == order_id).first()

# ---------------------------------------------------------
# 👑 ORDER MANAGEMENT (Admin)
# ---------------------------------------------------------
def update_order_status(db: Session, order_id: int, status: str):
    """Update order status (Admin only)."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")
    
    # Validate status
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    order.status = status
    db.commit()
    db.refresh(order)
    return order

def get_all_orders(db: Session):
    """Get all orders (Admin only)."""
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

# ---------------------------------------------------------
# 🏠 Address Management
# ---------------------------------------------------------
def create_user_address(db: Session, user_id: int, address_data):
    """Create a new address for user."""
    # If this is set as default, remove default from other addresses
    if address_data.is_default:
        db.query(models.UserAddress).filter(
            models.UserAddress.user_id == user_id,
            models.UserAddress.is_default == True
        ).update({"is_default": False})
    
    address = models.UserAddress(
        user_id=user_id,
        **address_data.dict()
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address

def get_user_addresses(db: Session, user_id: int):
    """Get all addresses for a user."""
    return db.query(models.UserAddress).filter(models.UserAddress.user_id == user_id).all()