document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById('themeToggle');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const uploadedImage = document.getElementById('uploaded-image');
    const uploadPrompt = document.getElementById('upload-prompt');
    const palettePlaceholder = document.getElementById('palette-placeholder');
    const paletteResults = document.getElementById('palette-results');
    const dominantColorCard = document.getElementById('dominant-color');
    const paletteGrid = document.getElementById('palette-grid');
    
    const colorThief = new ColorThief();

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('请上传有效的图片文件 (jpg, png, gif等)。');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage.src = e.target.result;
            uploadedImage.classList.remove('hidden');
            uploadPrompt.classList.add('hidden');
            
            palettePlaceholder.innerHTML = '<h2>正在分析颜色...</h2><p>请稍候，我们正在智能提取配色。</p>';
            palettePlaceholder.classList.remove('hidden');
            paletteResults.classList.add('hidden');

            uploadedImage.onload = () => {
                processImage(uploadedImage);
            };
        };
        reader.readAsDataURL(file);
    }
    
    function processImage(imgElement) {
        try {
            const dominantColor = colorThief.getColor(imgElement);
            const palette = colorThief.getPalette(imgElement, 8);

            renderDominantColor(dominantColor);
            renderPalette(palette);

            palettePlaceholder.classList.add('hidden');
            paletteResults.classList.remove('hidden');
        } catch (error) {
            console.error("颜色提取失败:", error);
            palettePlaceholder.innerHTML = '<h2>提取失败</h2><p>无法处理此图片，请尝试其他图片。</p>';
        }
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
        
        dominantColorCard.onclick = () => copyToClipboard(hex, dominantColorCard, `${hex.toUpperCase()}`);
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

            card.onclick = () => copyToClipboard(hex, card, hex.toUpperCase());
            paletteGrid.appendChild(card);
        });
    }

    function rgbToHex([r, g, b]) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function isColorLight([r, g, b]) {
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6;
    }
    
    function copyToClipboard(textToCopy, element, originalText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalContent = element.innerHTML;
            element.innerHTML = '已复制!';
            setTimeout(() => {
                element.innerHTML = originalContent;
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
    
    const savedTheme = localStorage.getItem("theme") || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
    themeToggle.onclick = toggleTheme;

    uploadButton.onclick = () => fileInput.click();
    uploadArea.onclick = () => fileInput.click();
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
});