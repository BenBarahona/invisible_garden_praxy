import os, json, hashlib
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from dotenv import load_dotenv

load_dotenv()

COLL=os.getenv('QDRANT_COLLECTION','medical_chunks')
QURL=os.getenv('QDRANT_URL','http://localhost:6333')
client=QdrantClient(url=QURL)


# one-time create collection
try:
    client.get_collection(COLL)
except:
    client.recreate_collection(COLL, vectors=VectorParams(size=1536, distance=Distance.COSINE))


# SIMPLE encrypt-at-rest for plaintext chunks (dev/demo). In prod use KMS envelope keys.
KEY = bytes.fromhex(os.getenv('INGEST_SYMKEY_HEX','00'*32))


def enc(plaintext: bytes):
    nonce=get_random_bytes(12)
    cipher=AES.new(KEY, AES.MODE_GCM, nonce=nonce)
    ct, tag = cipher.encrypt_and_digest(plaintext)

    return nonce+ct+tag


def hash_hex(b: bytes):
    return hashlib.sha3_256(b).hexdigest()

# Example data
docs=[{"doc_id":"D1","title":"Sepsis Guidelines 2024","text":"..."},
{"doc_id":"D2","title":"AKI Protocol","text":"..."}]

# Fake embeddings; replace with SentenceTransformer("...")
import numpy as np


def fake_embed(s: str):
    np.random.seed(abs(hash(s)) % (10**6))
    v = np.random.rand(1536).astype('float32')
    
    return (v/np.linalg.norm(v)).tolist()

points=[]
for d in docs:
    ct = enc(d['text'].encode())
    payload = {
        'doc_id': d['doc_id'],
        'title': d['title'],
        'ciphertext_hash': hash_hex(ct),
        'redacted_excerpt': f"[{d['doc_id']}] {d['title']} (excerpt)"
    }
    points.append(PointStruct(id=d['doc_id'], vector=fake_embed(d['text']), payload=payload))


client.upsert(collection_name=COLL, points=points)
print("ingested", len(points))