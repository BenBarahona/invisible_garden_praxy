from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.tx import get_or_create_user
from db.models import Message, User


async def build_conversation(session: AsyncSession, external_id: str) -> list[dict]:
    user = await get_or_create_user(session=session, external_id=external_id)
    messages = await get_messages_by_user(session=session, user_id=user.id)
    
    conversation = []
    for msg in messages:
        conversation.append({"role": msg.role, "content": msg.content})

    return user.id, conversation


async def get_messages_by_user(session: AsyncSession, user_id: int):
    res = await session.execute(
        select(Message).where(Message.user_id == user_id).order_by(Message.created_at)
    )
    messages = res.scalars().all()
    
    return messages


async def get_messages_by_external_user(session: AsyncSession, external_id: str):
    res = await session.execute(
        select(Message).join(User).where(User.external_id == external_id).order_by(Message.created_at)
    )
    messages = res.scalars().all()

    return messages