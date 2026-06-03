from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Base

import os
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./txeka.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL) 
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
