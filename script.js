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

// ==================== РЕЖИМ 1: КРУТЯЩЕЕСЯ КОЛЕСО (ИСПРАВЛЕНО) ====================
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
    // Используем более темные, приятные цвета
    segments = heroesList.map((hero, index) => {
        // Более темные, насыщенные цвета
        const hue = (index * 360 / heroesList.length) % 360;
        return {
            name: hero.name,
            image: hero.image,
            color: `hsl(${hue}, 65%, 35%)` // Более темные цвета
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
    
    // Рисуем сегменты
    for (let i = 0; i < segments.length; i++) {
        const startAngle = i * angleStep + currentRotation;
        const endAngle = (i + 1) * angleStep + currentRotation;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = segments[i].color;
        ctx.fill();
        
        // Рисуем текст с улучшенной читаемостью
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Адаптивный размер шрифта
        const fontSize = Math.max(10, Math.min(16, 280 / segments.length));
        ctx.font = `bold ${fontSize}px "Inter", "Arial", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 3;
        
        // Сокращаем длинные имена
        let text = segments[i].name;
        if (text.length > 12) {
            text = text.slice(0, 10) + "..";
        }
        
        ctx.fillText(text, radius * 0.68, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Рисуем границы
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    // Рисуем центральный круг (указатель)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#2a2a2a";
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Рисуем стрелку-указатель в центре (треугольник, указывающий вверх)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 28);
    ctx.lineTo(centerX - 10, centerY - 12);
    ctx.lineTo(centerX + 10, centerY - 12);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    
    // Добавляем блик
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    
    // Рисуем внешний обод
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function spinWheel() {
    if (isSpinning) return;
    
    isSpinning = true;
    
    // Уменьшаем скорость вращения - меньше оборотов
    const minSpins = 3;
    const maxSpins = 5;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const spinAngle = Math.random() * Math.PI * 2 + (Math.PI * 2 * spins);
    
    const startRotation = currentRotation;
    const startTime = performance.now();
    const duration = 3000; // Увеличиваем длительность до 3 секунд
    
    function animateSpin(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        // Используем более плавное замедление
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = startRotation + spinAngle * easeOut;
        
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // Завершаем анимацию
            currentRotation = currentRotation % (Math.PI * 2);
            drawWheel();
            
            // Определяем выигрышный сегмент (стрелка в центре указывает вверх)
            const pointerAngle = Math.PI * 1.5; // Угол 270° (вверх)
            let winningIndex = -1;
            let minAngleDiff = Infinity;
            
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
        
        // Анимация появления
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'slideUp 0.5s ease';
    }
}

// ==================== РЕЖИМ 2: КВАДРАТНЫЕ ФОТКИ С АНИМАЦИЕЙ ВЫБОРА ====================
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
            // Убираем выделение со всех
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            showGridResult(hero.name, hero.image, card);
        });
        
        gridContainer.appendChild(card);
    });
    
    const spinBtn = document.getElementById('gridSpinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', startGridSelectionAnimation);
    }
}

function startGridSelectionAnimation() {
    if (isSelecting) return;
    
    isSelecting = true;
    const spinBtn = document.getElementById('gridSpinBtn');
    const originalText = spinBtn.textContent;
    spinBtn.textContent = 'ВЫБИРАЮ...';
    spinBtn.disabled = true;
    
    // Очищаем предыдущий результат
    const resultDiv = document.getElementById('gridResult');
    resultDiv.style.display = 'none';
    
    // Убираем выделение со всех карточек
    document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    
    let iterations = 0;
    const maxIterations = 20; // 20 смен карточек за 2 секунды
    let currentHighlightIndex = 0;
    
    const interval = setInterval(() => {
        // Убираем подсветку с предыдущей
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('highlight-animation'));
        
        // Подсвечиваем текущую
        const cards = document.querySelectorAll('.hero-card');
        if (cards.length > 0) {
            cards[currentHighlightIndex].classList.add('highlight-animation');
            
            // Прокручиваем к текущей карточке
            cards[currentHighlightIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        currentHighlightIndex = (currentHighlightIndex + 1) % cards.length;
        iterations++;
        
        if (iterations >= maxIterations) {
            clearInterval(interval);
            
            // Выбираем финального героя
            const finalIndex = Math.floor(Math.random() * heroesList.length);
            const finalHero = heroesList[finalIndex];
            const finalCard = document.querySelector(`.hero-card[data-index="${finalIndex}"]`);
            
            // Финальная подсветка
            document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('highlight-animation'));
            if (finalCard) {
                finalCard.classList.add('selected');
                finalCard.classList.add('final-select');
                
                // Прокручиваем к финальной карточке
                finalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // Показываем результат
            setTimeout(() => {
                showGridResult(finalHero.name, finalHero.image, finalCard);
                spinBtn.textContent = originalText;
                spinBtn.disabled = false;
                isSelecting = false;
                
                // Убираем анимацию подсветки
                setTimeout(() => {
                    if (finalCard) {
                        finalCard.classList.remove('highlight-animation', 'final-select');
                    }
                }, 1000);
            }, 300);
        }
    }, 100); // Каждые 100мс меняем подсветку
}

function showGridResult(heroName, heroImage, cardElement) {
    const resultDiv = document.getElementById('gridResult');
    const heroImg = document.getElementById('gridHeroImage');
    const heroNameEl = document.getElementById('gridHeroName');
    
    if (heroImg && heroNameEl) {
        heroImg.src = heroImage;
        heroNameEl.textContent = heroName;
        resultDiv.style.display = 'block';
        
        // Анимация появления
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'slideUp 0.5s ease';
        
        // Добавляем пульсацию к выбранной карточке
        if (cardElement) {
            cardElement.style.animation = 'pulseCard 0.6s ease-in-out';
            setTimeout(() => {
                cardElement.style.animation = '';
            }, 600);
        }
    }
}

// ==================== РЕЖИМ 3: СКРЫТОЕ КОЛЕСО С АНИМАЦИЕЙ ====================
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
    if (isRevealing) return;
    
    if (hiddenRevealed) {
        resetHiddenWheel();
        return;
    }
    
    isRevealing = true;
    const spinBtn = document.getElementById('hiddenSpinBtn');
    spinBtn.textContent = 'ОТКРЫВАЮ...';
    spinBtn.disabled = true;
    
    // Анимация вращения сундука
    const mysteryBox = document.getElementById('mysteryBox');
    const questionMark = mysteryBox.querySelector('.question-mark');
    
    // Вращение сундука
    let rotation = 0;
    const spinInterval = setInterval(() => {
        rotation += 45;
        if (mysteryBox) {
            mysteryBox.style.transform = `rotate(${rotation}deg) scale(1)`;
        }
    }, 100);
    
    // Эффект мерцания
    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
        if (mysteryBox) {
            mysteryBox.style.boxShadow = blinkCount % 2 === 0 
                ? '0 0 50px rgba(255, 215, 0, 0.8)' 
                : '0 0 20px rgba(255, 107, 107, 0.5)';
        }
        blinkCount++;
    }, 150);
    
    // Выбираем случайного героя
    const randomIndex = Math.floor(Math.random() * heroesList.length);
    const randomHero = heroesList[randomIndex];
    
    // Анимация открытия через 2 секунды
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
        
        // Скрываем вопросительный знак с анимацией
        if (questionMark) {
            questionMark.style.animation = 'none';
            questionMark.style.transition = 'all 0.3s ease';
            questionMark.style.opacity = '0';
            questionMark.style.transform = 'scale(0)';
        }
        
        // Добавляем свечение
        const glow = mysteryBox?.querySelector('.mystery-glow');
        if (glow) {
            glow.style.opacity = '1';
            glow.style.background = 'radial-gradient(circle, rgba(255,215,0,0.8), rgba(255,107,107,0.8))';
        }
        
        // Показываем результат с анимацией
        setTimeout(() => {
            showHiddenResult(randomHero.name, randomHero.image);
            
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
        
        // Добавляем анимацию конфетти эффект
        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'revealResult 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Создаем эффект вспышки
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

// Обновление при изменении списка героев
function refreshAll() {
    updateSegments();
    drawWheel();
    initGrid();
    resetHiddenWheel();
}
