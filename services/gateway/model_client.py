""" import httpx, os


BASE = os.getenv('VLLM_BASE_URL','http://localhost:8000/v1')


async def chat(prompt: str, system: str = "You are a medical assistant.") -> str:
    async with httpx.AsyncClient(timeout=60) as s:
        r = await s.post(f"{BASE}/chat/completions", json={
            "model": os.getenv('MODEL_ID','llama3'),
            "messages": [
                {"role":"system","content":system},
                {"role":"user","content":prompt}
            ],
            "temperature": 0.2,
        })
        r.raise_for_status()
    
    return r.json()["choices"][0]["message"]["content"].strip()
"""