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
    """
    Generate image via Hugging Face Inference API.
    Handles model loading/queued states automatically.
    Returns base64-encoded PNG string.
    Raises Exception on failure.
    """
    # Sanitize token and construct clean URL
    token = HF_API_TOKEN.strip() if HF_API_TOKEN else ""
    clean_model_id = (model_id if model_id else HF_MODEL).strip("/")
    url = f"https://api-inference.huggingface.co/models/{clean_model_id}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Wait-For-Model": "true",
        "X-Use-Cache": "true"
    }

    # Force 4 steps for speed (to beat Vercel's 10s timeout)
    steps = 4
    guidance = 0.0 if "schnell" in clean_model_id.lower() else 1.5

    payload = {
        "inputs": prompt,
        "parameters": {
            "num_inference_steps": steps,
            "guidance_scale": guidance,
        }
    }

    elapsed = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        while elapsed < MAX_WAIT_SECONDS:
            try:
                response = await client.post(url, headers=headers, json=payload)
            except Exception as e:
                raise Exception(f"Connection error: {str(e)}")

            # Model still loading — wait and retry
            if response.status_code == 503:
                try:
                    data = response.json()
                    estimated = data.get("estimated_time", 2) # shorter wait
                except:
                    estimated = 2
                wait = min(float(estimated), 2)
                await asyncio.sleep(wait)
                elapsed += wait
                continue

            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", response.text)
                except:
                    error_msg = response.text
                raise Exception(f"HF Error {response.status_code}: {error_msg}")

            image_bytes = response.content
            if not image_bytes:
                raise Exception("Hugging Face returned empty image")

            return base64.b64encode(image_bytes).decode("utf-8")

    raise Exception("Hugging Face model did not become ready in time")
