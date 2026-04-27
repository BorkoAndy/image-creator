/**
 * Contao AI Image Generator - V4.0
 * Injects a premium AI image generation tool into the Contao backend.
 */

(function () {
    'use strict';

    const VERSION = '4.0';
    const VERCEL_API = 'https://andy-image-creator.vercel.app/api/generate';
    const API_KEY = 'Kx9#mP2vN$qL8@wR5yT!';
    
    // Dynamic Save URL that points back to the current Contao backend page
    const SAVE_URL = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'action=ai_save_image';

    console.log(`Contao AI Image Generator Loaded (V${VERSION})`);

    let retryCount = 0;
    const maxRetries = 40;
    let observer = null;

    // Start injection attempt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startRetrying);
    } else {
        startRetrying();
    }

    function startRetrying() {
        tryInject();
    }

    function tryInject() {
        if (injectAiButton()) {
            startRemovalWatcher();
            return;
        }

        retryCount++;
        if (retryCount >= maxRetries) return;

        const delay = Math.min(100 * retryCount, 1000);
        setTimeout(tryInject, delay);
    }

    // ─── Injection Logic ───────────────────────────────────────────────────────

    function injectAiButton() {
        const target = document.getElementById('ft_singleSRC');
        if (!target) return false;

        if (document.getElementById('ai_generate_image_btn')) return true;

        const aiButton = document.createElement('a');
        aiButton.href = '#';
        aiButton.id = 'ai_generate_image_btn';
        aiButton.className = 'tl_submit';
        aiButton.innerHTML = '<span style="margin-right:6px;">✨</span> Generate AI Image';
        aiButton.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a, #333) !important;
            color: #c8f04a !important;
            border: 1px solid #c8f04a !important;
            margin-left: 10px;
            border-radius: 4px;
            padding: 4px 12px;
            font-weight: 600;
            transition: all 0.2s ease;
            text-shadow: 0 0 10px rgba(200, 240, 74, 0.3);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
        `;

        aiButton.onmouseover = () => {
            aiButton.style.background = '#c8f04a !important';
            aiButton.style.color = '#000 !important';
        };
        aiButton.onmouseout = () => {
            aiButton.style.background = 'linear-gradient(135deg, #1a1a1a, #333) !important';
            aiButton.style.color = '#c8f04a !important';
        };

        aiButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showModal();
        });

        target.parentNode.insertBefore(aiButton, target.nextSibling);
        return true;
    }

    function startRemovalWatcher() {
        if (observer) return;
        observer = new MutationObserver(function () {
            if (!document.getElementById('ai_generate_image_btn')) {
                observer.disconnect();
                observer = null;
                retryCount = 0;
                tryInject();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ─── Premium Modal UI ──────────────────────────────────────────────────────

    function showModal() {
        if (document.getElementById('ai-image-modal-root')) return;

        const root = document.createElement('div');
        root.id = 'ai-image-modal-root';
        root.style.cssText = `
            position: fixed; inset: 0; z-index: 100000;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            opacity: 0; transition: opacity 0.3s ease;
        `;

        root.innerHTML = `
            <div id="ai-modal-container" style="
                background: #121212; color: #e8e8e8; width: 90%; max-width: 680px;
                border-radius: 12px; border: 1px solid #2a2a2a; overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                transform: scale(0.9) translateY(20px); transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
                <!-- Header -->
                <div style="background: #1a1a1a; padding: 20px 24px; border-bottom: 1px solid #2a2a2a; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">✨</span>
                        <h2 style="margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em;">AI Image Generator</h2>
                    </div>
                    <button id="ai-modal-close" style="background: none; border: none; color: #666; font-size: 28px; cursor: pointer; padding: 4px; line-height: 1;">&times;</button>
                </div>

                <!-- Content Area -->
                <div id="ai-modal-content" style="padding: 32px;">
                    <div id="ai-input-view">
                        <label style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 12px;">Image Prompt</label>
                        <textarea id="ai-prompt-input" placeholder="A cinematic photo of a forest at sunrise, photorealistic, 8k..." style="
                            width: 100%; background: #0a0a0a; border: 1px solid #333; border-radius: 8px;
                            color: #fff; padding: 16px; font-size: 15px; min-height: 120px; outline: none;
                            transition: border-color 0.2s ease; box-sizing: border-box;
                        "></textarea>
                        <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                            <button id="ai-btn-generate" style="
                                background: #c8f04a; color: #000; border: none; padding: 12px 32px;
                                border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
                            ">Generate Magic</button>
                        </div>
                    </div>
                    
                    <div id="ai-loading-view" style="display: none; text-align: center; padding: 40px 0;">
                        <div class="ai-spinner" style="
                            width: 48px; height: 48px; border: 3px solid rgba(200, 240, 74, 0.1);
                            border-top-color: #c8f04a; border-radius: 50%; animation: ai-spin 1s linear infinite;
                            margin: 0 auto 24px;
                        "></div>
                        <h3 style="margin:0; font-size: 18px; color: #fff;">Creating your masterpiece...</h3>
                        <p style="color: #666; font-size: 14px; margin-top: 8px;">Connecting to Cloudflare Workers AI</p>
                    </div>

                    <div id="ai-result-view" style="display: none;">
                        <div style="border-radius: 8px; overflow: hidden; border: 1px solid #333; background: #000; margin-bottom: 24px;">
                            <img id="ai-preview-img" style="width: 100%; display: block;" />
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: space-between; align-items: center;">
                            <span id="ai-model-badge" style="font-size: 11px; color: #666; text-transform: uppercase;"></span>
                            <div style="display: flex; gap: 12px;">
                                <button id="ai-btn-repeat" style="background: transparent; border: 1px solid #444; color: #aaa; padding: 10px 20px; border-radius: 6px; cursor: pointer;">🔄 Repeat</button>
                                <button id="ai-btn-approve" style="background: #c8f04a; color: #000; border: none; padding: 10px 32px; border-radius: 6px; font-weight: 600; cursor: pointer;">✅ Use Image</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="ai-error-box" style="display: none; background: rgba(255, 77, 77, 0.1); border-top: 1px solid rgba(255, 77, 77, 0.2); padding: 16px 24px; color: #ff4d4d; font-size: 13px;"></div>
            </div>
            <style>
                @keyframes ai-spin { to { transform: rotate(360deg); } }
                #ai-prompt-input:focus { border-color: #c8f04a; }
                #ai-btn-generate:hover { background: #d4f471; transform: translateY(-1px); }
                #ai-btn-repeat:hover { border-color: #666; color: #fff; }
                #ai-btn-approve:hover { background: #d4f471; transform: translateY(-1px); }
            </style>
        `;

        document.body.appendChild(root);

        // Animate in
        requestAnimationFrame(() => {
            root.style.opacity = '1';
            const container = document.getElementById('ai-modal-container');
            container.style.transform = 'scale(1) translateY(0)';
        });

        // Events
        const close = () => {
            root.style.opacity = '0';
            const container = document.getElementById('ai-modal-container');
            container.style.transform = 'scale(0.95) translateY(20px)';
            setTimeout(() => root.remove(), 300);
        };

        document.getElementById('ai-modal-close').onclick = close;
        root.onclick = (e) => { if (e.target === root) close(); };

        const btnGenerate = document.getElementById('ai-btn-generate');
        const promptInput = document.getElementById('ai-prompt-input');
        
        // --- Generation Function ---
        async function performGeneration(prompt) {
            if (!prompt) return showError('Please describe the image you want to create.');
            
            showView('loading');
            hideError();

            try {
                const response = await fetch(VERCEL_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, api_key: API_KEY })
                });

                const data = await response.json();
                if (data.status !== 'ok') throw new Error(data.message || 'Generation failed');

                const previewImg = document.getElementById('ai-preview-img');
                previewImg.src = `data:${data.mime_type};base64,${data.image}`;
                previewImg.dataset.base64 = data.image; // Store for saving
                previewImg.dataset.prompt = prompt;

                document.getElementById('ai-model-badge').textContent = `Generated via ${data.model_used}`;
                showView('result');
            } catch (err) {
                showError(err.message);
                showView('input');
            }
        }

        btnGenerate.onclick = () => performGeneration(promptInput.value.trim());

        // --- Repeat Button ---
        document.getElementById('ai-btn-repeat').onclick = () => {
            const previewImg = document.getElementById('ai-preview-img');
            const prompt = previewImg.dataset.prompt;
            performGeneration(prompt);
        };

        // --- Approve Button ---
        document.getElementById('ai-btn-approve').onclick = async () => {
            const btnApprove = document.getElementById('ai-btn-approve');
            const previewImg = document.getElementById('ai-preview-img');
            const base64 = previewImg.dataset.base64;
            const prompt = previewImg.dataset.prompt;

            if (!base64) return;

            btnApprove.disabled = true;
            btnApprove.style.opacity = '0.5';
            btnApprove.innerHTML = '<span>⏳</span> Saving...';

            try {
                const response = await fetch(SAVE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64, prompt: prompt })
                });

                const data = await response.json();
                if (data.status !== 'ok') throw new Error(data.message || 'Saving failed');

                // Update Contao Field & UI
                const targetField = document.getElementById('ctrl_singleSRC') || document.getElementById('ft_singleSRC');
                
                if (targetField && data.uuid) {
                    console.log('AI Generator: Updating Contao widget with UUID:', data.uuid);
                    
                    // 1. Set the hidden input value
                    const inputField = document.getElementById('ctrl_singleSRC');
                    if (inputField) inputField.value = data.uuid;

                    // 2. Trigger Contao's internal reloadFiletree to refresh the thumbnail/UI
                    // We mimic exactly how Contao's native picker does it
                    try {
                        const token = (typeof Contao !== 'undefined' && Contao.request_token) || 
                                      document.querySelector('input[name="REQUEST_TOKEN"]')?.value;
                        
                        const formData = new FormData();
                        formData.append('action', 'reloadFiletree');
                        formData.append('name', 'singleSRC');
                        formData.append('value', data.uuid);
                        if (token) formData.append('REQUEST_TOKEN', token);

                        // Call the same URL as the current page but with POST
                        const response = await fetch(window.location.href, {
                            method: 'POST',
                            body: formData,
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });

                        const responseText = await response.text();
                        let htmlContent = '';

                        try {
                            // Try parsing as JSON first (standard for modern Contao)
                            const json = JSON.parse(responseText);
                            htmlContent = json.content || '';
                            console.log('AI Generator: Received JSON response');
                        } catch (e) {
                            // Fallback: If it's raw HTML (some Contao versions/configs)
                            htmlContent = responseText;
                            console.log('AI Generator: Received raw HTML response');
                        }

                        if (htmlContent && htmlContent.includes('<div')) {
                            // The target for replacement is the wrapper div of the input
                            const selectorContainer = targetField.closest('.selector_container') || 
                                                      targetField.closest('div[data-controller]') ||
                                                      targetField.parentNode;
                            
                            if (selectorContainer) {
                                selectorContainer.innerHTML = htmlContent;
                                console.log('AI Generator: Widget UI reloaded');
                                
                                // Re-inject my button since the reload might have overwritten the HTML
                                setTimeout(() => {
                                    retryCount = 0;
                                    tryInject();
                                }, 150);
                            }
                        }
                    } catch (ajaxErr) {
                        console.error('AI Generator: Failed to reload filetree UI:', ajaxErr);
                        // Fallback: manually update label if AJAX reload fails
                        const infoLabel = targetField.parentNode.querySelector('.tl_help');
                        if (infoLabel) infoLabel.innerHTML = `<strong>Selected:</strong> ${data.path}`;
                    }
                }

                close();
            } catch (err) {
                console.error('AI Generator Error:', err);
                showError('Error saving: ' + err.message);
                btnApprove.disabled = false;
                btnApprove.style.opacity = '1';
                btnApprove.innerHTML = '✅ Use Image';
            }
        };
    }

    function showView(view) {
        document.getElementById('ai-input-view').style.display = view === 'input' ? 'block' : 'none';
        document.getElementById('ai-loading-view').style.display = view === 'loading' ? 'block' : 'none';
        document.getElementById('ai-result-view').style.display = view === 'result' ? 'block' : 'none';
    }

    function showError(msg) {
        const box = document.getElementById('ai-error-box');
        box.textContent = msg;
        box.style.display = 'block';
    }

    function hideError() {
        document.getElementById('ai-error-box').style.display = 'none';
    }

})();
