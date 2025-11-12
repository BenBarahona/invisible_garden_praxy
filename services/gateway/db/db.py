# db.py
import os

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession


db = os.environ.get("POSTGRES_DB")
user = os.environ.get("POSTGRES_USER")
password = os.environ.get("POSTGRES_PASSWORD")
port = os.environ.get("POSTGRES_PORT", "5432")

engine = create_async_engine(f"postgresql+asyncpg://{user}:{password}@postgres:{port}/{db}", echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    # session = SessionLocal()
    async with SessionLocal() as session:
        yield session
