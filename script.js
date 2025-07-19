document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById('themeToggle');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const imageCanvas = document.getElementById('image-canvas');
    const uploadPrompt = document.getElementById('upload-prompt');
    const palettePlaceholder = document.getElementById('palette-placeholder');
    const paletteResults = document.getElementById('palette-results');
    const dominantColorCard = document.getElementById('dominant-color');
    const paletteGrid = document.getElementById('palette-grid');
    const loupe = document.getElementById('loupe');
    const loupeColor = document.getElementById('loupe-color');
    const loupeText = document.getElementById('loupe-text');
    const copyNotification = document.getElementById('copy-notification');
    const paletteSizeSlider = document.getElementById('palette-size');
    const paletteSizeValue = document.getElementById('palette-size-value');

    const colorThief = new ColorThief();
    const ctx = imageCanvas.getContext('2d');
    let currentImage = null;
    let notificationTimeout;

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('请上传或粘贴有效的图片文件 (jpg, png, gif等)。');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;
                drawAndProcessImage(img);
            };
            img.onerror = () => {
                showError("无法加载此图片，请尝试其他图片。");
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
             showError("读取文件失败。");
        };
        reader.readAsDataURL(file);

        uploadPrompt.classList.add('hidden');
        palettePlaceholder.innerHTML = '<h2>正在分析颜色...</h2><p>请稍候，我们正在智能提取配色。</p>';
        palettePlaceholder.classList.remove('hidden');
        paletteResults.classList.add('hidden');
    }

    function drawAndProcessImage(img) {
        const ar = img.width / img.height;
        const uploadAreaRect = uploadArea.getBoundingClientRect();
        let newWidth = uploadAreaRect.width;
        let newHeight = newWidth / ar;

        if (newHeight > uploadAreaRect.height) {
            newHeight = uploadAreaRect.height;
            newWidth = newHeight * ar;
        }
        
        imageCanvas.width = newWidth;
        imageCanvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        imageCanvas.classList.remove('hidden');
        processColors();
    }
    
    function processColors() {
        if (!currentImage) return;

        try {
            const paletteCount = parseInt(paletteSizeSlider.value, 10);
            
            const dominantColor = colorThief.getColor(currentImage);
            renderDominantColor(dominantColor);
            
            generateAndRenderPalette(paletteCount);

            palettePlaceholder.classList.add('hidden');
            paletteResults.classList.remove('hidden');
        } catch (error) {
            console.error("颜色提取失败:", error);
            showError("无法处理此图片，请尝试其他图片。");
        }
    }

    function generateAndRenderPalette(count) {
        if (!currentImage) return;
        try {
            const palette = colorThief.getPalette(currentImage, count);
            renderPalette(palette);
        } catch (error) {
            console.error(`提取 ${count} 色调色板失败:`, error);
            showError(`提取 ${count} 色调色板失败。`);
        }
    }
    
    function showError(message) {
        palettePlaceholder.innerHTML = `<h2>提取失败</h2><p>${message}</p>`;
        palettePlaceholder.classList.remove('hidden');
        paletteResults.classList.add('hidden');
        imageCanvas.classList.add('hidden');
        uploadPrompt.classList.remove('hidden');
        currentImage = null;
    }

    function renderDominantColor(rgb) {
        const hex = rgbToHex(rgb);
        dominantColorCard.style.backgroundColor = hex;
        dominantColorCard.className = 'color-card dominant-card';
        if (isColorLight(rgb)) {
            dominantColorCard.classList.add('light-text');
        }

        dominantColorCard.innerHTML = `
            <span>${hex.toUpperCase()}</span>
            <span class="color-info-text">点击复制</span>
        `;
        
        dominantColorCard.onclick = () => copyToClipboard(hex, dominantColorCard);
    }

    function renderPalette(palette) {
        paletteGrid.innerHTML = '';
        palette.forEach(rgb => {
            const hex = rgbToHex(rgb);
            const card = document.createElement('div');
            card.className = 'color-card';
            card.style.backgroundColor = hex;

            if (isColorLight(rgb)) {
                card.classList.add('light-text');
            }
            
            card.innerHTML = `
                <span>${hex.toUpperCase()}</span>
            `;

            card.onclick = () => copyToClipboard(hex, card);
            paletteGrid.appendChild(card);
        });
    }

    function rgbToHex([r, g, b]) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function isColorLight([r, g, b]) {
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6;
    }
    
    function copyToClipboard(textToCopy, element) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalContent = element.innerHTML;
            element.innerHTML = '已复制!';
            element.style.pointerEvents = 'none';
            setTimeout(() => {
                element.innerHTML = originalContent;
                element.style.pointerEvents = 'auto';
            }, 1500);
        }).catch(err => {
            console.error('复制失败: ', err);
            alert('复制失败，请手动复制。');
        });
    }

    function applyTheme(theme) {
        if (theme === "dark") {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
    }

    function toggleTheme() {
        const isDark = document.body.classList.contains("dark");
        const newTheme = isDark ? "light" : "dark";
        applyTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    }
    
    function handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                handleFile(file);
                e.preventDefault();
                return;
            }
        }
    }
    
    function handleEyedropperMove(e) {
        if(!currentImage) return;

        const rect = imageCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex([pixelData[0], pixelData[1], pixelData[2]]);
        
        loupe.style.left = `${e.clientX - rect.left}px`;
        loupe.style.top = `${e.clientY - rect.top}px`;
        loupeColor.style.backgroundColor = hex;
        loupeText.textContent = hex;
    }

    function handleEyedropperClick(e) {
        if (!currentImage) return;

        const rect = imageCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex([pixelData[0], pixelData[1], pixelData[2]]);

        navigator.clipboard.writeText(hex).then(() => {
            copyNotification.textContent = `已复制: ${hex}`;
            copyNotification.style.left = `${x}px`;
            copyNotification.style.top = `${y}px`;
            copyNotification.classList.add('show');

            clearTimeout(notificationTimeout);
            notificationTimeout = setTimeout(() => {
                copyNotification.classList.remove('show');
            }, 1500);
        }).catch(err => {
            console.error('复制失败: ', err);
        });
    }

    const savedTheme = localStorage.getItem("theme") || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
    themeToggle.onclick = toggleTheme;

    uploadButton.onclick = () => fileInput.click();
    uploadArea.onclick = (e) => {
        if (e.target === uploadArea || e.target === uploadPrompt || uploadPrompt.contains(e.target)) {
             fileInput.click();
        }
    };
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.parentElement.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.parentElement.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.parentElement.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });
    
    document.addEventListener('paste', handlePaste);

    imageCanvas.addEventListener('mousemove', handleEyedropperMove);
    imageCanvas.addEventListener('click', handleEyedropperClick);
    imageCanvas.addEventListener('mouseenter', () => loupe.classList.remove('hidden'));
    imageCanvas.addEventListener('mouseleave', () => {
        loupe.classList.add('hidden');
        copyNotification.classList.remove('show');
    });

    paletteSizeSlider.addEventListener('input', (e) => {
        const count = e.target.value;
        paletteSizeValue.textContent = count;
        if(currentImage) {
            generateAndRenderPalette(parseInt(count, 10));
        }
    });
});