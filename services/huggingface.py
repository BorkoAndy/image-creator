import httpx
import base64
import os
import time
import asyncio

HF_API_TOKEN = os.environ.get("HF_API_TOKEN")

# Model: SDXL — best free quality on HF
HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

# Max wait time for model to load (HF sometimes cold-starts)
MAX_WAIT_SECONDS = 60
POLL_INTERVAL = 5

async def generate(prompt: str, model_id: str = None) -> str:
    if not HF_API_TOKEN:
        raise Exception("HF_API_TOKEN is missing")
    
    token = HF_API_TOKEN.strip()
    target_model = (model_id if model_id else HF_MODEL).strip("/")
    # Using the newer endpoint format which is often more reliable
    url = f"https://huggingface.co/api/models/{target_model}/inference"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": prompt,
        "options": {"wait_for_model": True}
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        try:
            err = response.json().get("error", response.text)
        except:
            err = response.text
        raise Exception(f"HF Error {response.status_code}: {err}")

    if not response.content:
        raise Exception("Empty response from HF")

    return base64.b64encode(response.content).decode("utf-8")

    raise Exception("Hugging Face model did not become ready in time")
