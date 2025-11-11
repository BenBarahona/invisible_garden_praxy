from sqlalchemy.ext.asyncio import AsyncSession

from db.tx import get_or_create_user, get_messages_by_user


async def build_conversation(session: AsyncSession, external_id: str) -> list[dict]:
    user = await get_or_create_user(session=session, external_id=external_id)
    messages = await get_messages_by_user(session=session, user_id=user.id)
    
    conversation = []
    for msg in messages:
        conversation.append({"role": msg.role, "content": msg.content})

    return conversation