<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Image Generator</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;900&display=swap');

    :root {
      --bg: #0e0e0e;
      --surface: #171717;
      --border: #2a2a2a;
      --accent: #c8f04a;
      --accent-dim: #9ab835;
      --text: #e8e8e8;
      --muted: #666;
      --danger: #ff4d4d;
      --success: #4dff91;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px;
    }

    header {
      width: 100%;
      max-width: 720px;
      margin-bottom: 48px;
    }

    header h1 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.02em;
    }

    header h1 span { color: var(--accent); }

    header p {
      margin-top: 10px;
      font-size: 0.78rem;
      color: var(--muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 28px;
      width: 100%;
      max-width: 720px;
      margin-bottom: 24px;
    }

    label {
      display: block;
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }

    textarea {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      color: var(--text);
      font-family: 'DM Mono', monospace;
      font-size: 0.88rem;
      padding: 12px 14px;
      resize: vertical;
      min-height: 90px;
      transition: border-color 0.2s;
      outline: none;
    }

    textarea:focus { border-color: var(--accent); }

    .char-count {
      text-align: right;
      font-size: 0.68rem;
      color: var(--muted);
      margin-top: 4px;
    }

    .char-count.warn { color: var(--danger); }

    button {
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      border: none;
      border-radius: 3px;
      padding: 12px 24px;
      transition: opacity 0.15s, transform 0.1s;
    }

    button:active { transform: scale(0.98); }
    button:disabled { opacity: 0.4; cursor: not-allowed; }

    #btn-generate {
      background: var(--accent);
      color: #0e0e0e;
      font-weight: 500;
      width: 100%;
      margin-top: 18px;
    }

    #btn-generate:hover:not(:disabled) { background: var(--accent-dim); }

    .status-bar {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 14px;
      min-height: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--muted);
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }

    /* Result area */
    #result-area { display: none; }

    #result-area .model-badge {
      font-size: 0.68rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 14px;
    }

    #result-area .model-badge span {
      color: var(--accent);
      font-weight: 500;
    }

    #preview-img {
      width: 100%;
      border-radius: 3px;
      display: block;
      border: 1px solid var(--border);
    }

    .action-row {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    #btn-approve {
      background: var(--success);
      color: #0e0e0e;
      flex: 1;
    }

    #btn-reject {
      background: transparent;
      color: var(--danger);
      border: 1px solid var(--danger);
      flex: 1;
    }

    #btn-approve:hover:not(:disabled) { opacity: 0.85; }
    #btn-reject:hover:not(:disabled) { background: rgba(255,77,77,0.1); }

    .save-status {
      margin-top: 12px;
      font-size: 0.75rem;
      min-height: 18px;
    }

    .save-status.ok { color: var(--success); }
    .save-status.err { color: var(--danger); }

    /* Error box */
    #error-box {
      display: none;
      background: rgba(255,77,77,0.08);
      border: 1px solid var(--danger);
      border-radius: 3px;
      padding: 12px 16px;
      font-size: 0.78rem;
      color: var(--danger);
      margin-top: 14px;
      word-break: break-word;
    }
  </style>
</head>
<body>

<header>
  <h1>Image<span>.</span>Gen</h1>
  <p>Cloudflare Workers AI · Hugging Face fallback</p>
</header>

<div class="card">
  <label for="prompt">Prompt</label>
  <textarea id="prompt" placeholder="A cinematic photo of a fox in a misty forest at golden hour..." maxlength="500"></textarea>
  <div class="char-count"><span id="char-num">0</span> / 500</div>

  <button id="btn-generate">Generate Image</button>

  <div class="status-bar" id="status-bar"></div>
  <div id="error-box"></div>
</div>

<div class="card" id="result-area">
  <div class="model-badge">Generated via <span id="model-label">—</span></div>
  <img id="preview-img" src="" alt="Generated image preview" />
  <div class="action-row">
    <button id="btn-approve">✓ Approve &amp; Save</button>
    <button id="btn-reject">✕ Reject</button>
  </div>
  <div class="save-status" id="save-status"></div>
</div>

<script>
  // ── Config ────────────────────────────────────────────────────────────────
  const VERCEL_API   = 'https://YOUR-PROJECT.vercel.app/api/generate'; // ← update this
  const API_KEY      = 'Kx9#mP2vN$qL8@wR5yT!';                               // ← updated

  // ── State ─────────────────────────────────────────────────────────────────
  let currentBase64  = null;
  let currentPrompt  = null;

  // ── Elements ──────────────────────────────────────────────────────────────
  const promptEl     = document.getElementById('prompt');
  const charNum      = document.getElementById('char-num');
  const btnGenerate  = document.getElementById('btn-generate');
  const statusBar    = document.getElementById('status-bar');
  const errorBox     = document.getElementById('error-box');
  const resultArea   = document.getElementById('result-area');
  const previewImg   = document.getElementById('preview-img');
  const modelLabel   = document.getElementById('model-label');
  const btnApprove   = document.getElementById('btn-approve');
  const btnReject    = document.getElementById('btn-reject');
  const saveStatus   = document.getElementById('save-status');

  // ── Char counter ──────────────────────────────────────────────────────────
  promptEl.addEventListener('input', () => {
    const len = promptEl.value.length;
    charNum.textContent = len;
    charNum.parentElement.classList.toggle('warn', len > 450);
  });

  // ── Generate ──────────────────────────────────────────────────────────────
  btnGenerate.addEventListener('click', async () => {
    const prompt = promptEl.value.trim();
    if (!prompt) return setStatus('Please enter a prompt.', true);

    // Reset UI
    setError('');
    setStatus('', false);
    resultArea.style.display = 'none';
    saveStatus.textContent = '';
    currentBase64 = null;
    btnGenerate.disabled = true;

    setStatus('Connecting to Cloudflare…', false, true);

    try {
      const res = await fetch(VERCEL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, api_key: API_KEY }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.message || `Server error ${res.status}`);
      }

      currentBase64 = data.image;
      currentPrompt = prompt;

      previewImg.src = `data:${data.mime_type};base64,${data.image}`;
      modelLabel.textContent = data.model_used === 'cloudflare'
        ? 'Cloudflare Workers AI (SDXL Lightning)'
        : 'Hugging Face (SDXL)';

      resultArea.style.display = 'block';
      setStatus('Done. Review the image below.', false);

    } catch (err) {
      setError(err.message);
      setStatus('Generation failed.', true);
    } finally {
      btnGenerate.disabled = false;
    }
  });

  // ── Approve → send to save.php ─────────────────────────────────────────
  btnApprove.addEventListener('click', async () => {
    if (!currentBase64) return;

    btnApprove.disabled = true;
    btnReject.disabled  = true;
    saveStatus.className = 'save-status';
    saveStatus.textContent = 'Saving…';

    try {
      const res = await fetch('save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentBase64,
          prompt: currentPrompt,
        }),
      });

      const data = await res.json();

      if (data.status === 'ok') {
        saveStatus.className = 'save-status ok';
        saveStatus.textContent = `✓ Saved: ${data.filename}`;
      } else {
        throw new Error(data.message || 'Save failed');
      }
    } catch (err) {
      saveStatus.className = 'save-status err';
      saveStatus.textContent = `✕ ${err.message}`;
    } finally {
      btnApprove.disabled = false;
      btnReject.disabled  = false;
    }
  });

  // ── Reject → hide result ───────────────────────────────────────────────
  btnReject.addEventListener('click', () => {
    resultArea.style.display = 'none';
    currentBase64 = null;
    saveStatus.textContent = '';
    setStatus('Image rejected. Enter a new prompt.', false);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setStatus(msg, isErr, loading = false) {
    statusBar.innerHTML = msg
      ? (loading ? `<div class="dot"></div>${msg}` : msg)
      : '';
    statusBar.style.color = isErr ? 'var(--danger)' : 'var(--muted)';
  }

  function setError(msg) {
    errorBox.style.display = msg ? 'block' : 'none';
    errorBox.textContent = msg;
  }
</script>

</body>
</html>
