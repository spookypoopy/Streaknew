const statsContainer = document.getElementById('stats-grid');
const games = [
    { name: 'Crash', icon: '🚀', players: () => Math.floor(1200 + Math.random() * 300) },
    { name: 'Plinko', icon: '🎯', players: () => Math.floor(800 + Math.random() * 200) },
    { name: 'Dice', icon: '🎲', players: () => Math.floor(600 + Math.random() * 150) },
    { name: 'Mines', icon: '💎', players: () => Math.floor(500 + Math.random() * 100) },
    { name: 'Blackjack', icon: '🃏', players: () => Math.floor(300 + Math.random() * 80) }
];

function renderStats() {
    if (!statsContainer) return;
    
    statsContainer.innerHTML = games.map(game => `
        <div class="stat-item">
            <h4>${game.icon} ${game.name}</h4>
            <div class="value">
                <span class="player-count" data-target="${game.players()}">0</span>
                <small>players</small>
            </div>
        </div>
    `).join('');
    
    animateStats();
}

function animateStats() {
    document.querySelectorAll('.player-count').forEach(el => {
        const target = parseInt(el.dataset.target);
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
        }, 1000 / 60);
    });
}

function updateLiveStats() {
    renderStats();
    
    // Update every 5-8 seconds with slight variations
    const nextUpdate = 5000 + Math.random() * 3000;
    setTimeout(updateLiveStats, nextUpdate);
}

// Initialize stats
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateLiveStats, 1000);
    });
} else {
    setTimeout(updateLiveStats, 1000);
}
