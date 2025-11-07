""" from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
import numpy as np, os, hashlib


COLL = os.getenv('QDRANT_COLLECTION','medical_chunks')
QURL = os.getenv('QDRANT_URL','http://localhost:6333')


# vectors are plaintext; documents are ciphertext (AES-GCM) if you enable it.
client = QdrantClient(url=QURL)


def _hash_doc(payload: dict) -> bytes:
    # hash plaintext title + ciphertext body pointer
    h = hashlib.sha3_256()
    h.update((payload.get('doc_id','') + '|' + payload.get('title','')).encode())
    h.update(bytes.fromhex(payload.get('ciphertext_hash','0'*64)))
    return h.digest()


def retrieved_docs_hash(points):
    # concatenate top‑k document hashes deterministically
    hashes = sorted([_hash_doc(p.payload) for p in points], key=lambda b:b)
    from eth_utils import keccak
    from functools import reduce

    concat = b''.join(hashes)
    return keccak(concat)


def search(embedding: np.ndarray, top_k=5):
    r = client.search(collection_name=COLL, query_vector=embedding.tolist(), limit=top_k)
    return r

"""    