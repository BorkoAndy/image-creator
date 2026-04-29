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
    if not HF_API_TOKEN:
        raise Exception("Hugging Face API token not configured")

    target_model = model_id if model_id else HF_MODEL
    url = f"https://api-inference.huggingface.co/models/{target_model}"

    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json",
    }

    # Default parameters
    steps = 25
    guidance = 7.5
    
    # Adjust for fast models
    if any(m in target_model.lower() for m in ["turbo", "schnell", "lightning"]):
        steps = 4
        guidance = 0.0 if "schnell" in target_model.lower() else 1.5

    payload = {
        "inputs": prompt,
        "options": {
            "wait_for_model": True,
            "use_cache": True,
        },
        "parameters": {
            "num_inference_steps": steps,
            "guidance_scale": guidance,
        }
    }

    elapsed = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        while elapsed < MAX_WAIT_SECONDS:
            response = await client.post(url, headers=headers, json=payload)

            # Model still loading — wait and retry
            if response.status_code == 503:
                try:
                    data = response.json()
                    estimated = data.get("estimated_time", POLL_INTERVAL)
                except:
                    estimated = POLL_INTERVAL
                wait = min(float(estimated), POLL_INTERVAL)
                await asyncio.sleep(wait)
                elapsed += wait
                continue

            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", response.text)
                except:
                    error_msg = response.text
                raise Exception(f"Hugging Face API error {response.status_code}: {error_msg}")

            image_bytes = response.content
            if not image_bytes:
                raise Exception("Hugging Face returned empty image")

            return base64.b64encode(image_bytes).decode("utf-8")

    raise Exception("Hugging Face model did not become ready in time")
