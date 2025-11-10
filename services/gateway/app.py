import os, time
from xmlrpc import client
from fastapi import FastAPI
from together import Together
from pydantic import BaseModel

from dotenv import load_dotenv
## from .rag import search, retrieved_docs_hash
## from .model_client import chat
## from web3 import Web3

load_dotenv()


app = FastAPI()
""" w3 = Web3(Web3.HTTPProvider(os.getenv('RPC_URL')))
AUDIT_CONTRACT = Web3.to_checksum_address(os.getenv('AUDIT_CONTRACT'))
AUDITOR_PK = bytes.fromhex(os.getenv('AUDITOR_PK_HEX'))
POLICY = os.getenv('POLICY_VERSION', 'med-policy-v1')
MODEL_ID = os.getenv('MODEL_ID','llama3') """

class UserPrompt(BaseModel):
    question: str


@app.get("/")
async def get_query():
    return {"message": "Hello World"}


@app.post("/ask_doctor_feedback")
async def ask_doctor_feedback(prompt: UserPrompt):
    client = Together(
        api_key=os.environ.get("TOGETHER_API_KEY"),
    )

    response = client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages=[
            {"role": "system", "content": "You are an expert doctor on Cystitis in Non-Pregnant Adult Women."},
            {"role": "user", "content": prompt.question},
        ]
    )

    return response.choices[0].message.content


"""@app.post("/")
async def handle(q: Query):    
    # (TODO) Submit to audit contract on-chain

    return {
        'answer': answer,
        'audit': {
        'record_hash': '0x'+rec_hash.hex(),
        'tx': txh.hex(),
        'nonce': '0x'+nonce.hex(),
        'timestamp': ts
        },
        'retrieval': [{'id': p.id, 'score': p.score} for p in points]
    } """