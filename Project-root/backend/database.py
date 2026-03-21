from sqlmodel import SQLModel, create_engine, Session
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    APP_ENV: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5500"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_engine():
    settings = get_settings()
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")

    if is_sqlite:
        # SQLite — no connection pool needed, enable WAL for better concurrency
        return create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=settings.APP_ENV == "development",
        )
    else:
        # PostgreSQL — full connection pool
        return create_engine(
            settings.DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_recycle=1800,
            pool_pre_ping=True,
            echo=settings.APP_ENV == "development",
        )


engine = get_engine()


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
