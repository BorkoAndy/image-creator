/**
 * AI Image Generator - Premium Interaction Logic
 */

const SELECTORS = {
    promptInput: '#prompt-input',
    charCount: '#char-count',
    sliderTrack: '#slider-track',
    sliderHandle: '#slider-handle',
    sliderText: '#slider-text',
    errorDisplay: '#error-display',
    loading: '#loading',
    resultArea: '#result-area',
    resultImg: '#result-img',
    modelBadge: '#model-badge',
    btnDownload: '#btn-download',
    btnReset: '#btn-reset',
    modelSelect: '#model-select',
    themeToggle: '#theme-toggle',
    themeIcon: '#theme-toggle-icon',
    loginOverlay: '#login-overlay',
    loginForm: '#login-form',
    loginPassword: '#login-password',
    loginError: '#login-error'
};

const HARDCODED_PASSWORD = 'Kx9#mP2vN$qL8@wR5yT!';
let isVerified = false;
let isGenerating = false;

/**
 * Theme Management
 */
function initTheme() {
    const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.querySelector(SELECTORS.themeIcon).textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.querySelector(SELECTORS.themeIcon).textContent = '🌙';
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.querySelector(SELECTORS.themeIcon).textContent = isDark ? '☀️' : '🌙';
}

/**
 * Authentication Management
 */
function getAuth() {
    return localStorage.getItem('app_password');
}

function setAuth(password) {
    localStorage.setItem('app_password', password);
}

function checkAuth() {
    const overlay = document.querySelector(SELECTORS.loginOverlay);
    const storedPassword = getAuth();
    
    // In this premium version, we show the login if the stored password doesn't match the hardcoded one
    if (storedPassword !== HARDCODED_PASSWORD) {
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.querySelector('div').classList.remove('scale-90');
        overlay.querySelector('div').classList.add('scale-100');
        return false;
    } else {
        overlay.classList.add('opacity-0', 'pointer-events-none');
        overlay.querySelector('div').classList.add('scale-90');
        overlay.querySelector('div').classList.remove('scale-100');
        return true;
    }
}

function initAuth() {
    const form = document.querySelector(SELECTORS.loginForm);
    const loginError = document.querySelector(SELECTORS.loginError);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputPassword = document.querySelector(SELECTORS.loginPassword).value.trim();
        
        if (inputPassword === HARDCODED_PASSWORD) {
            setAuth(inputPassword);
            checkAuth();
            loginError.classList.add('hidden');
        } else {
            loginError.classList.remove('hidden');
            document.querySelector(SELECTORS.loginPassword).value = '';
            // Shake effect
            const container = form.closest('div');
            container.classList.add('animate-bounce');
            setTimeout(() => container.classList.remove('animate-bounce'), 500);
        }
    });

    checkAuth();
}

/**
 * Slider Verification & Generation Logic
 */
function initSlider() {
    const track = document.querySelector(SELECTORS.sliderTrack);
    const handle = document.querySelector(SELECTORS.sliderHandle);
    const text = document.querySelector(SELECTORS.sliderText);
    const promptInput = document.querySelector(SELECTORS.promptInput);

    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    const startDrag = (e) => {
        if (isVerified || isGenerating || !promptInput.value.trim()) {
            if (!promptInput.value.trim()) {
                showError("Please enter a creative prompt first.");
                promptInput.focus();
            }
            return;
        }
        isDragging = true;
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        handle.classList.remove('transition-transform');
    };

    const moveDrag = (e) => {
        if (!isDragging) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const maxDelta = track.clientWidth - handle.clientWidth - 12;
        currentX = Math.max(0, Math.min(clientX - startX, maxDelta));
        
        handle.style.transform = `translateX(${currentX}px)`;
        text.style.opacity = 1 - (currentX / maxDelta);
        
        if (currentX >= maxDelta) {
            isDragging = false;
            completeVerification();
        }
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        if (!isVerified) {
            resetSlider();
        }
    };

    const resetSlider = () => {
        handle.style.transform = `translateX(0px)`;
        handle.classList.add('transition-transform');
        text.style.opacity = 1;
    };

    const completeVerification = () => {
        isVerified = true;
        handle.style.transform = `translateX(${track.clientWidth - handle.clientWidth - 12}px)`;
        handle.classList.add('bg-lime-500');
        handle.classList.remove('bg-lime-400');
        handle.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />';
        
        text.textContent = 'Verification Complete';
        text.classList.remove('text-gray-400');
        text.classList.add('text-lime-500');
        
        track.classList.add('border-lime-500/50', 'bg-lime-500/5');
        
        generateImage();
    };

    handle.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    handle.addEventListener('touchstart', startDrag);
    window.addEventListener('touchmove', moveDrag);
    window.addEventListener('touchend', endDrag);
}

/**
 * Image Generation Logic
 */
async function generateImage() {
    const prompt = document.querySelector(SELECTORS.promptInput).value.trim();
    const loading = document.querySelector(SELECTORS.loading);
    const resultArea = document.querySelector(SELECTORS.resultArea);
    const resultImg = document.querySelector(SELECTORS.resultImg);
    const modelBadge = document.querySelector(SELECTORS.modelBadge);
    const errorDisplay = document.querySelector(SELECTORS.errorDisplay);

    if (!prompt || !isVerified) return;

    isGenerating = true;
    loading.classList.remove('hidden');
    resultArea.classList.add('hidden');
    errorDisplay.classList.add('hidden');
    
    try {
        const password = getAuth();
        const model = document.querySelector(SELECTORS.modelSelect).value;
        const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, api_key: password, model })
        });

        const data = await res.json();

        if (res.ok && data.status === 'ok') {
            resultImg.src = `data:image/png;base64,${data.image}`;
            modelBadge.textContent = data.model_used === 'cloudflare' ? 'Cloudflare SDXL' : 'Hugging Face SDXL';
            
            loading.classList.add('hidden');
            resultArea.classList.remove('hidden');
        } else {
            throw new Error(data.message || "Synthesis failed");
        }
    } catch (e) {
        showError(e.message);
        resetVerificationState();
    } finally {
        isGenerating = false;
        loading.classList.add('hidden');
    }
}

function resetVerificationState() {
    isVerified = false;
    const handle = document.querySelector(SELECTORS.sliderHandle);
    const track = document.querySelector(SELECTORS.sliderTrack);
    const text = document.querySelector(SELECTORS.sliderText);

    handle.style.transform = `translateX(0px)`;
    handle.classList.add('transition-transform');
    handle.classList.remove('bg-lime-500');
    handle.classList.add('bg-lime-400');
    handle.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />';
    
    text.textContent = 'Slide to Generate';
    text.classList.add('text-gray-400');
    text.classList.remove('text-lime-500');
    text.style.opacity = 1;

    track.classList.remove('border-lime-500/50', 'bg-lime-500/5');
}

function showError(msg) {
    const errorDisplay = document.querySelector(SELECTORS.errorDisplay);
    errorDisplay.textContent = msg;
    errorDisplay.classList.remove('hidden');
    setTimeout(() => {
        errorDisplay.classList.add('hidden');
    }, 5000);
}

/**
 * UI Interactions
 */
function initInteractions() {
    const promptInput = document.querySelector(SELECTORS.promptInput);
    const charCount = document.querySelector(SELECTORS.charCount);
    const btnReset = document.querySelector(SELECTORS.btnReset);
    const btnDownload = document.querySelector(SELECTORS.btnDownload);
    const resultImg = document.querySelector(SELECTORS.resultImg);

    promptInput.addEventListener('input', () => {
        const len = promptInput.value.length;
        charCount.textContent = `${len} / 500`;
        if (isVerified) resetVerificationState();
    });

    btnReset.addEventListener('click', () => {
        promptInput.value = '';
        charCount.textContent = '0 / 500';
        document.querySelector(SELECTORS.resultArea).classList.add('hidden');
        resetVerificationState();
        promptInput.focus();
    });

    btnDownload.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = resultImg.src;
        link.download = `vision-${Date.now()}.png`;
        link.click();
    });

    document.querySelector(SELECTORS.themeToggle).addEventListener('click', toggleTheme);
}

// Initialize everything on load
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth();
    initSlider();
    initInteractions();
});
