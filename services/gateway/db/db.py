# db.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession


engine = create_async_engine("postgresql+asyncpg://chat:chat123456@postgres:5432/chats_db", echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    # session = SessionLocal()
    async with SessionLocal() as session:
        yield session
