from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import asyncio

# Add parent dir to path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services import cloudflare, huggingface

API_SECRET = os.environ.get("APP_PASSWORD", os.environ.get("API_SECRET", "Kx9#mP2vN$qL8@wR5yT!"))


def run_async(coro):
    """Run async coroutine in sync context (Vercel serverless)."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self._send_cors_headers(200)
        self.end_headers()

    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
        except Exception:
            return self._error(400, "Invalid JSON body")

        # Auth check
        provided_key = data.get("api_key", "")
        if provided_key != API_SECRET:
            return self._error(401, "Unauthorized — invalid API key")

        # Validate prompt
        prompt = data.get("prompt", "").strip()
        if not prompt:
            return self._error(400, "Missing or empty prompt")

        if len(prompt) > 500:
            return self._error(400, "Prompt too long (max 500 characters)")

        requested_model = data.get("model", "auto")
        image_base64 = None
        model_used = None
        error_cf = None
        error_hf = None

        # Model mapping for specific testing
        MODEL_MAP = {
            "cf-flux": ("cloudflare", "@cf/black-forest-labs/flux-1-schnell"),
            "cf-phoenix": ("cloudflare", "@cf/leonardo/phoenix-1.0"),
            "hf-sd3": ("huggingface", "stabilityai/stable-diffusion-3.5-large-turbo"),
            "hf-dreamshaper": ("huggingface", "Lykon/dreamshaper-xl-v2-turbo"),
        }

        # Logic for "Auto" (Fallback)
        if requested_model == "auto":
            try:
                image_base64 = run_async(cloudflare.generate(prompt))
                model_used = "cloudflare"
            except Exception as e:
                error_cf = str(e)

            if image_base64 is None:
                try:
                    image_base64 = run_async(huggingface.generate(prompt))
                    model_used = "huggingface"
                except Exception as e:
                    error_hf = str(e)
        
        # Logic for specific Cloudflare platform default
        elif requested_model == "cloudflare":
            try:
                image_base64 = run_async(cloudflare.generate(prompt))
                model_used = "cloudflare"
            except Exception as e:
                error_cf = str(e)
        
        # Logic for specific Hugging Face platform default
        elif requested_model == "huggingface":
            try:
                image_base64 = run_async(huggingface.generate(prompt))
                model_used = "huggingface"
            except Exception as e:
                error_hf = str(e)

        # Logic for specific mapped models
        elif requested_model in MODEL_MAP:
            platform, model_id = MODEL_MAP[requested_model]
            try:
                if platform == "cloudflare":
                    image_base64 = run_async(cloudflare.generate(prompt, model_id))
                    model_used = f"cloudflare ({requested_model})"
                else:
                    image_base64 = run_async(huggingface.generate(prompt, model_id))
                    model_used = f"huggingface ({requested_model})"
            except Exception as e:
                if platform == "cloudflare": error_cf = str(e)
                else: error_hf = str(e)

        if image_base64 is None:
            err_details = {
                "cloudflare_error": error_cf,
                "huggingface_error": error_hf,
            }
            
            # Match original error message for default/auto requests
            error_msg = "Both generation services failed" if requested_model == "auto" else f"Generation failed via {requested_model}"
            return self._error(502, error_msg, err_details)

        # Success
        self._send_cors_headers(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "model_used": model_used,
            "image": image_base64,          # base64 PNG
            "mime_type": "image/png",
            "prompt": prompt,
        }).encode())

    def _send_cors_headers(self, status_code: int):
        self.send_response(status_code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _error(self, code: int, message: str, extra: dict = None):
        self._send_cors_headers(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        payload = {"status": "error", "message": message}
        if extra:
            payload.update(extra)
        self.wfile.write(json.dumps(payload).encode())
