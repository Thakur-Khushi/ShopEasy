from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from passlib.context import CryptContext

MYSQL_USER = "root"
MYSQL_PASSWORD = "010305"
MYSQL_HOST = "localhost"
MYSQL_DB = "shopping_system"

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"

engine = create_engine(DATABASE_URL, echo=True, future=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()

# Password hashing with fallback
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Test bcrypt
    pwd_context.hash("test")
except:
    # Fallback to SHA256 if bcrypt fails
    pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
    print("⚠️  Using SHA256 for password hashing (install bcrypt for better security)")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)