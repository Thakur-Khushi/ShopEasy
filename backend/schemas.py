from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    email: str
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Product Schemas (Simplified)
class ProductBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    # Remove fields that don't exist in DB
    # image_url: Optional[str] = None
    # category: Optional[str] = None
    # stock_quantity: int = 10
    # is_active: bool = True
    # created_at: datetime

    class Config:
        from_attributes = True

# Cart Schemas
class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

# Address Schemas
class AddressBase(BaseModel):
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str = "USA"
    is_default: bool = False

class AddressResponse(AddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    product_id: int
    quantity: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    shipping_address: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    user_id: Optional[int]
    product_id: int
    name: str
    price: float
    quantity: int
    total: float
    customer_name: Optional[str]
    customer_email: Optional[str]
    shipping_address: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Checkout Schema
class CheckoutRequest(BaseModel):
    customer_name: str
    customer_email: str
    shipping_address: str
    payment_method: str = "card"