// script.js - Lap Fortuna с Google Sheets интеграцией

let heroesList = [];
let currentUserName = null;
let currentMode = 'wheel';

// Загрузка героев
document.addEventListener('DOMContentLoaded', () => {
    if (typeof heroes !== 'undefined') {
        heroesList = heroes;
        console.log(`Загружено ${heroesList.length} героев`);
    } else {
        console.warn('heroes.js не найден');
        heroesList = [];
    }
    
    // Проверяем сохраненное имя
    const savedName = localStorage.getItem('lapFortunaUserName');
    if (savedName) {
        currentUserName = savedName;
        document.getElementById('userNameDisplay').textContent = currentUserName;
        // Загружаем историю
        loadLastRecords();
    } else {
        // Показываем модальное окно для ввода имени
        showNameModal();
    }
    
    initWheel();
    initGrid();
    initHiddenWheel();
    initModeSwitcher();
    initUserControls();
});

// Показать модальное окно для ввода имени
function showNameModal() {
    const modal = document.getElementById('nameModal');
    modal.classList.add('active');
    
    document.getElementById('confirmNameBtn').onclick = () => {
        const userName = document.getElementById('userNameInput').value.trim();
        if (userName && userName.length > 0 && userName.length <= 30) {
            // Проверка на маты (простые фильтры, можно расширить)
            const badWords = ['бля', 'хуй', 'пизд', 'еба', 'залуп', 'мудак', 'говно'];
            let hasBadWord = false;
            for (let word of badWords) {
                if (userName.toLowerCase().includes(word)) {
                    hasBadWord = true;
                    break;
                }
            }
            
            if (hasBadWord) {
                alert('Имя содержит недопустимые символы. Пожалуйста, выберите другое имя.');
                return;
            }
            
            currentUserName = userName;
            localStorage.setItem('lapFortunaUserName', currentUserName);
            document.getElementById('userNameDisplay').textContent = currentUserName;
            modal.classList.remove('active');
            loadLastRecords();
        } else {
            alert('Пожалуйста, введите корректное имя (от 1 до 30 символов)');
        }
    };
}

// Загрузить последние записи из Google Sheets
async function loadLastRecords() {
    try {
        const response = await fetch(GOOGLE_SHEETS_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'getLastRecords',
                limit: 5
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.records) {
            updateHistoryList(data.records);
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    }
}

// Обновить список истории
function updateHistoryList(records) {
    const historyList = document.getElementById('historyList');
    
    if (!records || records.length === 0) {
        historyList.innerHTML = '<div class="history-empty">Пока ничего нет</div>';
        return;
    }
    
    historyList.innerHTML = records.map(record => `
        <div class="history-item">
            <div class="history-user">${escapeHtml(record.userName)}</div>
            <div class="history-hero">
                <img src="${record.hero}" alt="${record.hero.split('/').pop().split('.')[0]}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ffd700\' stroke-width=\'2\'%3E%3Cpath d=\'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\'%3E%3C/path%3E%3Ccircle cx=\'12\' cy=\'7\' r=\'4\'%3E%3C/circle%3E%3C/svg%3E'">
                <span>${escapeHtml(record.hero.split('/').pop().split('.')[0].replace(/_/g, ' ').toUpperCase())}</span>
            </div>
            <div class="history-time">${record.date}</div>
        </div>
    `).join('');
}

// Добавить запись в Google Sheets
async function addSpinRecord(hero, mode) {
    if (!currentUserName) return;
    
    try {
        const response = await fetch(GOOGLE_SHEETS_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addRecord',
                userName: currentUserName,
                hero: hero,
                mode: mode
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Запись добавлена');
            // Обновляем историю
            loadLastRecords();
        }
    } catch (error) {
        console.error('Ошибка добавления записи:', error);
    }
}

// Отправить заявку на смену имени
async function submitNameRequest(newName) {
    if (!currentUserName) return false;
    
    // Проверка на маты
    const badWords = ['бля', 'хуй', 'пизд', 'еба', 'залуп', 'мудак', 'говно'];
    for (let word of badWords) {
        if (newName.toLowerCase().includes(word)) {
            alert('Имя содержит недопустимые символы. Пожалуйста, выберите другое имя.');
            return false;
        }
    }
    
    try {
        const response = await fetch(GOOGLE_SHEETS_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'requestNameChange',
                oldName: currentUserName,
                newName: newName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const statusDiv = document.getElementById('nameRequestStatus');
            statusDiv.textContent = '✅ Заявка отправлена администратору!';
            statusDiv.style.display = 'block';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
            return true;
        } else {
            alert('Ошибка отправки заявки');
            return false;
        }
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        alert('Ошибка отправки заявки');
        return false;
    }
}

// Инициализация управления пользователем
function initUserControls() {
    const changeNameBtn = document.getElementById('changeNameBtn');
    const cancelNameBtn = document.getElementById('cancelNameBtn');
    const submitRequestBtn = document.getElementById('submitNameRequestBtn');
    const changeNameModal = document.getElementById('changeNameModal');
    
    changeNameBtn.onclick = () => {
        changeNameModal.classList.add('active');
    };
    
    cancelNameBtn.onclick = () => {
        changeNameModal.classList.remove('active');
        document.getElementById('newUserNameInput').value = '';
    };
    
    submitRequestBtn.onclick = async () => {
        const newName = document.getElementById('newUserNameInput').value.trim();
        if (newName && newName.length > 0 && newName.length <= 30) {
            const success = await submitNameRequest(newName);
            if (success) {
                changeNameModal.classList.remove('active');
                document.getElementById('newUserNameInput').value = '';
            }
        } else {
            alert('Пожалуйста, введите корректное имя (от 1 до 30 символов)');
        }
    };
}

// Переключение режимов
function initModeSwitcher() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modeContents = document.querySelectorAll('.mode-content');
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            currentMode = mode;
            
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            modeContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${mode}-mode`).classList.add('active');
            
            if (mode === 'wheel' && wheelCanvas) {
                drawWheel();
            }
        });
    });
}

// ==================== РЕЖИМ 1: КРУТЯЩЕЕСЯ КОЛЕСО ====================
let wheelCanvas, ctx;
let currentRotation = 0;
let isSpinning = false;
let segments = [];

function initWheel() {
    wheelCanvas = document.getElementById('wheelCanvas');
    if (!wheelCanvas) return;
    
    ctx = wheelCanvas.getContext('2d');
    updateSegments();
    drawWheel();
    
    const spinBtn = document.getElementById('wheelSpinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', spinWheel);
    }
}

function updateSegments() {
    segments = heroesList.map((hero, index) => {
        const hue = (index * 360 / heroesList.length) % 360;
        return {
            name: hero.name,
            image: hero.image,
            color: `hsl(${hue}, 65%, 35%)`
        };
    });
}

function drawWheel() {
    if (!ctx || !wheelCanvas) return;
    
    const size = wheelCanvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    const angleStep = (Math.PI * 2) / segments.length;
    
    ctx.clearRect(0, 0, size, size);
    
    for (let i = 0; i < segments.length; i++) {
        const startAngle = i * angleStep + currentRotation;
        const endAngle = (i + 1) * angleStep + currentRotation;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = segments[i].color;
        ctx.fill();
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const fontSize = Math.max(10, Math.min(16, 280 / segments.length));
        ctx.font = `bold ${fontSize}px "Inter", "Arial", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 3;
        
        let text = segments[i].name;
        if (text.length > 12) {
            text = text.slice(0, 10) + "..";
        }
        
        ctx.fillText(text, radius * 0.68, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    // Центральный указатель
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#2a2a2a";
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 28);
    ctx.lineTo(centerX - 10, centerY - 12);
    ctx.lineTo(centerX + 10, centerY - 12);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function spinWheel() {
    if (isSpinning || !currentUserName) return;
    
    isSpinning = true;
    
    const spins = 3 + Math.random() * 2;
    const spinAngle = Math.random() * Math.PI * 2 + (Math.PI * 2 * spins);
    const startRotation = currentRotation;
    const startTime = performance.now();
    const duration = 3000;
    
    function animateSpin(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = startRotation + spinAngle * easeOut;
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            currentRotation = currentRotation % (Math.PI * 2);
            drawWheel();
            
            const pointerAngle = Math.PI * 1.5;
            let winningIndex = -1;
            
            for (let i = 0; i < segments.length; i++) {
                const startAngle = i * (Math.PI * 2 / segments.length) + currentRotation;
                const endAngle = (i + 1) * (Math.PI * 2 / segments.length) + currentRotation;
                
                let pointer = pointerAngle;
                if (pointer < startAngle) pointer += Math.PI * 2;
                
                if (pointer >= startAngle && pointer < endAngle) {
                    winningIndex = i;
                    break;
                }
            }
            
            if (winningIndex !== -1) {
                const winner = segments[winningIndex];
                showWheelResult(winner.name, winner.image);
                addSpinRecord(winner.image, 'wheel');
            }
            
            isSpinning = false;
        }
    }
    
    requestAnimationFrame(animateSpin);
}

function showWheelResult(heroName, heroImage) {
    const resultDiv = document.getElementById('wheelResult');
    const heroImg = document.getElementById('wheelHeroImage');
    const heroNameEl = document.getElementById('wheelHeroName');
    
    if (heroImg && heroNameEl) {
        heroImg.src = heroImage;
        heroNameEl.textContent = heroName;
        resultDiv.style.display = 'block';
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'slideUp 0.5s ease';
    }
}

// ==================== РЕЖИМ 2: КВАДРАТНЫЕ ФОТКИ ====================
let isSelecting = false;

function initGrid() {
    const gridContainer = document.getElementById('heroGrid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    heroesList.forEach((hero, index) => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.setAttribute('data-index', index);
        card.setAttribute('data-name', hero.name);
        card.setAttribute('data-image', hero.image);
        
        const img = document.createElement('img');
        img.src = hero.image;
        img.alt = hero.name;
        img.onerror = () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ffd700" stroke-width="2"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"%3E%3C/path%3E%3Ccircle cx="12" cy="7" r="4"%3E%3C/circle%3E%3C/svg%3E';
        };
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'hero-card-name';
        nameSpan.textContent = hero.name;
        
        card.appendChild(img);
        card.appendChild(nameSpan);
        
        card.addEventListener('click', () => {
            if (isSelecting) return;
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            showGridResult(hero.name, hero.image);
            addSpinRecord(hero.image, 'grid');
        });
        
        gridContainer.appendChild(card);
    });
    
    const spinBtn = document.getElementById('gridSpinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', startGridSelectionAnimation);
    }
}

function startGridSelectionAnimation() {
    if (isSelecting || !currentUserName) return;
    
    isSelecting = true;
    const spinBtn = document.getElementById('gridSpinBtn');
    const originalText = spinBtn.textContent;
    spinBtn.textContent = 'ВЫБИРАЮ...';
    spinBtn.disabled = true;
    
    const resultDiv = document.getElementById('gridResult');
    resultDiv.style.display = 'none';
    
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    
    let iterations = 0;
    const maxIterations = 20;
    let currentHighlightIndex = 0;
    
    const interval = setInterval(() => {
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('highlight-animation'));
        
        const cards = document.querySelectorAll('.hero-card');
        if (cards.length > 0) {
            cards[currentHighlightIndex].classList.add('highlight-animation');
            cards[currentHighlightIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        currentHighlightIndex = (currentHighlightIndex + 1) % cards.length;
        iterations++;
        
        if (iterations >= maxIterations) {
            clearInterval(interval);
            
            const finalIndex = Math.floor(Math.random() * heroesList.length);
            const finalHero = heroesList[finalIndex];
            const finalCard = document.querySelector(`.hero-card[data-index="${finalIndex}"]`);
            
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('highlight-animation'));
            if (finalCard) {
                finalCard.classList.add('selected');
                finalCard.classList.add('final-select');
                finalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            setTimeout(() => {
                showGridResult(finalHero.name, finalHero.image);
                addSpinRecord(finalHero.image, 'grid');
                spinBtn.textContent = originalText;
                spinBtn.disabled = false;
                isSelecting = false;
                
                setTimeout(() => {
                    if (finalCard) {
                        finalCard.classList.remove('highlight-animation', 'final-select');
                    }
                }, 1000);
            }, 300);
        }
    }, 100);
}

function showGridResult(heroName, heroImage) {
    const resultDiv = document.getElementById('gridResult');
    const heroImg = document.getElementById('gridHeroImage');
    const heroNameEl = document.getElementById('gridHeroName');
    
    if (heroImg && heroNameEl) {
        heroImg.src = heroImage;
        heroNameEl.textContent = heroName;
        resultDiv.style.display = 'block';
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'slideUp 0.5s ease';
    }
}

// ==================== РЕЖИМ 3: СКРЫТОЕ КОЛЕСО ====================
let hiddenRevealed = false;
let isRevealing = false;

function initHiddenWheel() {
    const mysteryBox = document.getElementById('mysteryBox');
    const spinBtn = document.getElementById('hiddenSpinBtn');
    
    if (spinBtn) {
        spinBtn.addEventListener('click', revealHiddenHero);
    }
    
    if (mysteryBox) {
        mysteryBox.addEventListener('click', revealHiddenHero);
    }
}

function revealHiddenHero() {
    if (isRevealing || !currentUserName) return;
    
    if (hiddenRevealed) {
        resetHiddenWheel();
        return;
    }
    
    isRevealing = true;
    const spinBtn = document.getElementById('hiddenSpinBtn');
    spinBtn.textContent = 'ОТКРЫВАЮ...';
    spinBtn.disabled = true;
    
    const mysteryBox = document.getElementById('mysteryBox');
    const questionMark = mysteryBox.querySelector('.question-mark');
    
    let rotation = 0;
    const spinInterval = setInterval(() => {
        rotation += 45;
        if (mysteryBox) {
            mysteryBox.style.transform = `rotate(${rotation}deg) scale(1)`;
        }
    }, 100);
    
    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
        if (mysteryBox) {
            mysteryBox.style.boxShadow = blinkCount % 2 === 0 
                ? '0 0 50px rgba(255, 215, 0, 0.8)' 
                : '0 0 20px rgba(255, 107, 107, 0.5)';
        }
        blinkCount++;
    }, 150);
    
    const randomIndex = Math.floor(Math.random() * heroesList.length);
    const randomHero = heroesList[randomIndex];
    
    setTimeout(() => {
        clearInterval(spinInterval);
        clearInterval(blinkInterval);
        
        if (mysteryBox) {
            mysteryBox.style.transform = 'scale(1.2)';
            mysteryBox.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                if (mysteryBox) {
                    mysteryBox.style.transform = 'scale(1)';
                }
            }, 300);
        }
        
        if (questionMark) {
            questionMark.style.animation = 'none';
            questionMark.style.transition = 'all 0.3s ease';
            questionMark.style.opacity = '0';
            questionMark.style.transform = 'scale(0)';
        }
        
        const glow = mysteryBox?.querySelector('.mystery-glow');
        if (glow) {
            glow.style.opacity = '1';
            glow.style.background = 'radial-gradient(circle, rgba(255,215,0,0.8), rgba(255,107,107,0.8))';
        }
        
        setTimeout(() => {
            showHiddenResult(randomHero.name, randomHero.image);
            addSpinRecord(randomHero.image, 'hidden');
            
            if (spinBtn) {
                spinBtn.textContent = 'СБРОСИТЬ И ОТКРЫТЬ НОВОГО';
                spinBtn.disabled = false;
            }
            
            hiddenRevealed = true;
            isRevealing = false;
        }, 400);
    }, 2000);
}

function showHiddenResult(heroName, heroImage) {
    const resultDiv = document.getElementById('hiddenResult');
    const heroImg = document.getElementById('hiddenHeroImage');
    const heroNameEl = document.getElementById('hiddenHeroName');
    
    if (heroImg && heroNameEl) {
        heroImg.src = heroImage;
        heroNameEl.textContent = heroName;
        resultDiv.style.display = 'block';
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'revealResult 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        flash.style.animation = 'flash 0.5s ease-out';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 500);
    }
}

function resetHiddenWheel() {
    const mysteryBox = document.getElementById('mysteryBox');
    const resultDiv = document.getElementById('hiddenResult');
    const spinBtn = document.getElementById('hiddenSpinBtn');
    
    if (mysteryBox) {
        mysteryBox.style.transform = 'scale(1)';
        mysteryBox.style.transition = '';
        
        const questionMark = mysteryBox.querySelector('.question-mark');
        if (questionMark) {
            questionMark.style.opacity = '1';
            questionMark.style.transform = 'scale(1)';
            questionMark.style.animation = 'pulse 2s ease-in-out infinite';
        }
        
        const glow = mysteryBox.querySelector('.mystery-glow');
        if (glow) {
            glow.style.opacity = '0';
            glow.style.background = 'radial-gradient(circle, rgba(255,107,107,0.3), transparent)';
        }
        
        mysteryBox.style.boxShadow = '';
    }
    
    if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.style.animation = '';
    }
    
    if (spinBtn) {
        spinBtn.textContent = 'ОТКРЫТЬ СУДЬБУ';
    }
    
    hiddenRevealed = false;
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обновление при изменении списка героев
function refreshAll() {
    updateSegments();
    drawWheel();
    initGrid();
    resetHiddenWheel();
}
