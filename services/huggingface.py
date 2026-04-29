import httpx
import base64
import os
import time
import asyncio

HF_API_TOKEN = os.environ.get("HF_API_TOKEN")

# Model: SDXL Turbo — fast and currently supported on free Inference API
HF_MODEL = "stabilityai/sdxl-turbo"


# Max wait time for model to load (HF sometimes cold-starts)
MAX_WAIT_SECONDS = 60
POLL_INTERVAL = 5

async def generate(prompt: str, model_id: str = None, provider: str = "hf-inference") -> str:
    if not HF_API_TOKEN:
        raise Exception("HF_API_TOKEN is missing")
    
    token = HF_API_TOKEN.strip()
    target_model = (model_id if model_id else HF_MODEL).strip("/")
    # Construct URL using the specified provider (hf-inference, fal-ai, together, etc.)
    url = f"https://router.huggingface.co/{provider}/models/{target_model}/"


    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Wait-For-Model": "true",
        "X-Use-Cache": "true"
    }

    # Parameters for different model types
    steps = 4
    guidance = 1.5
    if "schnell" in target_model.lower():
        guidance = 0.0 # Schnell works best with 0 guidance
    elif "turbo" in target_model.lower():
        guidance = 1.0

    payload = {
        "inputs": prompt,
        "parameters": {
            "num_inference_steps": steps,
            "guidance_scale": guidance,
        }
    }

    elapsed = 0
    async with httpx.AsyncClient(timeout=30.0) as client:
        while elapsed < MAX_WAIT_SECONDS:
            try:
                response = await client.post(url, headers=headers, json=payload)
            except Exception as e:
                raise Exception(f"Connection error: {str(e)}")

            # Model still loading — wait and retry
            if response.status_code == 503:
                try:
                    data = response.json()
                    estimated = data.get("estimated_time", 2)
                except:
                    estimated = 2
                wait = min(float(estimated), 2)
                await asyncio.sleep(wait)
                elapsed += wait
                continue

            if response.status_code != 200:
                try:
                    err_data = response.json()
                    error_msg = err_data.get("error", response.text)
                except:
                    error_msg = response.text
                raise Exception(f"HF Error {response.status_code}: {error_msg}")

            if not response.content:
                raise Exception("Empty response from HF")

            return base64.b64encode(response.content).decode("utf-8")

    raise Exception("Hugging Face model did not become ready in time")
