/**
 * Contao AI Image Generator - V3.0
 * Finds and injects button next to "Change selection"
 */

(function () {
    'use strict';

    console.log('Contao Alt Generator Loaded (V3.0)');
    console.log('AI Image Generator loaded from Vercel!');

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        injectAiButton();
        // Retry multiple times as Contao loads content dynamically
        setTimeout(injectAiButton, 500);
        setTimeout(injectAiButton, 1000);
        setTimeout(injectAiButton, 2000);

        // Watch for DOM changes (when user navigates to image element)
        const observer = new MutationObserver(function (mutations) {
            injectAiButton();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function injectAiButton() {
        // Find the "Change selection" button
        const changeButton = document.getElementById('ft_singleSRC');

        if (!changeButton) {
            console.log('Change selection button not found yet');
            return;
        }

        // Check if we already added our button
        if (document.getElementById('ai_generate_image_btn')) {
            console.log('AI button already exists');
            return;
        }

        console.log('Found change selection button, injecting AI button');

        // Create our AI button
        const aiButton = document.createElement('a');
        aiButton.href = '#';
        aiButton.id = 'ai_generate_image_btn';
        aiButton.className = 'tl_submit';
        aiButton.textContent = '🎨 Generate AI Image';
        aiButton.style.cssText = 'background: #9c27b0 !important; color: white !important; margin-left: 10px;';

        aiButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('AI Generate button clicked!');
            showPlaceholderModal();
        });

        // Insert after the "Change selection" button
        changeButton.parentNode.insertBefore(aiButton, changeButton.nextSibling);

        console.log('AI button injected successfully!');
    }

    function showPlaceholderModal() {
        console.log('Opening AI Image Generator modal');

        // Create placeholder modal
        const modal = document.createElement('div');
        modal.id = 'ai-image-generator-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
                        color: white;
                        padding: 20px 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <h2 style="margin: 0; font-size: 20px;">🎨 AI Image Generator</h2>
                        <button onclick="this.closest('#ai-image-generator-modal').remove()" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            font-size: 24px;
                            color: white;
                            cursor: pointer;
                            padding: 4px 12px;
                            border-radius: 4px;
                        ">&times;</button>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding: 24px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                            Describe the image you want to create:
                        </label>
                        <textarea id="ai-prompt-input" rows="4" placeholder="Example: A serene mountain landscape at sunset with purple sky and golden clouds, photorealistic, 4k quality" style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            font-size: 14px;
                            font-family: inherit;
                            resize: vertical;
                            margin-bottom: 16px;
                            box-sizing: border-box;
                        "></textarea>
                        
                        <button onclick="generatePlaceholderImage()" style="
                            width: 100%;
                            padding: 12px 24px;
                            background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                        ">🎨 Generate Image (Placeholder)</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on overlay click
        modal.addEventListener('click', function (e) {
            if (e.target.style.position === 'fixed') {
                modal.remove();
            }
        });
    }

    // Make function globally available
    window.generatePlaceholderImage = function () {
        console.log('Generate button clicked');
        const modal = document.getElementById('ai-image-generator-modal');
        const prompt = document.getElementById('ai-prompt-input').value.trim();

        if (!prompt) {
            alert('Please enter a description for the image');
            return;
        }

        console.log('Generating image with prompt:', prompt);

        // Show loading
        modal.querySelector('div > div:nth-child(2)').innerHTML = `
            <div style="text-align: center; padding: 60px 24px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #9c27b0;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">Creating your image...</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">This is a placeholder demo</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        // Simulate generation
        setTimeout(() => {
            showGeneratedImage(modal, prompt);
        }, 2000);
    };

    function showGeneratedImage(modal, prompt) {
        console.log('Showing generated image');

        // Create placeholder image URL
        const placeholderUrl = `https://via.placeholder.com/1024x1024/9c27b0/ffffff?text=AI+Generated`;

        modal.querySelector('div > div:nth-child(2)').innerHTML = `
            <div style="padding: 24px;">
                <div style="margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                    <img src="${placeholderUrl}" style="width: 100%; display: block;" alt="Generated image">
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="document.getElementById('ai-image-generator-modal').remove(); setTimeout(() => showPlaceholderModal(), 100);" style="
                        padding: 12px 24px;
                        background: #757575;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                    ">🔄 Re-create</button>
                    
                    <button onclick="alert('✅ Placeholder: Image would be saved to Contao here\\n\\nPrompt: ${prompt.replace(/'/g, "\\'")}'); document.getElementById('ai-image-generator-modal').remove();" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                    ">✅ Approve</button>
                </div>
            </div>
        `;
    }

    // Make function globally available
    window.showPlaceholderModal = showPlaceholderModal;

})();