// CRASH GAME - CLOUDFLARE PAGES COMPATIBLE
// State Management
let gameState = {
    balance: 100.00,
    username: '',
    loggedIn: false,
    crash: {
        active: false,
        betting: false,
        startTime: 0,
        multiplier: 1.00,
        crashPoint: 0,
        betAmount: 0,
        autoCashout: 2.00,
        round: 12458,
        history: [2.45, 1.23, 3.67, 8.91, 1.05, 4.21, 1.78, 6.43, 2.89, 5.67]
    }
};

// DOM Elements
const elements = {
    loadingScreen: null,
    loginModal: null,
    mainApp: null,
    loginBtn: null,
    loginUsername: null,
    loginPassword: null,
    logoutBtn: null,
    balanceAmount: null,
    usernameDisplay: null,
    canvas: null,
    ctx: null,
    multiplierDisplay: null,
    betInput: null,
    autoInput: null,
    betBtn: null,
    cashBtn: null,
    historyList: null,
    roundNumber: null
};

// Audio System
class AudioSystem {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.volume = 0.5;
    }
    
    init() {
        if (!this.context) {
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Audio not available');
            }
        }
    }
    
    play(type) {
        if (!this.context || !this.enabled) return;
        
        const frequencies = {
            bet: 440,
            win: 880,
            lose: 220,
            cashout: 660,
            click: 400
        };
        
        const freq = frequencies[type] || 440;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1 * this.volume, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.context.currentTime + 0.1);
        } catch (e) {
            console.warn('Audio play failed');
        }
    }
}

const audio = new AudioSystem();

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 Streak Casino - Crash Game Loading...');
    
    // Get DOM elements
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.loginModal = document.getElementById('login-modal');
    elements.mainApp = document.getElementById('main-app');
    elements.loginBtn = document.getElementById('login-btn');
    elements.loginUsername = document.getElementById('login-username');
    elements.loginPassword = document.getElementById('login-password');
    elements.logoutBtn = document.getElementById('logout-btn');
    elements.balanceAmount = document.getElementById('balance-amount');
    elements.usernameDisplay = document.getElementById('username-display');
    elements.canvas = document.getElementById('crash-chart');
    elements.multiplierDisplay = document.getElementById('crash-multiplier');
    elements.betInput = document.getElementById('crash-bet');
    elements.autoInput = document.getElementById('crash-auto');
    elements.betBtn = document.getElementById('crash-bet-btn');
    elements.cashBtn = document.getElementById('crash-cash-btn');
    elements.historyList = document.getElementById('crash-history-list');
    elements.roundNumber = document.getElementById('round-number');
    
    if (elements.canvas) {
        elements.ctx = elements.canvas.getContext('2d');
        setupCanvas();
    }
    
    // Initialize app flow
    initializeApp();
    
    console.log('✅ Crash Game Loaded Successfully');
});

// Initialize App Flow
function initializeApp() {
    // Check for existing session
    const savedUser = localStorage.getItem('streak_username');
    const savedBalance = localStorage.getItem('streak_balance');
    
    if (savedUser) {
        gameState.username = savedUser;
        gameState.balance = parseFloat(savedBalance) || 100.00;
        gameState.loggedIn = true;
        
        // Skip login, go straight to game
        showMainApp();
    } else {
        // Show login flow
        showLoginModal();
    }
    
    setupEventListeners();
}

// Show/Hide UI Elements
function hideLoadingScreen() {
    if (elements.loadingScreen) {
        elements.loadingScreen.classList.add('hidden');
    }
}

function showLoginModal() {
    hideLoadingScreen();
    if (elements.loginModal) {
        elements.loginModal.classList.remove('hidden');
    }
}

function hideLoginModal() {
    if (elements.loginModal) {
        elements.loginModal.classList.add('hidden');
    }
}

function showMainApp() {
    hideLoadingScreen();
    hideLoginModal();
    if (elements.mainApp) {
        elements.mainApp.classList.remove('hidden');
    }
    updateUI();
    initializeCrashGame();
}

// Event Listeners
function setupEventListeners() {
    // Login
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', handleLogin);
    }
    
    if (elements.loginUsername) {
        elements.loginUsername.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    if (elements.loginPassword) {
        elements.loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Game controls
    if (elements.betBtn) {
        elements.betBtn.addEventListener('click', placeBet);
    }
    
    if (elements.cashBtn) {
        elements.cashBtn.addEventListener('click', cashout);
    }
    
    // Quick bet buttons
    document.querySelectorAll('.quick-bet').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseFloat(this.dataset.amount);
            if (elements.betInput) {
                elements.betInput.value = amount.toFixed(2);
            }
            audio.play('click');
        });
    });
    
    // Auto input changes
    if (elements.autoInput) {
        elements.autoInput.addEventListener('input', function() {
            gameState.crash.autoCashout = parseFloat(this.value) || 2.00;
        });
    }
    
    // Initialize audio on first click
    document.addEventListener('click', function() {
        audio.init();
    }, { once: true });
}

// Login Handler
function handleLogin() {
    const username = elements.loginUsername?.value?.trim();
    const password = elements.loginPassword?.value;
    
    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }
    
    if (username.length < 3) {
        showToast('Username must be at least 3 characters', 'error');
        return;
    }
    
    // Mock login success
    gameState.username = username;
    gameState.loggedIn = true;
    
    // Save to localStorage
    localStorage.setItem('streak_username', username);
    localStorage.setItem('streak_balance', gameState.balance.toString());
    
    showMainApp();
    showToast(`Welcome, ${username}!`, 'success');
    audio.play('win');
}

// Logout Handler
function handleLogout() {
    gameState.loggedIn = false;
    gameState.username = '';
    
    // Clear localStorage
    localStorage.removeItem('streak_username');
    localStorage.removeItem('streak_balance');
    
    // Reset form
    if (elements.loginUsername) elements.loginUsername.value = '';
    if (elements.loginPassword) elements.loginPassword.value = '';
    
    // Show login
    if (elements.mainApp) elements.mainApp.classList.add('hidden');
    showLoginModal();
    
    showToast('Logged out successfully', 'info');
}

// Update UI
function updateUI() {
    if (elements.balanceAmount) {
        elements.balanceAmount.textContent = `$${gameState.balance.toFixed(2)}`;
    }
    
    if (elements.usernameDisplay) {
        elements.usernameDisplay.textContent = gameState.username || 'Player';
    }
    
    if (elements.roundNumber) {
        elements.roundNumber.textContent = `#${gameState.crash.round}`;
    }
}

// Canvas Setup
function setupCanvas() {
    if (!elements.canvas || !elements.ctx) return;
    
    const rect = elements.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    elements.canvas.width = rect.width * dpr;
    elements.canvas.height = rect.height * dpr;
    elements.ctx.scale(dpr, dpr);
    
    elements.canvas.style.width = rect.width + 'px';
    elements.canvas.style.height = rect.height + 'px';
}

// Crash Game Logic
function initializeCrashGame() {
    updateCrashHistory();
    startNewRound();
}

function startNewRound() {
    gameState.crash.active = true;
    gameState.crash.startTime = Date.now();
    gameState.crash.multiplier = 1.00;
    gameState.crash.crashPoint = generateCrashPoint();
    gameState.crash.round++;
    
    updateUI();
    animate();
}

function generateCrashPoint() {
    const random = Math.random();
    
    // Realistic crash distribution
    if (random < 0.5) return 1 + Math.random() * 1; // 1.0x - 2.0x (50%)
    if (random < 0.8) return 2 + Math.random() * 3; // 2.0x - 5.0x (30%)
    if (random < 0.95) return 5 + Math.random() * 5; // 5.0x - 10.0x (15%)
    return 10 + Math.random() * 90; // 10.0x - 100.0x (5%)
}

function animate() {
    if (!gameState.crash.active) return;
    
    const elapsed = Date.now() - gameState.crash.startTime;
    const progress = elapsed / 8000; // 8 second max round
    
    // Calculate multiplier with realistic curve
    gameState.crash.multiplier = 1 + Math.pow(progress * 10, 1.2);
    
    // Check for crash
    if (gameState.crash.multiplier >= gameState.crash.crashPoint) {
        crashHappened();
        return;
    }
    
    // Check auto-cashout
    if (gameState.crash.betting && gameState.crash.multiplier >= gameState.crash.autoCashout) {
        cashout();
        return;
    }
    
    updateCrashDisplay();
    drawCrashChart();
    
    requestAnimationFrame(animate);
}

function updateCrashDisplay() {
    if (elements.multiplierDisplay) {
        elements.multiplierDisplay.textContent = `${gameState.crash.multiplier.toFixed(2)}x`;
        
        // Color based on multiplier
        if (gameState.crash.multiplier >= 10) {
            elements.multiplierDisplay.style.color = '#ff0000';
        } else if (gameState.crash.multiplier >= 5) {
            elements.multiplierDisplay.style.color = '#ff6600';
        } else if (gameState.crash.multiplier >= 2) {
            elements.multiplierDisplay.style.color = '#ffaa00';
        } else {
            elements.multiplierDisplay.style.color = '#0BD15C';
        }
    }
}

function drawCrashChart() {
    if (!elements.ctx || !elements.canvas) return;
    
    const width = elements.canvas.width / (window.devicePixelRatio || 1);
    const height = elements.canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    elements.ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    elements.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    elements.ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * height;
        elements.ctx.beginPath();
        elements.ctx.moveTo(0, y);
        elements.ctx.lineTo(width, y);
        elements.ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        elements.ctx.beginPath();
        elements.ctx.moveTo(x, 0);
        elements.ctx.lineTo(x, height);
        elements.ctx.stroke();
    }
    
    // Draw curve
    const elapsed = Date.now() - gameState.crash.startTime;
    const progress = Math.min(elapsed / 8000, 1);
    
    elements.ctx.strokeStyle = '#0BD15C';
    elements.ctx.lineWidth = 3;
    elements.ctx.lineCap = 'round';
    
    elements.ctx.beginPath();
    elements.ctx.moveTo(0, height);
    
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * progress;
        const x = t * width;
        const multiplier = 1 + Math.pow(t * 10, 1.2);
        const y = height - ((multiplier - 1) / 9) * height * 0.8;
        
        elements.ctx.lineTo(x, Math.max(0, y));
    }
    
    elements.ctx.stroke();
}

function placeBet() {
    const betAmount = parseFloat(elements.betInput?.value) || 1;
    
    if (betAmount <= 0) {
        showToast('Invalid bet amount', 'error');
        return;
    }
    
    if (betAmount > gameState.balance) {
        showToast('Insufficient balance', 'error');
        audio.play('lose');
        return;
    }
    
    if (!gameState.crash.active) {
        showToast('Wait for next round', 'warning');
        return;
    }
    
    // Place bet
    gameState.balance -= betAmount;
    gameState.crash.betAmount = betAmount;
    gameState.crash.betting = true;
    gameState.crash.autoCashout = parseFloat(elements.autoInput?.value) || 2.00;
    
    updateUI();
    updateBetButtons(true);
    
    // Save balance
    localStorage.setItem('streak_balance', gameState.balance.toString());
    
    showToast(`Bet placed: $${betAmount.toFixed(2)}`, 'success');
    audio.play('bet');
}

function cashout() {
    if (!gameState.crash.betting) return;
    
    const winAmount = gameState.crash.betAmount * gameState.crash.multiplier;
    const profit = winAmount - gameState.crash.betAmount;
    
    gameState.balance += winAmount;
    gameState.crash.betting = false;
    
    updateUI();
    updateBetButtons(false);
    
    // Save balance
    localStorage.setItem('streak_balance', gameState.balance.toString());
    
    showToast(`Cashed out at ${gameState.crash.multiplier.toFixed(2)}x! Profit: $${profit.toFixed(2)}`, 'success');
    audio.play('cashout');
}

function crashHappened() {
    gameState.crash.active = false;
    
    if (gameState.crash.betting) {
        gameState.crash.betting = false;
        updateBetButtons(false);
        
        // Save balance
        localStorage.setItem('streak_balance', gameState.balance.toString());
        
        showToast(`Crashed at ${gameState.crash.crashPoint.toFixed(2)}x! Lost: $${gameState.crash.betAmount.toFixed(2)}`, 'error');
        audio.play('lose');
    }
    
    // Update history
    gameState.crash.history.unshift(gameState.crash.crashPoint);
    if (gameState.crash.history.length > 10) {
        gameState.crash.history.pop();
    }
    updateCrashHistory();
    
    // Start new round after delay
    setTimeout(() => {
        startNewRound();
    }, 3000);
}

function updateBetButtons(betting) {
    if (elements.betBtn && elements.cashBtn) {
        if (betting) {
            elements.betBtn.classList.add('hidden');
            elements.cashBtn.classList.remove('hidden');
        } else {
            elements.betBtn.classList.remove('hidden');
            elements.cashBtn.classList.add('hidden');
        }
    }
}

function updateCrashHistory() {
    if (elements.historyList) {
        elements.historyList.innerHTML = gameState.crash.history.map(point => {
            const className = point >= 2 ? 'history-item green' : 'history-item red';
            return `<div class="${className}">${point.toFixed(2)}x</div>`;
        }).join('');
    }
}

// Toast Notification System
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#0BD15C',
        error: '#F44336',
        warning: '#FFA726',
        info: '#2196F3'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Window resize handler
window.addEventListener('resize', () => {
    if (elements.canvas && elements.ctx) {
        setupCanvas();
    }
});

// Prevent form submission on Enter
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
        if (e.target.id === 'login-username' || e.target.id === 'login-password') {
            handleLogin();
        }
    }
});

console.log('🎰 Streak Casino - Crash Game Initialized');
