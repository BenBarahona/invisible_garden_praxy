import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserPrompt(BaseModel):
    user_id: str
    question: str
    model: str = "t_tuned"

AVAILABLE_MODELS = {
    "default": "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "c-tuned": "jdestephen07_1f06/Meta-Llama-3.1-8B-Instruct-Reference-test_conv_8b-4fd4f33d",
    "t_tuned": "jdestephen07_1f06/Meta-Llama-3.1-8B-Instruct-Reference-test_token_8b-14cdef80",
} 

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

    model_code = prompt.model
    model_name = AVAILABLE_MODELS.get(model_code, AVAILABLE_MODELS["t_tuned"])
    user_id, conversation = await build_conversation(session=db, external_id=prompt.user_id, model_code=model_code)
    conversation.append({"role": "user", "content": prompt.question})
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are an expert doctor on Sore Throat in Adults."},
            *conversation
        ]
    )

    await add_message(db, user_id, {"role": "user", "content": prompt.question}, model_code=model_code)
    await add_message(db, user_id, {"role": "assistant", "content": response.choices[0].message.content}, model_code=model_code)

    conversation.append({"role": "assistant", "content": response.choices[0].message.content})
    # return response.choices[0].message.content

    return conversation


@app.get("/get_chat_by_user/{user_id}/{model_code}")
async def get_chat_by_user(user_id: str, model_code: str, db: Annotated[AsyncSession, Depends(get_session)]):
    messages = await get_messages_by_external_user(session=db, external_id=user_id, model_code=model_code)

    return messages