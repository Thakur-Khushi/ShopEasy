from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import hashlib

MYSQL_USER = "root"
MYSQL_PASSWORD = "010305"
MYSQL_HOST = "localhost"
MYSQL_DB = "shopping_system"

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"

engine = create_engine(DATABASE_URL, echo=True, future=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Simple password hashing without bcrypt
def verify_password(plain_password, hashed_password):
    return get_password_hash(plain_password) == hashed_password

def get_password_hash(password):
    # Simple SHA256 hashing for demo purposes
    return hashlib.sha256(password.encode()).hexdigest()