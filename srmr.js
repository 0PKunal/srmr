let ROWS = 10, COLS = 14;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let maze, players, startTime;
let state = "menu";
let winner = null, winTime = 0;
let level = 1;
let CELL_SIZE;
let playerMode = 2; // default: 2 players

// ===== Persistent Storage =====
const STORAGE_KEYS = {
  MAX_LEVEL: "maxLevel",
  LEVEL_SEEDS: "levelSeeds",
  SCORES: "scores",
  LAST_LEVEL: "lastLevel",
  MODE: "mode"
};

function getMaxLevel() { return parseInt(localStorage.getItem(STORAGE_KEYS.MAX_LEVEL) || "1", 10); }
function setMaxLevel(n) { localStorage.setItem(STORAGE_KEYS.MAX_LEVEL, String(n)); }
function getLevelSeeds() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEVEL_SEEDS) || "{}"); } catch { return {}; } }
function setLevelSeeds(obj) { localStorage.setItem(STORAGE_KEYS.LEVEL_SEEDS, JSON.stringify(obj)); }
function setLastLevel(n) { localStorage.setItem(STORAGE_KEYS.LAST_LEVEL, String(n)); }
function getLastLevel() { return parseInt(localStorage.getItem(STORAGE_KEYS.LAST_LEVEL) || "1", 10); }
function setMode(m) { localStorage.setItem(STORAGE_KEYS.MODE, String(m)); }
function getMode() { return parseInt(localStorage.getItem(STORAGE_KEYS.MODE) || "2", 10); }

// ===== Resize Canvas =====
function resizeCanvas() {
  let availableHeight = window.innerHeight - document.querySelector("header").offsetHeight - 40 - 40;
  let availableWidth = window.innerWidth - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panel-w')) * 2) - 60;
  canvas.height = Math.min(availableHeight, 600);
  canvas.width = Math.min(availableWidth, 900);
  CELL_SIZE = Math.min(canvas.width / COLS, canvas.height / ROWS);
}
window.addEventListener("resize", () => { resizeCanvas(); setupMazeOnly(); });
resizeCanvas();

// ===== Seeded RNG =====
function LCG(seed) {
  let m = 0x80000000;
  let a = 1103515245;
  let c = 12345;
  let state = seed >>> 0;
  return {
    next() { state = (a * state + c) % m; return state / m; }
  };
}
function randInt(rng, min, max) { return Math.floor(rng.next() * (max - min + 1)) + min; }

// ===== Maze Generation =====
function generateMaze(rows, cols, seed) {
  let rng = LCG(seed);
  let grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {N:true,S:true,E:true,W:true,visited:false};
    }
  }
  function shuffleDirs(dirs) {
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = randInt(rng, 0, i);
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
  }
  function visit(r,c){
    grid[r][c].visited = true;
    let dirs = ["N","S","E","W"];
    shuffleDirs(dirs);
    for (let d of dirs){
      let dr=0, dc=0, opposite;
      if(d==="N"){dr=-1;opposite="S";}
      if(d==="S"){dr=1;opposite="N";}
      if(d==="E"){dc=1;opposite="W";}
      if(d==="W"){dc=-1;opposite="E";}
      let nr=r+dr, nc=c+dc;
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!grid[nr][nc].visited){
        grid[r][c][d]=false;
        grid[nr][nc][opposite]=false;
        visit(nr,nc);
      }
    }
  }
  visit(0,0);
  return grid;
}

// ===== Drawing =====
function drawMaze(maze){
  ctx.strokeStyle="white";
  ctx.lineWidth=2;
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      let x=c*CELL_SIZE, y=r*CELL_SIZE;
      let cell=maze[r][c];
      if(cell.N) line(x,y,x+CELL_SIZE,y);
      if(cell.S) line(x,y+CELL_SIZE,x+CELL_SIZE,y+CELL_SIZE);
      if(cell.E) line(x+CELL_SIZE,y,x+CELL_SIZE,y+CELL_SIZE);
      if(cell.W) line(x,y,x,y+CELL_SIZE);
    }
  }
}
function line(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}

// ===== Player =====
class Player {
  constructor(color, label, row, col, keys){
    this.color=color;
    this.label=label;
    this.row=row; this.col=col;
    this.keys=keys;
  }
  draw(){
    ctx.fillStyle=this.color;
    ctx.fillRect(this.col*CELL_SIZE+5,this.row*CELL_SIZE+5,CELL_SIZE-10,CELL_SIZE-10);
    ctx.fillStyle="black";
    ctx.font=`${CELL_SIZE/2.5}px Arial`;
    ctx.fillText(this.label, this.col*CELL_SIZE+CELL_SIZE/3, this.row*CELL_SIZE+CELL_SIZE/1.6);
  }
  move(dir){
    let cell=maze[this.row][this.col];
    if(!cell[dir]){
      if(dir==="N") this.row--;
      if(dir==="S") this.row++;
      if(dir==="E") this.col++;
      if(dir==="W") this.col--;
    }
  }
}

// ===== Setup & State =====
function setupPlayers(){
  players = [];
  players.push(new Player("lime","P1",0,0,{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"}));
  if(playerMode===2){
    players.push(new Player("orange","P2",0,0,{up:"w",down:"s",left:"a",right:"d"}));
  }
}

function ensureSeedForLevel(lv){
  let seeds = getLevelSeeds();
  if (!seeds[lv]) {
    seeds[lv] = Math.floor(Math.random() * 1e9) + lv;
    setLevelSeeds(seeds);
  }
  return seeds[lv];
}

function sizeForLevel(lv){
  let rows = 10 + (lv-1)*2;
  let cols = 14 + (lv-1)*2;
  return {rows, cols};
}

function setup(){
  const maxLevel = getMaxLevel();
  const lastLevel = getLastLevel();
  level = Math.max(1, Math.min(lastLevel, maxLevel));
  const {rows, cols} = sizeForLevel(level);
  ROWS = rows; COLS = cols;

  resizeCanvas();
  setupMazeOnly();
  setupPlayers();
  startTime = null;
  winner = null;
  state = "menu";
  document.getElementById("levelLabel").textContent = `Level: ${level}`;
  updateLevelList();
  showScores();
}

function setupMazeOnly(){
  const seed = ensureSeedForLevel(level);
  const {rows, cols} = sizeForLevel(level);
  ROWS = rows; COLS = cols;
  maze = generateMaze(ROWS, COLS, seed);
}

// ===== Leaderboard =====
function saveScore(player,time,lv){
  let scores=JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORES)||"[]");
  scores.push({player,time:parseFloat(time),level:lv, ts: Date.now()});
  scores.sort((a,b)=>a.time-b.time);
  scores=scores.slice(0,5);
  localStorage.setItem(STORAGE_KEYS.SCORES,JSON.stringify(scores));
  showScores();
}
function showScores(){
  let scores=JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORES)||"[]");
  let list=document.getElementById("scores");
  list.innerHTML="";
  scores.forEach(s=>{
    let li=document.createElement("li");
    li.textContent=`Player ${s.player} - ${s.time}s (Lv ${s.level})`;
    list.appendChild(li);
  });
}
function updateLevelList(){
  let list=document.getElementById("levelList");
  list.innerHTML="";
  const maxLevel = getMaxLevel();
  for(let i=1;i<=maxLevel;i++){
    let li=document.createElement("li");
    li.textContent=`Level ${i}`;
    li.addEventListener("click",()=>{
      level=i;
      setLastLevel(level);
      setupMazeOnly();
      setupPlayers();
      state="playing";
      startTime=Date.now();
      document.getElementById("levelLabel").textContent = `Level: ${level}`;
    });
    list.appendChild(li);
  }
}

// ===== Win Check =====
function checkWin(){
  for(let i=0;i<players.length;i++){
    let p=players[i];
    if(p.row===ROWS-1 && p.col===COLS-1){
      let time=((Date.now()-startTime)/1000).toFixed(2);
      winner=i+1;
      winTime=time;
      saveScore(winner,time,level);
      const newMax = Math.max(getMaxLevel(), level + 1);
      setMaxLevel(newMax);
      setLastLevel(level + 1);
      state="gameover";
      updateLevelList();
    }
  }
}

// ===== Input =====
document.addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)){
    e.preventDefault();
  }
  if(state==="menu" && e.code==="Space"){
    state="playing";
    startTime=Date.now();
    return;
  }
  if(state==="gameover" && e.key.toLowerCase()==="r"){
    level = Math.max(level + 1, 1);
    setLastLevel(level);
    ensureSeedForLevel(level);
    setup();
    return;
  }
  if(state==="playing"){
    players.forEach(p=>{
      if(e.key===p.keys.up) p.move("N");
      if(e.key===p.keys.down) p.move("S");
      if(e.key===p.keys.left) p.move("W");
      if(e.key===p.keys.right) p.move("E");
    });
    checkWin();
  }
});

// ===== Reset Progress Button =====
document.getElementById("resetProgress").addEventListener("click", () => {
  if(confirm("Reset all progress (levels, seeds, and scores)?")){
    localStorage.removeItem(STORAGE_KEYS.MAX_LEVEL);
    localStorage.removeItem(STORAGE_KEYS.LEVEL_SEEDS);
    localStorage.removeItem(STORAGE_KEYS.SCORES);
    localStorage.removeItem(STORAGE_KEYS.LAST_LEVEL);
    level = 1;
    setup();
  }
});

// ===== Mode Selector =====
document.getElementById("modeSelector").addEventListener("change",(e)=>{
  playerMode=parseInt(e.target.value,10);
  setMode(playerMode);
  setup();
});

// ===== Initial Boot =====
(function boot(){
  if(!localStorage.getItem(STORAGE_KEYS.MAX_LEVEL)) setMaxLevel(1);
  if(!localStorage.getItem(STORAGE_KEYS.LEVEL_SEEDS)) setLevelSeeds({});
  if(!localStorage.getItem(STORAGE_KEYS.LAST_LEVEL)) setLastLevel(1);
  playerMode = getMode();
  document.getElementById("modeSelector").value = playerMode;
  setup();
  setInterval(draw,1000/30);
})();

// ===== Render Loop =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(state==="menu"){
    ctx.fillStyle="white";
    ctx.font="28px Arial";
    ctx.fillText("Press SPACE to Start", canvas.width/2-120, canvas.height/2);
    return;
  }

  drawMaze(maze);
  ctx.fillStyle="blue";
  ctx.fillRect(5,5,CELL_SIZE-10,CELL_SIZE-10);
  ctx.fillStyle="white";
  ctx.font=`${CELL_SIZE/2.5}px Arial`;
  ctx.fillText("S", 5+CELL_SIZE/3, 5+CELL_SIZE/1.6);

  ctx.fillStyle="red";
  ctx.fillRect((COLS-1)*CELL_SIZE+5,(ROWS-1)*CELL_SIZE+5,CELL_SIZE-10,CELL_SIZE-10);
  ctx.fillStyle="white";
  ctx.fillText("E",(COLS-1)*CELL_SIZE+CELL_SIZE/3,(ROWS-1)*CELL_SIZE+CELL_SIZE/1.6);

  players.forEach(p=>p.draw());

  if(state==="gameover"){
    ctx.fillStyle="rgba(0,0,0,0.7)";
    ctx.fillRect(canvas.width/2-200,canvas.height/2-80,400,160);
    ctx.fillStyle="yellow";
    ctx.font="30px Arial";
    ctx.fillText(`🎉 Player ${winner} Wins!`, canvas.width/2-130, canvas.height/2-20);
    ctx.font="20px Arial";
    ctx.fillText(`Time: ${winTime}s`, canvas.width/2-50, canvas.height/2+10);
    ctx.fillText("Press R for Next Level", canvas.width/2-110, canvas.height/2+40);
  }
}


// ===== Render Loop =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(state==="menu"){
    ctx.fillStyle="white";
    ctx.font="28px Arial";
    ctx.textAlign="center";
    ctx.fillText("Press SPACE to Start", canvas.width/2, canvas.height/2);
    return;
  }

  // Compute offset to center maze elements
  const mazeW = COLS * CELL_SIZE;
  const mazeH = ROWS * CELL_SIZE;
  const offsetX = (canvas.width  - mazeW) / 2;
  const offsetY = (canvas.height - mazeH) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  drawMaze(maze);

  // Start block (top-left cell)
  ctx.fillStyle="blue";
  ctx.fillRect(5,5,CELL_SIZE-10,CELL_SIZE-10);
  ctx.fillStyle="white";
  ctx.font=`${CELL_SIZE/2.5}px Arial`;
  ctx.fillText("S", 5+CELL_SIZE/3, 5+CELL_SIZE/1.6);

  // End block (bottom-right cell)
  ctx.fillStyle="red";
  ctx.fillRect((COLS-1)*CELL_SIZE+5,(ROWS-1)*CELL_SIZE+5,CELL_SIZE-10,CELL_SIZE-10);
  ctx.fillStyle="white";
  ctx.fillText("E",(COLS-1)*CELL_SIZE+CELL_SIZE/3,(ROWS-1)*CELL_SIZE+CELL_SIZE/1.6);

  players.forEach(p=>p.draw());

  ctx.restore();

  if(state==="gameover"){
    ctx.fillStyle="rgba(0,0,0,0.7)";
    ctx.fillRect(canvas.width/2-200,canvas.height/2-80,400,160);
    ctx.fillStyle="yellow";
    ctx.font="30px Arial";
    ctx.textAlign="center";
    ctx.fillText(`🎉 Player ${winner} Wins!`, canvas.width/2, canvas.height/2-20);
    ctx.font="20px Arial";
    ctx.fillText(`Time: ${winTime}s`, canvas.width/2, canvas.height/2+10);
    ctx.fillText("Press R for Next Level", canvas.width/2, canvas.height/2+40);
  }
}
