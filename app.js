// State
let gameState = {
  balance: 0,
  username: 'Guest',
  crash: {
    round: 0,
    players: 0,
    history: [],
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
  loginTabBtns: null,
  loginForm: null,
  registerForm: null,
  loginBtn: null,
  registerBtn: null,
  loginUser: null,
  loginPass: null,
  regUser: null,
  regEmail: null,
  regPass: null,
  regConfirm: null,
  logoutBtn: null,
  balance: null,
  username: null,
  roundNum: null,
  playersCount: null,
  ctx: null,
  canvas: null,
  mult: null,
  betInput: null,
  autoInput: null,
  betBtn: null,
  cashBtn: null,
  historyList: null
};

document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  E.loading = document.getElementById('loading-screen');
  E.loginModal = document.getElementById('login-modal');
  E.mainApp = document.getElementById('main-app');
  E.loginTabBtns = document.querySelectorAll('.tab-btn');
  E.loginForm = document.getElementById('login-form');
  E.registerForm = document.getElementById('register-form');
  E.loginBtn = document.getElementById('login-btn');
  E.registerBtn = document.getElementById('register-btn');
  E.loginUser = document.getElementById('login-username');
  E.loginPass = document.getElementById('login-password');
  E.regUser = document.getElementById('register-username');
  E.regEmail = document.getElementById('register-email');
  E.regPass = document.getElementById('register-password');
  E.regConfirm = document.getElementById('register-confirm');
  E.logoutBtn = document.getElementById('logout-btn');
  E.balance = document.getElementById('balance-amount');
  E.username = document.getElementById('username-display');
  E.roundNum = document.getElementById('round-number');
  E.playersCount = document.getElementById('players-count');
  E.canvas = document.getElementById('crash-chart');
  E.ctx = E.canvas.getContext('2d');
  E.mult = document.getElementById('crash-multiplier');
  E.betInput = document.getElementById('crash-bet');
  E.autoInput = document.getElementById('crash-auto');
  E.betBtn = document.getElementById('crash-bet-btn');
  E.cashBtn = document.getElementById('crash-cash-btn');
  E.historyList = document.getElementById('crash-history-list');

  // Setup UI
  initUI();
  setupAuth();
  setupCrash();
});

// UI Init
function initUI() {
  hide(E.loading);
  show(E.loginModal);
}

// Helpers
function show(el){el.classList.remove('hidden');}
function hide(el){el.classList.add('hidden');}
function toast(msg){alert(msg);}

// Tab Switching
function switchTab(tab) {
  E.loginTabBtns.forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  E.loginForm.classList.toggle('active', tab==='login');
  E.registerForm.classList.toggle('active', tab==='register');
}

// Auth
function setupAuth() {
  E.loginTabBtns.forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab));
  E.registerBtn.onclick=handleRegister;
  E.loginBtn.onclick=handleLogin;
  E.logoutBtn.onclick=handleLogout;
}

function handleRegister(){
  const u=E.regUser.value.trim(),e=E.regEmail.value.trim(),p=E.regPass.value,c=E.regConfirm.value;
  if(!u||!e||!p) return toast('Fill all'); if(p!==c) return toast('Passwords mismatch');
  if(localStorage.getItem('user_'+u)) return toast('Taken');
  localStorage.setItem('user_'+u, JSON.stringify({email:e,password:p,balance:100}));
  toast('Registered');
  switchTab('login');
}

function handleLogin(){
  const u=E.loginUser.value.trim(),p=E.loginPass.value;
  const data=JSON.parse(localStorage.getItem('user_'+u)||'null');
  if(!data||data.password!==p) return toast('Invalid');
  gameState.username=u; gameState.balance=data.balance;
  saveState(); updateAuthUI();
  hide(E.loginModal); show(E.mainApp);
  startCrashRound();
}

function handleLogout(){
  localStorage.removeItem('streak_user'); localStorage.removeItem('streak_bal');
  location.reload();
}

function saveState(){
  localStorage.setItem('streak_user',gameState.username);
  localStorage.setItem('streak_bal',gameState.balance);
}

function updateAuthUI(){
  E.username.textContent=gameState.username;
  E.balance.textContent='$'+gameState.balance.toFixed(2);
  E.playersCount.textContent=Math.floor(1200+Math.random()*300);
}

// Crash
function setupCrash(){
  resizeCanvas();
  E.betBtn.onclick=placeBet;
  E.cashBtn.onclick=cashout;
  window.onresize=resizeCanvas;
}

function resizeCanvas(){
  const w=E.canvas.parentElement.clientWidth;
  E.canvas.width=w; E.canvas.height=300;
}

function startCrashRound(){
  gameState.crash.round++;
  gameState.crash.players=Math.floor(1200+Math.random()*300);
  gameState.crash.history.unshift(gameState.crash.crashPoint||1);
  if(gameState.crash.history.length>10) gameState.crash.history.pop();
  renderHistory();
  E.roundNum.textContent='#'+gameState.crash.round;
  E.playersCount.textContent=gameState.crash.players;
  gameState.crash.active=true;
  gameState.crash.betting=false;
  hide(E.cashBtn); show(E.betBtn);
  gameState.crash.startTime=Date.now();
  gameState.crash.crashPoint=1+Math.random()*9;
  animate();
}

function animate(){
  if(!gameState.crash.active) return;
  const t=(Date.now()-gameState.crash.startTime)/1000;
  gameState.crash.mult=1+Math.pow(t*2,1.2);
  if(gameState.crash.mult>=gameState.crash.crashPoint){onCrash();return;}
  draw();
  requestAnimationFrame(animate);
}

function draw(){
  const ctx=E.ctx,w=E.canvas.width,h=E.canvas.height;
  ctx.fillStyle='#0F1419'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#0BD15C'; ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<=100;i++){
    const x=i/100*w; const m=1+Math.pow((i/100)*2,1.2);
    const y=h-((m-1)/9)*h*0.8;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();
  E.mult.textContent=gameState.crash.mult.toFixed(2)+'x';
}

function placeBet(){
  const b=parseFloat(E.betInput.value)||1;
  if(b>gameState.balance)return toast('No funds');
  gameState.balance-=b; gameState.crash.betAmount=b; gameState.crash.betting=true;
  saveState(); updateAuthUI();
  hide(E.betBtn); show(E.cashBtn);
  animate();
}

function cashout(){
  const win=gameState.crash.betAmount*gameState.crash.mult;
  gameState.balance+=win; gameState.crash.betting=false;
  saveState(); updateAuthUI();
  toast(`Cashed at ${gameState.crash.mult.toFixed(2)}x! Win $${(win-gameState.crash.betAmount).toFixed(2)}`);
}

function onCrash(){
  gameState.crash.active=false;
  if(gameState.crash.betting){
    toast(`Crashed at ${gameState.crash.crashPoint.toFixed(2)}x! Lost`);
  }
  setTimeout(startCrashRound,3000);
}

function renderHistory(){
  E.historyList.innerHTML=gameState.crash.history.map(x=>`<div class="history-item ${x>=2?'green':'red'}">${x.toFixed(2)}x</div>`).join('');
}
