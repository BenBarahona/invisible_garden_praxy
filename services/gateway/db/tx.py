from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Message, User


async def get_or_create_user(session: AsyncSession, external_id: str):
    res = await session.execute(
        select(User).where(User.external_id == external_id)
    )

    user = res.scalar_one_or_none()
    if user:
        return user
    
    user = User(external_id=external_id)
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as ex:
        print("IntegrityError:", ex)
        await session.rollback()
        res = await session.execute(
            select(User).where(User.external_id == external_id)
        )
        user = res.scalar_one()
        return user

    await session.refresh(user)

    return user


async def add_message(session: AsyncSession, user_id: int, message: dict, model_code: str = "t_tuned"):
    msg = Message(user_id=user_id, model_code=model_code, role=message["role"], content=message["content"])
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    
    return {"id": msg.id}
