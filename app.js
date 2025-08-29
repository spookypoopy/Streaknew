// State
let gameState = {
  username: 'Guest',
  balance: 0,
  crash: {
    round: 0,
    players: 0,
    history: [],
    countdown: 5,
    timerInterval: null,
    active: false,
    betting: false,
    startTime: 0,
    crashPoint: 0,
    multiplier: 1,
    betAmount: 0,
    autoCashout: 2
  }
};

// Elements
const E = {
  loading: null,
  loginModal: null,
  mainApp: null,
  tabs: null,
  loginForm: null,
  registerForm: null,
  loginBtn: null,
  registerBtn: null,
  loginUser: null,
  loginPass: null,
  regUser: null,
  regPass: null,
  regConfirm: null,
  logoutBtn: null,
  balance: null,
  username: null,
  roundNum: null,
  playersCount: null,
  countdown: null,
  countdownTimer: null,
  canvas: null,
  ctx: null,
  mult: null,
  betInput: null,
  autoInput: null,
  betBtn: null,
  cashBtn: null,
  historyList: null
};

document.addEventListener('DOMContentLoaded', () => {
  // Grab elements
  E.loading        = document.getElementById('loading-screen');
  E.loginModal     = document.getElementById('login-modal');
  E.mainApp        = document.getElementById('main-app');
  E.tabs           = document.querySelectorAll('.tab-btn');
  E.loginForm      = document.getElementById('login-form');
  E.registerForm   = document.getElementById('register-form');
  E.loginBtn       = document.getElementById('login-btn');
  E.registerBtn    = document.getElementById('register-btn');
  E.loginUser      = document.getElementById('login-username');
  E.loginPass      = document.getElementById('login-password');
  E.regUser        = document.getElementById('register-username');
  E.regPass        = document.getElementById('register-password');
  E.regConfirm     = document.getElementById('register-confirm');
  E.logoutBtn      = document.getElementById('logout-btn');
  E.balance        = document.getElementById('balance-amount');
  E.username       = document.getElementById('username-display');
  E.roundNum       = document.getElementById('round-number');
  E.playersCount   = document.getElementById('players-count');
  E.countdown      = document.getElementById('countdown');
  E.countdownTimer = document.getElementById('countdown-timer');
  E.canvas         = document.getElementById('crash-chart');
  E.ctx            = E.canvas.getContext('2d');
  E.mult           = document.getElementById('crash-multiplier');
  E.betInput       = document.getElementById('crash-bet');
  E.autoInput      = document.getElementById('crash-auto');
  E.betBtn         = document.getElementById('crash-bet-btn');
  E.cashBtn        = document.getElementById('crash-cash-btn');
  E.historyList    = document.getElementById('crash-history-list');

  // Initialize
  hide(E.loading);
  show(E.loginModal);
  initAuth();
  initCrash();
});

// Helpers
function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }
function toast(msg){ alert(msg); }
function switchTab(tab){
  E.tabs.forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  E.loginForm.classList.toggle('active',tab==='login');
  E.registerForm.classList.toggle('active',tab==='register');
}

// Authentication
function initAuth(){
  E.tabs.forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab));
  E.registerBtn.onclick=handleRegister;
  E.loginBtn.onclick=handleLogin;
  E.logoutBtn.onclick=handleLogout;
}

function handleRegister(){
  const u=E.regUser.value.trim(),p=E.regPass.value,c=E.regConfirm.value;
  if(!u||!p) return toast('Fill all fields');
  if(p!==c) return toast('Passwords must match');
  if(p.length<6) return toast('Password ≥6 chars');
  if(localStorage.getItem('user_'+u)) return toast('Username taken');
  localStorage.setItem('user_'+u,JSON.stringify({pass:p,balance:100}));
  toast('Registered! Now login.');
  switchTab('login');
}

function handleLogin(){
  const u=E.loginUser.value.trim(),p=E.loginPass.value;
  const data=JSON.parse(localStorage.getItem('user_'+u)||'null');
  if(!data||data.pass!==p) return toast('Invalid credentials');
  gameState.username=u; gameState.balance=data.balance;
  saveState();
  updateAuthUI();
  hide(E.loginModal); show(E.mainApp);
  startCountdown();
}

function handleLogout(){
  localStorage.removeItem('streak_user');
  localStorage.removeItem('streak_bal');
  location.reload();
}

function saveState(){
  localStorage.setItem('streak_user',gameState.username);
  localStorage.setItem('streak_bal',gameState.balance);
}

function updateAuthUI(){
  E.username.textContent=gameState.username;
  E.balance.textContent='$'+gameState.balance.toFixed(2);
}

// Crash Game
function initCrash(){
  resizeCanvas();
  window.onresize=resizeCanvas;
  E.betBtn.onclick=placeBet;
  E.cashBtn.onclick=cashout;
}

function resizeCanvas(){
  const w=E.canvas.parentElement.clientWidth;
  E.canvas.width=w; E.canvas.height=300;
}

function startCountdown(){
  gameState.crash.countdown=5;
  E.countdownTimer.textContent=5;
  show(E.countdown);
  gameState.crash.timerInterval=setInterval(()=>{
    gameState.crash.countdown--;
    if(gameState.crash.countdown<=0){
      clearInterval(gameState.crash.timerInterval);
      hide(E.countdown);
      startRound();
    } else {
      E.countdownTimer.textContent=gameState.crash.countdown;
    }
  },1000);
}

function startRound(){
  // Setup round
  gameState.crash.round++;
  gameState.crash.players=Math.floor(1200+Math.random()*300);
  if(gameState.crash.history.length>=10) gameState.crash.history.pop();
  gameState.crash.history.unshift(gameState.crash.crashPoint||1);
  renderHistory();

  // Reset state
  gameState.crash.active=true;
  gameState.crash.betting=false;
  gameState.crash.multiplier=1;
  gameState.crash.crashPoint=1+Math.random()*9;
  E.roundNum.textContent='#'+gameState.crash.round;
  E.playersCount.textContent=gameState.crash.players;
  hide(E.cashBtn); show(E.betBtn);
  animate();
}

function animate(){
  if(!gameState.crash.active) return;
  const t=(Date.now()-gameState.crash.startTime)/1000;
  gameState.crash.multiplier=1+Math.pow(t,1.1); // slower curve
  if(gameState.crash.multiplier>=gameState.crash.crashPoint){
    onCrash();return;
  }
  draw();
  requestAnimationFrame(animate);
}

function draw(){
  const ctx=E.ctx,w=E.canvas.width,h=E.canvas.height;
  ctx.fillStyle='#0F1419';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#0BD15C';ctx.lineWidth=2;
  ctx.beginPath();
  const steps=100;
  for(let i=0;i<=steps;i++){
    const x=i/steps*w;
    const m=1+Math.pow((i/steps)*Math.log(steps),1.1);
    const y=h-((m-1)/9)*h*0.8;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  E.mult.textContent=gameState.crash.multiplier.toFixed(2)+'x';
}

function placeBet(){
  const b=parseFloat(E.betInput.value)||1;
  if(b>gameState.balance)return toast('Insufficient funds');
  gameState.balance-=b;
  gameState.crash.betAmount=b;
  gameState.crash.autoCashout=parseFloat(E.autoInput.value)||2;
  gameState.crash.betting=true;
  saveState();updateAuthUI();
  hide(E.betBtn); show(E.cashBtn);
}

function cashout(){
  const win=gameState.crash.betAmount*gameState.crash.multiplier;
  gameState.balance+=win;
  gameState.crash.betting=false;
  saveState();updateAuthUI();
  toast(`Cashed at ${gameState.crash.multiplier.toFixed(2)}x! Profit $${(win-gameState.crash.betAmount).toFixed(2)}`);
}

function onCrash(){
  gameState.crash.active=false;
  if(gameState.crash.betting) toast(`Crashed at ${gameState.crash.crashPoint.toFixed(2)}x; you lost.`);
  startCountdown();
}

function renderHistory(){
  E.historyList.innerHTML=gameState.crash.history
    .map(x=>`<div class="history-item ${x>=2?'green':'red'}">${x.toFixed(2)}x</div>`)
    .join('');
}
