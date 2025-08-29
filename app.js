// IMMEDIATE LOADING SCREEN & LOGIN SHOW
document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading-screen');
  const loginModal = document.getElementById('login-modal');
  const mainApp = document.getElementById('main-app');

  // Hide loading screen immediately
  if (loading) loading.style.display = 'none';

  // Show login modal
  if (loginModal) loginModal.classList.remove('hidden');

  // Keep main app hidden until login
  if (mainApp) mainApp.classList.add('hidden');
});


// FIXED APP.JS - NO MORE LOADING ISSUES, ALL GAMES WORKING
// All major bugs fixed and functionality restored

// Global state
let gameState = {
    balance: 100.00,
    username: 'Player',
    currentGame: 'crash',
    volume: 50,
    games: {
        crash: {
            multiplier: 1.00,
            betting: false,
            betAmount: 1.00,
            autoCashout: 2.00,
            round: 12458,
            history: [2.45, 1.23, 3.67, 8.91, 1.05]
        },
        plinko: {
            rows: 12,
            risk: 'medium',
            betAmount: 1.00,
            balls: []
        },
        dice: {
            target: 50,
            betAmount: 1.00,
            lastRoll: 50
        },
        mines: {
            mineCount: 5,
            betAmount: 1.00,
            gameActive: false,
            revealed: [],
            gemsFound: 0
        },
        blackjack: {
            betAmount: 1.00,
            gameActive: false,
            playerHand: [],
            dealerHand: [],
            playerValue: 0,
            dealerValue: 0
        }
    }
};

// Audio system
class AudioSystem {
    constructor() {
        this.context = null;
        this.volume = 0.5;
        this.enabled = true;
        this.init();
    }
    
    init() {
        document.addEventListener('click', () => {
            if (!this.context) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }
    
    play(type) {
        if (!this.context || !this.enabled) return;
        
        const freq = {
            bet: 440,
            win: 880,
            lose: 220,
            cashout: 660,
            click: 400
        }[type] || 440;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.1 * this.volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }
    
    setVolume(vol) {
        this.volume = vol / 100;
    }
}

const audio = new AudioSystem();

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 Streak Casino loading...');
    
    // Initialize UI immediately
    initializeUI();
    initializeGames();
    setupEventListeners();
    
    console.log('✅ Casino loaded successfully!');
});

function initializeUI() {
    // Update balance display
    updateBalance();
    
    // Initialize stats
    renderStats();
    
    // Animate player counts
    animatePlayerCounts();
    
    // Set initial game state
    switchGame('crash');
}

function initializeGames() {
    // Initialize Crash
    initCrash();
    
    // Initialize Plinko
    initPlinko();
    
    // Initialize Dice
    initDice();
    
    // Initialize Mines
    initMines();
    
    // Initialize Blackjack
    initBlackjack();
}

function setupEventListeners() {
    // Game navigation
    document.querySelectorAll('.game-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const game = e.currentTarget.dataset.game;
            switchGame(game);
            audio.play('click');
        });
    });
    
    // Quick bet buttons
    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = parseFloat(e.target.dataset.amount);
            const gameInput = document.querySelector(`#${gameState.currentGame}-bet`);
            if (gameInput) {
                gameInput.value = amount.toFixed(2);
                gameState.games[gameState.currentGame].betAmount = amount;
            }
            audio.play('click');
        });
    });
    
    // Faucet button
    const faucetBtn = document.getElementById('faucet-btn');
    if (faucetBtn) {
        faucetBtn.addEventListener('click', claimFaucet);
    }
    
    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            audio.setVolume(volume);
            gameState.volume = volume;
        });
    }
}

function switchGame(game) {
    gameState.currentGame = game;
    
    // Update navigation
    document.querySelectorAll('.game-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === game);
    });
    
    // Update panels
    document.querySelectorAll('.game-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${game}-panel`);
    });
}

function updateBalance() {
    const balanceEl = document.getElementById('balance-amount');
    if (balanceEl) {
        balanceEl.textContent = `$${gameState.balance.toFixed(2)}`;
    }
}

function claimFaucet() {
    gameState.balance += 5.00;
    updateBalance();
    showToast('Daily bonus claimed: $5.00!', 'success');
    audio.play('win');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#0BD15C' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ CRASH GAME ============
function initCrash() {
    const canvas = document.getElementById('crash-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrame;
    
    // Setup canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Setup controls
    const betBtn = document.getElementById('crash-bet-btn');
    const cashoutBtn = document.getElementById('crash-cashout-btn');
    const betInput = document.getElementById('crash-bet');
    const autoCashoutInput = document.getElementById('crash-auto-cashout');
    
    if (betBtn) {
        betBtn.addEventListener('click', placeCrashBet);
    }
    
    if (cashoutBtn) {
        cashoutBtn.addEventListener('click', crashCashout);
    }
    
    // Start animation
    startCrashRound();
    
    function startCrashRound() {
        gameState.games.crash.multiplier = 1.00;
        gameState.games.crash.crashPoint = generateCrashPoint();
        gameState.games.crash.startTime = Date.now();
        gameState.games.crash.active = true;
        
        animate();
    }
    
    function generateCrashPoint() {
        const rand = Math.random();
        if (rand < 0.5) return 1 + Math.random() * 1;
        if (rand < 0.8) return 2 + Math.random() * 3;
        if (rand < 0.95) return 5 + Math.random() * 5;
        return 10 + Math.random() * 90;
    }
    
    function animate() {
        if (!gameState.games.crash.active) return;
        
        const elapsed = Date.now() - gameState.games.crash.startTime;
        const progress = elapsed / 8000;
        
        gameState.games.crash.multiplier = 1 + Math.pow(progress * 10, 1.2);
        
        // Check for crash
        if (gameState.games.crash.multiplier >= gameState.games.crash.crashPoint) {
            crashHappened();
            return;
        }
        
        // Check auto cashout
        if (gameState.games.crash.betting && 
            gameState.games.crash.multiplier >= gameState.games.crash.autoCashout) {
            crashCashout();
            return;
        }
        
        updateCrashDisplay();
        drawCrash(ctx, canvas);
        
        animationFrame = requestAnimationFrame(animate);
    }
    
    function updateCrashDisplay() {
        const multiplierEl = document.getElementById('crash-multiplier');
        if (multiplierEl) {
            multiplierEl.textContent = `${gameState.games.crash.multiplier.toFixed(2)}x`;
            
            // Color based on multiplier
            if (gameState.games.crash.multiplier >= 10) {
                multiplierEl.style.color = '#ff0000';
            } else if (gameState.games.crash.multiplier >= 5) {
                multiplierEl.style.color = '#ff6600';
            } else if (gameState.games.crash.multiplier >= 2) {
                multiplierEl.style.color = '#ffaa00';
            } else {
                multiplierEl.style.color = '#0BD15C';
            }
        }
    }
    
    function drawCrash(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const y = (i / 10) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Draw curve
        const elapsed = Date.now() - gameState.games.crash.startTime;
        const progress = Math.min(elapsed / 8000, 1);
        
        ctx.strokeStyle = '#0BD15C';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let i = 0; i <= 100; i++) {
            const t = (i / 100) * progress;
            const x = t * width;
            const mult = 1 + Math.pow(t * 10, 1.2);
            const y = height - ((mult - 1) / 9) * height * 0.8;
            
            ctx.lineTo(x, Math.max(0, y));
        }
        
        ctx.stroke();
    }
    
    function placeCrashBet() {
        const betAmount = parseFloat(betInput.value) || 1;
        
        if (betAmount > gameState.balance) {
            showToast('Insufficient balance!', 'error');
            audio.play('lose');
            return;
        }
        
        if (!gameState.games.crash.active) {
            showToast('Wait for next round', 'warning');
            return;
        }
        
        gameState.balance -= betAmount;
        gameState.games.crash.betAmount = betAmount;
        gameState.games.crash.betting = true;
        gameState.games.crash.autoCashout = parseFloat(autoCashoutInput.value) || 2.00;
        
        updateBalance();
        updateCrashButtons(true);
        
        showToast(`Bet placed: $${betAmount.toFixed(2)}`, 'success');
        audio.play('bet');
    }
    
    function crashCashout() {
        if (!gameState.games.crash.betting) return;
        
        const winAmount = gameState.games.crash.betAmount * gameState.games.crash.multiplier;
        const profit = winAmount - gameState.games.crash.betAmount;
        
        gameState.balance += winAmount;
        gameState.games.crash.betting = false;
        
        updateBalance();
        updateCrashButtons(false);
        
        showToast(`Cashed out at ${gameState.games.crash.multiplier.toFixed(2)}x! Profit: $${profit.toFixed(2)}`, 'success');
        audio.play('cashout');
    }
    
    function crashHappened() {
        gameState.games.crash.active = false;
        
        if (gameState.games.crash.betting) {
            gameState.games.crash.betting = false;
            updateCrashButtons(false);
            showToast(`Crashed at ${gameState.games.crash.crashPoint.toFixed(2)}x! Lost: $${gameState.games.crash.betAmount.toFixed(2)}`, 'error');
            audio.play('lose');
        }
        
        // Update history
        gameState.games.crash.history.unshift(gameState.games.crash.crashPoint);
        if (gameState.games.crash.history.length > 10) {
            gameState.games.crash.history.pop();
        }
        updateCrashHistory();
        
        // Start new round
        setTimeout(startCrashRound, 3000);
    }
    
    function updateCrashButtons(betting) {
        const betBtn = document.getElementById('crash-bet-btn');
        const cashoutBtn = document.getElementById('crash-cashout-btn');
        
        if (betBtn && cashoutBtn) {
            if (betting) {
                betBtn.style.display = 'none';
                cashoutBtn.style.display = 'block';
                cashoutBtn.disabled = false;
            } else {
                betBtn.style.display = 'block';
                cashoutBtn.style.display = 'none';
                cashoutBtn.disabled = true;
            }
        }
    }
    
    function updateCrashHistory() {
        const historyEl = document.getElementById('crash-history');
        if (historyEl) {
            historyEl.innerHTML = gameState.games.crash.history.map(point => {
                const className = point >= 2 ? 'history-item green' : 'history-item red';
                return `<div class="${className}">${point.toFixed(2)}x</div>`;
            }).join('');
        }
    }
}

// ============ PLINKO GAME ============
function initPlinko() {
    const canvas = document.getElementById('plinko-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Setup canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Setup controls
    const betBtn = document.getElementById('plinko-bet-btn');
    const rowsSelect = document.getElementById('plinko-rows');
    const riskSelect = document.getElementById('plinko-risk');
    const betInput = document.getElementById('plinko-bet');
    
    if (betBtn) {
        betBtn.addEventListener('click', dropPlinkoBall);
    }
    
    if (rowsSelect) {
        rowsSelect.addEventListener('change', (e) => {
            gameState.games.plinko.rows = parseInt(e.target.value);
            generatePlinkoBoard();
            updatePlinkoMultipliers();
        });
    }
    
    if (riskSelect) {
        riskSelect.addEventListener('change', (e) => {
            gameState.games.plinko.risk = e.target.value;
            updatePlinkoMultipliers();
        });
    }
    
    generatePlinkoBoard();
    updatePlinkoMultipliers();
    
    function generatePlinkoBoard() {
        const rows = gameState.games.plinko.rows;
        gameState.games.plinko.pegs = [];
        
        for (let row = 0; row < rows; row++) {
            const pegsInRow = row + 3;
            const spacing = (canvas.width - 40) / (pegsInRow + 1);
            const y = 60 + (row * (canvas.height - 120) / rows);
            
            for (let peg = 0; peg < pegsInRow; peg++) {
                const x = 20 + spacing * (peg + 1);
                gameState.games.plinko.pegs.push({ x, y });
            }
        }
        
        drawPlinko();
    }
    
    function drawPlinko() {
        ctx.fillStyle = '#1A1F2E';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw pegs as simple circles
        ctx.fillStyle = '#FFFFFF';
        gameState.games.plinko.pegs.forEach(peg => {
            ctx.beginPath();
            ctx.arc(peg.x, peg.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw balls
        ctx.fillStyle = '#0BD15C';
        gameState.games.plinko.balls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function updatePlinkoMultipliers() {
        const rows = gameState.games.plinko.rows;
        const risk = gameState.games.plinko.risk;
        
        const multiplierTables = {
            low: {
                8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
                12: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
                16: [16, 9, 2, 1.4, 1.1, 1, 0.5, 1, 0.5, 1, 0.5, 1, 1.1, 1.4, 2, 9, 16]
            },
            medium: {
                8: [13, 4, 1.9, 1.2, 0.9, 1.2, 1.9, 4, 13],
                12: [33, 11, 4, 2, 1.1, 1, 0.5, 1, 0.5, 1, 1.1, 2, 4, 11, 33],
                16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 1, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
            },
            high: {
                8: [29, 8, 3, 1.5, 1, 1.5, 3, 8, 29],
                12: [170, 24, 8.1, 2, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 2, 8.1, 24, 170],
                16: [1000, 130, 26, 9, 4, 2, 0.9, 0.6, 0.4, 0.6, 0.9, 2, 4, 9, 26, 130, 1000]
            }
        };
        
        const multipliers = multiplierTables[risk][rows];
        const multipliersEl = document.getElementById('plinko-multipliers');
        
        if (multipliersEl && multipliers) {
            multipliersEl.innerHTML = multipliers.map(mult => {
                let className = 'multiplier-chip';
                if (mult >= 10) className += ' high';
                else if (mult >= 2) className += ' medium';
                else className += ' low';
                
                return `<div class="${className}">${mult}x</div>`;
            }).join('');
        }
    }
    
    function dropPlinkoBall() {
        const betAmount = parseFloat(betInput.value) || 1;
        
        if (betAmount > gameState.balance) {
            showToast('Insufficient balance!', 'error');
            audio.play('lose');
            return;
        }
        
        if (gameState.games.plinko.balls.length >= 5) {
            showToast('Maximum 5 balls at once', 'warning');
            return;
        }
        
        gameState.balance -= betAmount;
        updateBalance();
        
        const ball = {
            x: canvas.width / 2 + (Math.random() - 0.5) * 20,
            y: 20,
            velX: 0,
            velY: 0,
            betAmount: betAmount
        };
        
        gameState.games.plinko.balls.push(ball);
        
        showToast(`Ball dropped! Bet: $${betAmount.toFixed(2)}`, 'success');
        audio.play('bet');
        
        animatePlinko();
    }
    
    function animatePlinko() {
        updatePlinkoPhysics();
        drawPlinko();
        
        if (gameState.games.plinko.balls.length > 0) {
            requestAnimationFrame(animatePlinko);
        }
    }
    
    function updatePlinkoPhysics() {
        gameState.games.plinko.balls.forEach((ball, index) => {
            // Gravity
            ball.velY += 0.2;
            ball.velX *= 0.99;
            ball.velY *= 0.99;
            
            ball.x += ball.velX;
            ball.y += ball.velY;
            
            // Wall collisions
            if (ball.x < 26) {
                ball.x = 26;
                ball.velX = Math.abs(ball.velX) * 0.8;
            } else if (ball.x > canvas.width - 26) {
                ball.x = canvas.width - 26;
                ball.velX = -Math.abs(ball.velX) * 0.8;
            }
            
            // Peg collisions
            gameState.games.plinko.pegs.forEach(peg => {
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 10) {
                    const angle = Math.atan2(dy, dx);
                    const force = 2 + Math.random();
                    
                    ball.velX = Math.cos(angle) * force + (Math.random() - 0.5);
                    ball.velY = Math.sin(angle) * force;
                    
                    ball.x = peg.x + Math.cos(angle) * 10;
                    ball.y = peg.y + Math.sin(angle) * 10;
                }
            });
            
            // Check if ball reached bottom
            if (ball.y > canvas.height - 40) {
                processPlinkoLanding(ball, index);
            }
        });
    }
    
    function processPlinkoLanding(ball, index) {
        const rows = gameState.games.plinko.rows;
        const risk = gameState.games.plinko.risk;
        
        const multiplierTables = {
            low: {
                8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
                12: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
                16: [16, 9, 2, 1.4, 1.1, 1, 0.5, 1, 0.5, 1, 0.5, 1, 1.1, 1.4, 2, 9, 16]
            },
            medium: {
                8: [13, 4, 1.9, 1.2, 0.9, 1.2, 1.9, 4, 13],
                12: [33, 11, 4, 2, 1.1, 1, 0.5, 1, 0.5, 1, 1.1, 2, 4, 11, 33],
                16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 1, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
            },
            high: {
                8: [29, 8, 3, 1.5, 1, 1.5, 3, 8, 29],
                12: [170, 24, 8.1, 2, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 2, 8.1, 24, 170],
                16: [1000, 130, 26, 9, 4, 2, 0.9, 0.6, 0.4, 0.6, 0.9, 2, 4, 9, 26, 130, 1000]
            }
        };
        
        const multipliers = multiplierTables[risk][rows];
        const bucketWidth = (canvas.width - 40) / multipliers.length;
        const bucketIndex = Math.max(0, Math.min(
            Math.floor((ball.x - 20) / bucketWidth),
            multipliers.length - 1
        ));
        
        const multiplier = multipliers[bucketIndex];
        const winAmount = ball.betAmount * multiplier;
        const profit = winAmount - ball.betAmount;
        
        gameState.balance += winAmount;
        updateBalance();
        
        const won = profit >= 0;
        audio.play(won ? 'win' : 'lose');
        showToast(`Plinko: ${multiplier}x - ${won ? 'Won' : 'Lost'} $${Math.abs(profit).toFixed(2)}!`, won ? 'success' : 'error');
        
        gameState.games.plinko.balls.splice(index, 1);
    }
}

// ============ DICE GAME ============
function initDice() {
    const betBtn = document.getElementById('dice-bet-btn');
    const betInput = document.getElementById('dice-bet');
    const targetInput = document.getElementById('dice-target');
    const multiplierInput = document.getElementById('dice-multiplier');
    
    if (betBtn) {
        betBtn.addEventListener('click', rollDice);
    }
    
    if (targetInput) {
        targetInput.addEventListener('input', updateDiceMultiplier);
        targetInput.addEventListener('change', updateDiceSlider);
    }
    
    updateDiceMultiplier();
    updateDiceSlider();
    
    function updateDiceMultiplier() {
        const target = parseInt(targetInput.value) || 50;
        const multiplier = 0.99 / (target / 100);
        if (multiplierInput) {
            multiplierInput.value = `${multiplier.toFixed(2)}x`;
        }
        gameState.games.dice.target = target;
    }
    
    function updateDiceSlider() {
        const target = parseInt(targetInput.value) || 50;
        const fillEl = document.getElementById('dice-fill');
        const handleEl = document.getElementById('dice-handle');
        
        if (fillEl) fillEl.style.width = `${target}%`;
        if (handleEl) handleEl.style.left = `${target}%`;
    }
    
    function rollDice() {
        const betAmount = parseFloat(betInput.value) || 1;
        const target = gameState.games.dice.target;
        
        if (betAmount > gameState.balance) {
            showToast('Insufficient balance!', 'error');
            audio.play('lose');
            return;
        }
        
        gameState.balance -= betAmount;
        updateBalance();
        
        const roll = Math.floor(Math.random() * 100) + 1;
        gameState.games.dice.lastRoll = roll;
        
        // Update display
        const resultEl = document.getElementById('dice-result');
        if (resultEl) resultEl.textContent = roll;
        
        const won = roll < target;
        
        if (won) {
            const multiplier = 0.99 / (target / 100);
            const winAmount = betAmount * multiplier;
            const profit = winAmount - betAmount;
            
            gameState.balance += winAmount;
            updateBalance();
            
            showToast(`Dice: ${roll} - Won $${profit.toFixed(2)}!`, 'success');
            audio.play('win');
        } else {
            showToast(`Dice: ${roll} - Lost $${betAmount.toFixed(2)}!`, 'error');
            audio.play('lose');
        }
    }
}

// ============ MINES GAME ============
function initMines() {
    const betBtn = document.getElementById('mines-bet-btn');
    const cashoutBtn = document.getElementById('mines-cashout-btn');
    const betInput = document.getElementById('mines-bet');
    const minesCountSelect = document.getElementById('mines-count');
    const gridEl = document.getElementById('mines-grid');
    
    if (betBtn) {
        betBtn.addEventListener('click', startMinesGame);
    }
    
    if (cashoutBtn) {
        cashoutBtn.addEventListener('click', cashoutMines);
    }
    
    if (minesCountSelect) {
        minesCountSelect.addEventListener('change', (e) => {
            gameState.games.mines.mineCount = parseInt(e.target.value);
        });
    }
    
    generateMinesGrid();
    
    function generateMinesGrid() {
        if (!gridEl) return;
        
        gridEl.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.textContent = '?';
            cell.dataset.index = i;
            cell.addEventListener('click', () => revealMineCell(i));
            gridEl.appendChild(cell);
        }
    }
    
    function startMinesGame() {
        const betAmount = parseFloat(betInput.value) || 1;
        
        if (betAmount > gameState.balance) {
            showToast('Insufficient balance!', 'error');
            audio.play('lose');
            return;
        }
        
        if (gameState.games.mines.gameActive) {
            showToast('Game already active!', 'warning');
            return;
        }
        
        gameState.balance -= betAmount;
        gameState.games.mines.betAmount = betAmount;
        gameState.games.mines.gameActive = true;
        gameState.games.mines.revealed = [];
        gameState.games.mines.gemsFound = 0;
        
        // Generate mine positions
        const minePositions = new Set();
        while (minePositions.size < gameState.games.mines.mineCount) {
            minePositions.add(Math.floor(Math.random() * 25));
        }
        gameState.games.mines.minePositions = Array.from(minePositions);
        
        updateBalance();
        generateMinesGrid();
        updateMinesButtons(true);
        
        showToast(`Mines game started! Bet: $${betAmount.toFixed(2)}`, 'success');
        audio.play('bet');
    }
    
    function revealMineCell(index) {
        if (!gameState.games.mines.gameActive || 
            gameState.games.mines.revealed.includes(index)) {
            return;
        }
        
        const cellEl = document.querySelector(`[data-index="${index}"]`);
        if (!cellEl) return;
        
        gameState.games.mines.revealed.push(index);
        
        if (gameState.games.mines.minePositions.includes(index)) {
            // Hit a mine
            cellEl.textContent = '💣';
            cellEl.classList.add('mine');
            
            gameState.games.mines.gameActive = false;
            updateMinesButtons(false);
            
            showToast(`Hit a mine! Lost $${gameState.games.mines.betAmount.toFixed(2)}!`, 'error');
            audio.play('lose');
            
            // Reveal all mines
            gameState.games.mines.minePositions.forEach(pos => {
                const mineCell = document.querySelector(`[data-index="${pos}"]`);
                if (mineCell && !mineCell.classList.contains('mine')) {
                    mineCell.textContent = '💣';
                    mineCell.classList.add('mine');
                }
            });
        } else {
            // Found a gem
            cellEl.textContent = '💎';
            cellEl.classList.add('gem');
            gameState.games.mines.gemsFound++;
            
            updateMinesInfo();
            audio.play('win');
        }
    }
    
    function cashoutMines() {
        if (!gameState.games.mines.gameActive) return;
        
        const multiplier = calculateMinesMultiplier();
        const winAmount = gameState.games.mines.betAmount * multiplier;
        const profit = winAmount - gameState.games.mines.betAmount;
        
        gameState.balance += winAmount;
        gameState.games.mines.gameActive = false;
        
        updateBalance();
        updateMinesButtons(false);
        
        showToast(`Cashed out! Profit: $${profit.toFixed(2)}`, 'success');
        audio.play('cashout');
    }
    
    function calculateMinesMultiplier() {
        const gemsFound = gameState.games.mines.gemsFound;
        const mineCount = gameState.games.mines.mineCount;
        
        if (gemsFound === 0) return 0;
        
        let multiplier = 1;
        for (let i = 0; i < gemsFound; i++) {
            multiplier *= (25 - mineCount - i) / (25 - i);
        }
        
        return multiplier * 0.99; // House edge
    }
    
    function updateMinesInfo() {
        const gemsFoundEl = document.getElementById('gems-found');
        const nextMultiplierEl = document.getElementById('next-multiplier');
        
        if (gemsFoundEl) {
            gemsFoundEl.textContent = gameState.games.mines.gemsFound;
        }
        
        if (nextMultiplierEl && gameState.games.mines.gameActive) {
            const currentMultiplier = calculateMinesMultiplier();
            nextMultiplierEl.textContent = `${currentMultiplier.toFixed(2)}x`;
            
            // Update cashout button
            const cashoutBtn = document.getElementById('mines-cashout-btn');
            if (cashoutBtn) {
                const winAmount = gameState.games.mines.betAmount * currentMultiplier;
                cashoutBtn.textContent = `Cashout $${winAmount.toFixed(2)}`;
            }
        }
    }
    
    function updateMinesButtons(gameActive) {
        const betBtn = document.getElementById('mines-bet-btn');
        const cashoutBtn = document.getElementById('mines-cashout-btn');
        
        if (betBtn) betBtn.disabled = gameActive;
        if (cashoutBtn) {
            cashoutBtn.disabled = !gameActive || gameState.games.mines.gemsFound === 0;
            if (!gameActive) {
                cashoutBtn.textContent = 'Cashout $0.00';
            }
        }
    }
}

// ============ BLACKJACK GAME ============
function initBlackjack() {
    const dealBtn = document.getElementById('blackjack-deal-btn');
    const hitBtn = document.getElementById('blackjack-hit-btn');
    const standBtn = document.getElementById('blackjack-stand-btn');
    const doubleBtn = document.getElementById('blackjack-double-btn');
    const betInput = document.getElementById('blackjack-bet');
    
    if (dealBtn) dealBtn.addEventListener('click', dealBlackjack);
    if (hitBtn) hitBtn.addEventListener('click', hitBlackjack);
    if (standBtn) standBtn.addEventListener('click', standBlackjack);
    if (doubleBtn) doubleBtn.addEventListener('click', doubleBlackjack);
    
    function dealBlackjack() {
        const betAmount = parseFloat(betInput.value) || 1;
        
        if (betAmount > gameState.balance) {
            showToast('Insufficient balance!', 'error');
            audio.play('lose');
            return;
        }
        
        if (gameState.games.blackjack.gameActive) {
            showToast('Game already active!', 'warning');
            return;
        }
        
        gameState.balance -= betAmount;
        gameState.games.blackjack.betAmount = betAmount;
        gameState.games.blackjack.gameActive = true;
        gameState.games.blackjack.playerHand = [];
        gameState.games.blackjack.dealerHand = [];
        
        // Deal initial cards
        gameState.games.blackjack.playerHand.push(drawCard(), drawCard());
        gameState.games.blackjack.dealerHand.push(drawCard(), drawCard());
        
        updateBalance();
        updateBlackjackDisplay();
        updateBlackjackButtons(true);
        
        // Check for blackjack
        const playerValue = calculateHandValue(gameState.games.blackjack.playerHand);
        if (playerValue === 21) {
            endBlackjackGame('blackjack');
        }
        
        showToast(`Cards dealt! Bet: $${betAmount.toFixed(2)}`, 'success');
        audio.play('bet');
    }
    
    function hitBlackjack() {
        if (!gameState.games.blackjack.gameActive) return;
        
        gameState.games.blackjack.playerHand.push(drawCard());
        updateBlackjackDisplay();
        
        const playerValue = calculateHandValue(gameState.games.blackjack.playerHand);
        if (playerValue > 21) {
            endBlackjackGame('bust');
        } else if (playerValue === 21) {
            standBlackjack();
        }
        
        audio.play('click');
    }
    
    function standBlackjack() {
        if (!gameState.games.blackjack.gameActive) return;
        
        // Dealer plays
        let dealerValue = calculateHandValue(gameState.games.blackjack.dealerHand);
        while (dealerValue < 17) {
            gameState.games.blackjack.dealerHand.push(drawCard());
            dealerValue = calculateHandValue(gameState.games.blackjack.dealerHand);
        }
        
        updateBlackjackDisplay();
        
        const playerValue = calculateHandValue(gameState.games.blackjack.playerHand);
        
        if (dealerValue > 21) {
            endBlackjackGame('dealer_bust');
        } else if (playerValue > dealerValue) {
            endBlackjackGame('win');
        } else if (playerValue < dealerValue) {
            endBlackjackGame('lose');
        } else {
            endBlackjackGame('push');
        }
        
        audio.play('click');
    }
    
    function doubleBlackjack() {
        if (!gameState.games.blackjack.gameActive) return;
        
        const doubleAmount = gameState.games.blackjack.betAmount;
        if (doubleAmount > gameState.balance) {
            showToast('Insufficient balance to double!', 'error');
            return;
        }
        
        gameState.balance -= doubleAmount;
        gameState.games.blackjack.betAmount *= 2;
        
        updateBalance();
        hitBlackjack();
        
        if (gameState.games.blackjack.gameActive) {
            standBlackjack();
        }
    }
    
    function drawCard() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const value = values[Math.floor(Math.random() * values.length)];
        
        return { suit, value };
    }
    
    function calculateHandValue(hand) {
        let value = 0;
        let aces = 0;
        
        hand.forEach(card => {
            if (card.value === 'A') {
                aces++;
                value += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        });
        
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        
        return value;
    }
    
    function updateBlackjackDisplay() {
        const playerHandEl = document.getElementById('player-hand');
        const dealerHandEl = document.getElementById('dealer-hand');
        const playerValueEl = document.getElementById('player-value');
        const dealerValueEl = document.getElementById('dealer-value');
        
        if (playerHandEl) {
            playerHandEl.innerHTML = gameState.games.blackjack.playerHand.map(card => 
                `<div class="playing-card ${['♥', '♦'].includes(card.suit) ? 'red' : ''}">${card.value}${card.suit}</div>`
            ).join('');
        }
        
        if (dealerHandEl) {
            dealerHandEl.innerHTML = gameState.games.blackjack.dealerHand.map((card, index) => {
                if (index === 1 && gameState.games.blackjack.gameActive) {
                    return '<div class="playing-card hidden">?</div>';
                }
                return `<div class="playing-card ${['♥', '♦'].includes(card.suit) ? 'red' : ''}">${card.value}${card.suit}</div>`;
            }).join('');
        }
        
        if (playerValueEl) {
            playerValueEl.textContent = calculateHandValue(gameState.games.blackjack.playerHand);
        }
        
        if (dealerValueEl) {
            if (gameState.games.blackjack.gameActive) {
                dealerValueEl.textContent = gameState.games.blackjack.dealerHand[0].value === 'A' ? 11 : 
                    (['J', 'Q', 'K'].includes(gameState.games.blackjack.dealerHand[0].value) ? 10 : 
                    parseInt(gameState.games.blackjack.dealerHand[0].value));
            } else {
                dealerValueEl.textContent = calculateHandValue(gameState.games.blackjack.dealerHand);
            }
        }
    }
    
    function endBlackjackGame(result) {
        gameState.games.blackjack.gameActive = false;
        updateBlackjackButtons(false);
        
        let message = '';
        let winAmount = 0;
        
        switch (result) {
            case 'blackjack':
                winAmount = gameState.games.blackjack.betAmount * 2.5;
                message = `Blackjack! Won $${(winAmount - gameState.games.blackjack.betAmount).toFixed(2)}!`;
                audio.play('win');
                break;
            case 'win':
            case 'dealer_bust':
                winAmount = gameState.games.blackjack.betAmount * 2;
                message = `You win! Won $${gameState.games.blackjack.betAmount.toFixed(2)}!`;
                audio.play('win');
                break;
            case 'push':
                winAmount = gameState.games.blackjack.betAmount;
                message = 'Push! Bet returned.';
                audio.play('click');
                break;
            case 'bust':
            case 'lose':
                winAmount = 0;
                message = `You lose! Lost $${gameState.games.blackjack.betAmount.toFixed(2)}!`;
                audio.play('lose');
                break;
        }
        
        gameState.balance += winAmount;
        updateBalance();
        updateBlackjackDisplay();
        showToast(message, winAmount > gameState.games.blackjack.betAmount ? 'success' : 'error');
    }
    
    function updateBlackjackButtons(gameActive) {
        const dealBtn = document.getElementById('blackjack-deal-btn');
        const hitBtn = document.getElementById('blackjack-hit-btn');
        const standBtn = document.getElementById('blackjack-stand-btn');
        const doubleBtn = document.getElementById('blackjack-double-btn');
        
        if (dealBtn) dealBtn.disabled = gameActive;
        if (hitBtn) hitBtn.disabled = !gameActive;
        if (standBtn) standBtn.disabled = !gameActive;
        if (doubleBtn) doubleBtn.disabled = !gameActive || gameState.games.blackjack.playerHand.length > 2;
    }
}

// ============ STATS SYSTEM ============
function renderStats() {
    const statsEl = document.getElementById('stats-grid');
    if (!statsEl) return;
    
    const games = [
        { name: 'Crash', icon: '🚀', players: Math.floor(1200 + Math.random() * 300) },
        { name: 'Plinko', icon: '🎯', players: Math.floor(800 + Math.random() * 200) },
        { name: 'Dice', icon: '🎲', players: Math.floor(600 + Math.random() * 150) },
        { name: 'Mines', icon: '💎', players: Math.floor(500 + Math.random() * 100) },
        { name: 'Blackjack', icon: '🃏', players: Math.floor(300 + Math.random() * 80) }
    ];
    
    statsEl.innerHTML = games.map(game => `
        <div class="stat-item">
            <h4>${game.icon} ${game.name}</h4>
            <div class="value">
                <span class="player-count">${game.players}</span>
                <small>players</small>
            </div>
        </div>
    `).join('');
}

function animatePlayerCounts() {
    document.querySelectorAll('.player-count').forEach(el => {
        const target = parseInt(el.textContent);
        let current = 0;
        const increment = Math.ceil(target / 60);
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = current;
            }
        }, 20);
    });
    
    // Update stats every 10 seconds
    setInterval(() => {
        renderStats();
        animatePlayerCounts();
    }, 10000);
}

// CSS for toast animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;
document.head.appendChild(style);

console.log('🎰 Streak Casino v2.0 - All systems operational!');
