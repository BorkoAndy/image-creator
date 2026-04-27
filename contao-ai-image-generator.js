/**
 * Contao AI Image Generator - V3.1
 * Finds and injects button next to "Change selection"
 * Fix: proper retry with backoff + observer that pauses after success
 */

(function () {
    'use strict';

    console.log('Contao AI Image Generator Loaded (V3.1)');

    var retryCount = 0;
    var maxRetries = 40; // 40 × increasing intervals ≈ ~20s total window
    var observer = null;

    // Start as soon as the script runs; DOMContentLoaded may have already fired
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startRetrying);
    } else {
        startRetrying();
    }

    // ─── Retry loop ────────────────────────────────────────────────────────────

    function startRetrying() {
        tryInject();
    }

    function tryInject() {
        if (injectAiButton()) {
            // Success — watch only for the button being removed (e.g. Contao re-renders)
            startRemovalWatcher();
            return;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
            console.warn('AI Image Generator: gave up after', maxRetries, 'attempts');
            return;
        }

        // Backoff: 100 ms → 200 ms → 300 ms … capped at 1 000 ms
        var delay = Math.min(100 * retryCount, 1000);
        setTimeout(tryInject, delay);
    }

    // ─── Injection ─────────────────────────────────────────────────────────────

    function injectAiButton() {
        var target = document.getElementById('ft_singleSRC');
        if (!target) {
            return false; // not ready yet
        }

        if (document.getElementById('ai_generate_image_btn')) {
            return true; // already there
        }

        var aiButton = document.createElement('a');
        aiButton.href = '#';
        aiButton.id = 'ai_generate_image_btn';
        aiButton.className = 'tl_submit';
        aiButton.textContent = '🎨 Generate AI Image';
        aiButton.style.cssText = 'background:#9c27b0!important;color:#fff!important;margin-left:10px;';

        aiButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showModal();
        });

        target.parentNode.insertBefore(aiButton, target.nextSibling);
        console.log('AI Image Generator: button injected');
        return true;
    }

    // ─── Removal watcher ───────────────────────────────────────────────────────
    // Watches only for the button disappearing (Contao can re-render the widget).
    // Much cheaper than observing every DOM mutation forever.

    function startRemovalWatcher() {
        if (observer) return; // already watching

        observer = new MutationObserver(function () {
            if (!document.getElementById('ai_generate_image_btn')) {
                console.log('AI Image Generator: button removed, re-injecting');
                observer.disconnect();
                observer = null;
                retryCount = 0;
                tryInject();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ─── Modal ─────────────────────────────────────────────────────────────────

    function showModal() {
        if (document.getElementById('ai-image-generator-modal')) return;

        var modal = document.createElement('div');
        modal.id = 'ai-image-generator-modal';
        modal.innerHTML = [
            '<div style="position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:10000;display:flex;align-items:center;justify-content:center;">',
                '<div style="background:#fff;border-radius:12px;width:90%;max-width:600px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.3);">',
                    '<div style="background:linear-gradient(135deg,#9c27b0,#7b1fa2);color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;">',
                        '<h2 style="margin:0;font-size:20px;">🎨 AI Image Generator</h2>',
                        '<button id="ai-modal-close" style="background:rgba(255,255,255,.2);border:none;font-size:24px;color:#fff;cursor:pointer;padding:4px 12px;border-radius:4px;">&times;</button>',
                    '</div>',
                    '<div id="ai-modal-body" style="padding:24px;">',
                        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#333;">Describe the image you want to create:</label>',
                        '<textarea id="ai-prompt-input" rows="4" placeholder="e.g. A serene mountain landscape at sunset, photorealistic, 4k" style="width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;margin-bottom:16px;box-sizing:border-box;"></textarea>',
                        '<button id="ai-generate-btn" style="width:100%;padding:12px 24px;background:linear-gradient(135deg,#9c27b0,#7b1fa2);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">🎨 Generate Image (Placeholder)</button>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('');

        document.body.appendChild(modal);

        // Close button
        document.getElementById('ai-modal-close').addEventListener('click', function () {
            modal.remove();
        });

        // Close on overlay click
        modal.querySelector('div[style*="position:fixed"]').addEventListener('click', function (e) {
            if (e.target === this) modal.remove();
        });

        // Generate button
        document.getElementById('ai-generate-btn').addEventListener('click', function () {
            startGeneration(modal);
        });
    }

    function startGeneration(modal) {
        var prompt = (document.getElementById('ai-prompt-input') || {}).value;
        if (!prompt || !prompt.trim()) {
            alert('Please enter a description for the image.');
            return;
        }
        prompt = prompt.trim();

        document.getElementById('ai-modal-body').innerHTML = [
            '<div style="text-align:center;padding:60px 24px;">',
                '<div style="width:60px;height:60px;border:4px solid #f3f3f3;border-top:4px solid #9c27b0;border-radius:50%;animation:aiSpin 1s linear infinite;margin:0 auto 20px;"></div>',
                '<h3 style="margin:0 0 10px;color:#333;font-size:18px;">Creating your image…</h3>',
                '<p style="margin:0;color:#666;font-size:14px;">This is a placeholder demo</p>',
            '</div>',
            '<style>@keyframes aiSpin{to{transform:rotate(360deg)}}</style>'
        ].join('');

        setTimeout(function () { showResult(modal, prompt); }, 2000);
    }

    function showResult(modal, prompt) {
        var placeholderUrl = 'https://via.placeholder.com/1024x1024/9c27b0/ffffff?text=AI+Generated';
        var safePrompt = prompt.replace(/'/g, "\\'");

        document.getElementById('ai-modal-body').innerHTML = [
            '<div style="padding:24px;">',
                '<div style="margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">',
                    '<img src="' + placeholderUrl + '" style="width:100%;display:block;" alt="Generated image">',
                '</div>',
                '<div style="display:flex;gap:12px;justify-content:flex-end;">',
                    '<button id="ai-recreate-btn" style="padding:12px 24px;background:#757575;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">🔄 Re-create</button>',
                    '<button id="ai-approve-btn" style="padding:12px 24px;background:linear-gradient(135deg,#4caf50,#388e3c);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">✅ Approve</button>',
                '</div>',
            '</div>'
        ].join('');

        document.getElementById('ai-recreate-btn').addEventListener('click', function () {
            modal.remove();
            showModal();
        });

        document.getElementById('ai-approve-btn').addEventListener('click', function () {
            alert('✅ Placeholder: image would be saved to Contao here.\n\nPrompt: ' + safePrompt);
            modal.remove();
        });
    }

})();
