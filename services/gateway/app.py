import os, time
from fastapi import FastAPI, HTTPException
## from pydantic import BaseModel
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

""" class Query(BaseModel):
    presentation_token: str
    query: str
    embedding: list[float] """

@app.get("/")
async def get_query():
    return {"message": "Hello World"}

"""@app.post("/")
async def handle(q: Query):
    # (TODO) Verify doctor's/nurse's proof or auth token

    # Retrieve
    points = search(embedding=q.embedding, top_k=5)
    docs_hash = retrieved_docs_hash(points) # bytes32

    # Compose user prompt with context
    ctx = "\n\n".join([p.payload.get('redacted_excerpt','') for p in points])
    prompt = f"Context:\n{ctx}\n\nQuestion:{q.query}\nAnswer with citations to [D1..Dk]."


    # Ask model
    answer = await chat(prompt)

    # 5) Attestation (dev-mode placeholder). In prod, attach Nitro attestation document bytes
    att = b"DEV_ATTESTATION"


    # 6) Hashes -> record hash
    ts = int(time.time())
    nonce = rand32()
    rec_hash = compute_record_hash(
        MODEL_ID,
        prompt.encode(),
        answer.encode(),
        docs_hash,
        k256(att),
        os.getenv('POLICY_VERSION','med-policy-v1'),
        ts,
        nonce
    )


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