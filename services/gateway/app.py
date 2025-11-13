import os
from fastapi import FastAPI, Depends
from together import Together
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Annotated
from controller import build_conversation, get_messages_by_external_user

from db.models import Base
from db.db import engine, get_session
from db.tx import add_message


from dotenv import load_dotenv
## from .rag import search, retrieved_docs_hash
## from .model_client import chat
## from web3 import Web3

load_dotenv()


app = FastAPI()

class UserPrompt(BaseModel):
    user_id: str
    question: str


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 


@app.get("/")
async def get_query():
    return {"message": "Hello World"}


@app.post("/feedback")
async def feedback(prompt: UserPrompt, db: Annotated[AsyncSession, Depends(get_session)]):
    client = Together(
        api_key=os.environ.get("TOGETHER_API_KEY"),
    )
    
    user_id, conversation = await build_conversation(session=db, external_id=prompt.user_id)
    conversation.append({"role": "user", "content": prompt.question})

    # meta-llama/Meta-Llama-3.1-8B-Instruct-Reference
    response = client.chat.completions.create(
        model="jdestephen07_1f06/Meta-Llama-3.1-8B-Instruct-Reference-test_conv_8b-4fd4f33d",
        messages=[
            {"role": "system", "content": "You are an expert doctor on Sore Throat in Adults."},
            *conversation
        ]
    )

    await add_message(db, user_id, {"role": "user", "content": prompt.question})
    await add_message(db, user_id, {"role": "assistant", "content": response.choices[0].message.content})

    conversation.append({"role": "assistant", "content": response.choices[0].message.content})
    # return response.choices[0].message.content

    return conversation


@app.post("/get_chat_by_user/{user_id}")
async def get_chat_by_user(user_id: str, db: Annotated[AsyncSession, Depends(get_session)]):
    messages = await get_messages_by_external_user(session=db, external_id=user_id)

    return messages