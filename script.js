// Загрузка героев из heroes.js
let heroesList = [];

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем наличие heroes
    if (typeof heroes !== 'undefined') {
        heroesList = heroes;
    } else {
        // Если heroes.js не загружен, используем тестовые данные
        console.warn('heroes.js не найден, использую тестовые данные');
        heroesList = [
            { name: "Anti-Mage", image: "heroes/antimage.png" },
            { name: "Axe", image: "heroes/axe.png" },
            { name: "Pudge", image: "heroes/pudge.png" },
            { name: "Invoker", image: "heroes/invoker.png" }
        ];
    }
    
    initWheel();
    initGrid();
    initHiddenWheel();
    initModeSwitcher();
});

// Переключение режимов
function initModeSwitcher() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modeContents = document.querySelectorAll('.mode-content');
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            
            // Обновляем активные кнопки
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Обновляем видимый контент
            modeContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${mode}-mode`).classList.add('active');
            
            // Перерисовываем колесо при переключении на него
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
let spinAnimation = null;
let segments = [];

function initWheel() {
    wheelCanvas = document.getElementById('wheelCanvas');
    if (!wheelCanvas) return;
    
    ctx = wheelCanvas.getContext('2d');
    
    // Подготавливаем сегменты
    updateSegments();
    
    // Рисуем колесо
    drawWheel();
    
    // Обработчик кнопки
    const spinBtn = document.getElementById('wheelSpinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', spinWheel);
    }
}

function updateSegments() {
    segments = heroesList.map((hero, index) => ({
        name: hero.name,
        image: hero.image,
        color: `hsl(${(index * 360 / heroesList.length) % 360}, 70%, 55%)`
    }));
}

function drawWheel() {
    if (!ctx || !wheelCanvas) return;
    
    const size = wheelCanvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    const angleStep = (Math.PI * 2) / segments.length;
    
    ctx.clearRect(0, 0, size, size);
    
    // Рисуем сегменты
    for (let i = 0; i < segments.length; i++) {
        const startAngle = i * angleStep + currentRotation;
        const endAngle = (i + 1) * angleStep + currentRotation;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = segments[i].color;
        ctx.fill();
        
        // Рисуем текст
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${Math.min(14, 180 / segments.length)}px "Inter"`;
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 0;
        
        const text = segments[i].name.length > 12 ? 
            segments[i].name.slice(0, 10) + "..." : 
            segments[i].name;
        ctx.fillText(text, radius * 0.7, 0);
        ctx.restore();
        
        // Рисуем границы
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Рисуем центральный круг
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Рисуем указатель
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 10, centerY);
    ctx.lineTo(centerX + radius - 10, centerY - 10);
    ctx.lineTo(centerX + radius - 10, centerY + 10);
    ctx.fillStyle = "#ff6b6b";
    ctx.fill();
}

function spinWheel() {
    if (isSpinning) return;
    
    isSpinning = true;
    const spinAngle = Math.random() * Math.PI * 2 + Math.PI * 8;
    const startRotation = currentRotation;
    const startTime = performance.now();
    const duration = 2000;
    
    function animateSpin(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        // Easing
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = startRotation + spinAngle * easeOut;
        
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // Завершаем анимацию
            currentRotation = currentRotation % (Math.PI * 2);
            drawWheel();
            
            // Определяем выигрышный сегмент
            const pointerAngle = Math.PI * 1.5; // Указатель сверху
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
        
        // Анимация
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'fadeIn 0.5s ease';
    }
}

// ==================== РЕЖИМ 2: КВАДРАТНЫЕ ФОТКИ ====================
function initGrid() {
    const gridContainer = document.getElementById('heroGrid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    heroesList.forEach((hero, index) => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.setAttribute('data-index', index);
        
        const img = document.createElement('img');
        img.src = hero.image;
        img.alt = hero.name;
        img.onerror = () => {
            img.src = 'https://via.placeholder.com/80x80?text=?';
        };
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'hero-card-name';
        nameSpan.textContent = hero.name;
        
        card.appendChild(img);
        card.appendChild(nameSpan);
        
        card.addEventListener('click', () => {
            // Убираем выделение со всех
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            showGridResult(hero.name, hero.image);
        });
        
        gridContainer.appendChild(card);
    });
    
    const spinBtn = document.getElementById('gridSpinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * heroesList.length);
            const randomHero = heroesList[randomIndex];
            
            // Выделяем карточку
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
            const selectedCard = document.querySelector(`.hero-card[data-index="${randomIndex}"]`);
            if (selectedCard) selectedCard.classList.add('selected');
            
            // Прокручиваем к карточке
            if (selectedCard) {
                selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            showGridResult(randomHero.name, randomHero.image);
        });
    }
}

function showGridResult(heroName, heroImage) {
    const resultDiv = document.getElementById('gridResult');
    const heroImg = document.getElementById('gridHeroImage');
    const heroNameEl = document.getElementById('gridHeroName');
    
    if (heroImg && heroNameEl) {
        heroImg.src = heroImage;
        heroNameEl.textContent = heroName;
        resultDiv.style.display = 'block';
        
        // Анимация
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'fadeIn 0.5s ease';
    }
}

// ==================== РЕЖИМ 3: СКРЫТОЕ КОЛЕСО ====================
let hiddenRevealed = false;

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
    if (hiddenRevealed) {
        // Если уже открыто, можно снова закрыть и открыть нового
        resetHiddenWheel();
    }
    
    const randomIndex = Math.floor(Math.random() * heroesList.length);
    const randomHero = heroesList[randomIndex];
    
    // Анимация открытия
    const mysteryBox = document.getElementById('mysteryBox');
    const resultDiv = document.getElementById('hiddenResult');
    const heroImg = document.getElementById('hiddenHeroImage');
    const heroNameEl = document.getElementById('hiddenHeroName');
    
    if (mysteryBox) {
        mysteryBox.style.transform = 'scale(0.9)';
        setTimeout(() => {
            mysteryBox.style.transform = 'scale(1)';
        }, 200);
        
        // Скрываем вопросительный знак с анимацией
        const questionMark = mysteryBox.querySelector('.question-mark');
        if (questionMark) {
            questionMark.style.animation = 'none';
            questionMark.style.opacity = '0';
            questionMark.style.transform = 'scale(0)';
        }
        
        // Добавляем свечение
        const glow = mysteryBox.querySelector('.mystery-glow');
        if (glow) {
            glow.style.opacity = '1';
            glow.style.background = 'radial-gradient(circle, rgba(255,215,0,0.8), rgba(255,107,107,0.8))';
        }
    }
    
    // Показываем результат
    setTimeout(() => {
        if (heroImg && heroNameEl) {
            heroImg.src = randomHero.image;
            heroNameEl.textContent = randomHero.name;
            resultDiv.style.display = 'block';
            
            // Меняем кнопку
            const spinBtn = document.getElementById('hiddenSpinBtn');
            if (spinBtn) {
                spinBtn.textContent = 'СБРОСИТЬ И ОТКРЫТЬ НОВОГО';
            }
        }
        
        hiddenRevealed = true;
    }, 500);
}

function resetHiddenWheel() {
    const mysteryBox = document.getElementById('mysteryBox');
    const resultDiv = document.getElementById('hiddenResult');
    const spinBtn = document.getElementById('hiddenSpinBtn');
    
    if (mysteryBox) {
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
    }
    
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
    
    if (spinBtn) {
        spinBtn.textContent = 'ОТКРЫТЬ СУДЬБУ';
    }
    
    hiddenRevealed = false;
}

// Обновление при изменении списка героев
function refreshAll() {
    updateSegments();
    drawWheel();
    initGrid();
    resetHiddenWheel();
}
