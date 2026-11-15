(function(){
'use strict';

const $=s=>document.querySelector(s);
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const ri=rnd;

function buzz(ms){
  try{if(navigator.vibrate)navigator.vibrate(ms)}catch(e){}
}

/* ---------- Web Audio Sound Engine + Loud Turn Alert ---------- */
const SFX=(function(){
  let ctx=null;
  function getCtx(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(AC)ctx=new AC();
    }
    if(ctx&&ctx.state==='suspended')ctx.resume();
    return ctx;
  }
  function tone(f,start,dur,type='sine',vol=.22){
    if(save.mute)return;
    const c=getCtx();if(!c)return;
    const o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(f,c.currentTime+start);
    g.gain.setValueAtTime(vol,c.currentTime+start);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+start+dur);
    o.connect(g);g.connect(c.destination);
    o.start(c.currentTime+start);o.stop(c.currentTime+start+dur);
  }
  return{
    init(){getCtx()},
    tone,
    deal(){
      if(save.mute)return;
      const c=getCtx();if(!c)return;
      const b=c.createBuffer(1,c.sampleRate*.06,c.sampleRate),d=b.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(c.sampleRate*.015));
      const s=c.createBufferSource();s.buffer=b;
      const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=2400;f.Q.value=1.5;
      const g=c.createGain();g.gain.value=.38;
      s.connect(f);f.connect(g);g.connect(c.destination);s.start();
    },
    chip(){tone(1600,0,.03,'triangle',.2);tone(2200,.02,.04,'triangle',.16)},
    win(){[523,659,784,1046].forEach((f,i)=>tone(f,i*.08,.28,'triangle',.28))},
    pack(){tone(320,0,.08,'sine',.22);tone(220,.06,.15,'sine',.22)},
    see(){tone(587,0,.06,'sine',.18);tone(880,.05,.12,'sine',.2)},
    splat(){tone(180,0,.1,'sawtooth',.24);tone(120,.05,.15,'sine',.22)},
    boom(){tone(90,0,.35,'sawtooth',.38);tone(55,.05,.45,'sine',.42)},
    turnWarn(){
      /* Loud attention alarm when turn is about to expire */
      tone(980,0,.13,'square',.52);
      tone(1320,.15,.16,'square',.58);
      buzz([70,40,70]);
    }
  };
})();

/* ---------- Persistent State & 10-Hand Cycle Tracker ---------- */
const SKEY='r3c_state_v4';
function getSig(s){
  let h=0x811c9dc5;
  const str=`${s.chips}|${s.streakDay}|${s.lastDailyDate}|SALT_ROYAL_2026_PROD`;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)}
  return(h>>>0).toString(16);
}

function loadSave(){
  const d={
    chips:2500000,boot:10000,mute:false,hands:0,wins:0,best:0,
    streakDay:1,lastDailyDate:'',processedReceipts:[],
    adCooldownUntil:0,cycleDeck:[],sig:''
  };
  try{
    const r=localStorage.getItem(SKEY);
    if(r){
      const p=JSON.parse(r);
      if(p&&p.sig===getSig(p)){return Object.assign(d,p)}
    }
  }catch(e){}
  d.sig=getSig(d);return d;
}

const save=loadSave();
function persist(){
  save.sig=getSig(save);
  try{localStorage.setItem(SKEY,JSON.stringify(save))}catch(e){}
}

const TABLE_TIERS=[
  {name:'Table 1 · Club Lounge',   boot:10000,    unlock:0},
  {name:'Table 2 · Bronze Suite',  boot:25000,    unlock:0},
  {name:'Table 3 · Silver Room',   boot:100000,   unlock:5000000},
  {name:'Table 4 · Gold VIP',      boot:500000,   unlock:20000000},
  {name:'Table 5 · Diamond Salon', boot:2500000,  unlock:100000000},
  {name:'Table 6 · Emperor Club',  boot:10000000, unlock:500000000}
];
const TIER_NAMES=['Club Lounge','Bronze Suite','Silver Room','Gold VIP','Diamond Salon','Emperor Club'];

function fmt(n){
  n=Math.round(n);const a=Math.abs(n);
  if(a>=10000000)return(n/10000000).toFixed(n%10000000===0?0:2)+' Cr';
  if(a>=100000)return(n/100000).toFixed(n%100000===0?0:1)+' L';
  if(a>=1000)return(n/1000).toFixed(n%1000===0?0:1)+'k';
  return String(n);
}

/* ---------- Cards & Hand Evaluator ---------- */
const SUITS=['S','H','D','C'];
const S_ICONS={S:'#sp',H:'#hr',D:'#dm',C:'#cl'};
const S_COLORS={S:'#1e293b',C:'#1e293b',H:'#dc2626',D:'#dc2626'};
const V_NAMES={11:'J',12:'Q',13:'K',14:'A'};
const vn=v=>V_NAMES[v]||String(v);

function card3(c,isFace){
  const sym=S_ICONS[c.s],col=S_COLORS[c.s],v=vn(c.v);
  const fContent=`<rect width="100" height="140" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="9" y="23" font-size="20" font-weight="900" fill="${col}" font-family="system-ui">${v}</text>
    <use href="${sym}" x="8" y="27" width="16" height="16" fill="${col}"/>
    <use href="${sym}" x="22" y="38" width="56" height="64" fill="${col}" opacity=".92"/>
    <g transform="rotate(180 50 70)">
      <text x="9" y="23" font-size="20" font-weight="900" fill="${col}" font-family="system-ui">${v}</text>
      <use href="${sym}" x="8" y="27" width="16" height="16" fill="${col}"/>
    </g>`;
  const bContent=`<rect width="100" height="140" rx="10" fill="url(#bkp)" stroke="#f5c542" stroke-width="3"/>
    <rect x="7" y="7" width="86" height="126" rx="6" fill="none" stroke="#f5c542" stroke-dasharray="3 2" stroke-width="1.5"/>
    <circle cx="50" cy="70" r="16" fill="#0b1d4d" stroke="#f5c542" stroke-width="2"/>
    <use href="#sp" x="42" y="62" width="16" height="16" fill="#f5c542"/>`;

  return `<div class="card3 ${isFace?'up':''}">
    <svg class="f" viewBox="0 0 100 140">${fContent}</svg>
    <svg class="b" viewBox="0 0 100 140">${bContent}</svg>
  </div>`;
}

function shuffleDeck(){
  const d=[];
  for(const s of SUITS)for(let v=2;v<=14;v++)d.push({s,v});
  for(let i=d.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    const t=d[i];d[i]=d[j];d[j]=t;
  }
  return d;
}

function evalHand(h){
  const s=[...h].sort((a,b)=>b.v-a.v);
  const [c1,c2,c3]=s;
  const isFlush=(c1.s===c2.s&&c2.s===c3.s);
  let isSeq=false,seqHigh=0;
  if(c1.v-c2.v===1&&c2.v-c3.v===1){isSeq=true;seqHigh=c1.v}
  else if(c1.v===14&&c2.v===3&&c3.v===2){isSeq=true;seqHigh=3}
  const isTrail=(c1.v===c2.v&&c2.v===c3.v);
  const isPair=(c1.v===c2.v||c2.v===c3.v||c1.v===c3.v);

  let pairV=0,kick=0;
  if(isPair&&!isTrail){
    if(c1.v===c2.v){pairV=c1.v;kick=c3.v}
    else if(c2.v===c3.v){pairV=c2.v;kick=c1.v}
    else{pairV=c1.v;kick=c2.v}
  }

  let rank=1,score=0,name='High Card';
  if(isTrail){rank=6;score=6e7+c1.v;name='Trail ('+vn(c1.v)+')'}
  else if(isFlush&&isSeq){rank=5;score=5e7+seqHigh;name=seqHigh===14?'Royal Flush!':'Pure Sequence'}
  else if(isSeq){rank=4;score=4e7+seqHigh;name='Sequence'}
  else if(isFlush){rank=3;score=3e7+c1.v*400+c2.v*20+c3.v;name='Color'}
  else if(isPair){rank=2;score=2e7+pairV*100+kick;name='Pair ('+vn(pairV)+')'}
  else{rank=1;score=1e7+c1.v*400+c2.v*20+c3.v;name='High '+vn(c1.v)}
  return{rank,score,name};
}

/* ---------- 10-Hand Cycle Logic (8 Strong Human Hands: 3 Human Win, 5 Bot Win, 2 Original) ---------- */
function nextCycleMode(){
  if(!Array.isArray(save.cycleDeck)||save.cycleDeck.length===0){
    const modes=['H_WIN','H_WIN','H_WIN','B_WIN','B_WIN','B_WIN','B_WIN','B_WIN','NATURAL','NATURAL'];
    for(let i=modes.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [modes[i],modes[j]]=[modes[j],modes[i]];
    }
    save.cycleDeck=modes;
  }
  const mode=save.cycleDeck.pop();
  persist();
  return mode;
}

function dealControlledHands(){
  const mode=nextCycleMode();
  let bestHands=null;

  for(let attempt=0;attempt<45;attempt++){
    const deck=shuffleDeck();
    const hands=[[],[],[],[],[]];
    for(let c=0;c<3;c++)for(let i=0;i<5;i++)hands[i].push(deck.pop());
    const evs=hands.map(evalHand);

    if(mode==='NATURAL'){
      bestHands=hands;break;
    }

    const humanStrong=(evs[0].rank>=2); /* Pair, Color, Sequence, Pure Seq, or Trail */
    const maxBotScore=Math.max(evs[1].score,evs[2].score,evs[3].score,evs[4].score);

    if(mode==='H_WIN'){
      if(humanStrong&&evs[0].score>maxBotScore){bestHands=hands;break;}
      if(!bestHands&&evs[0].score>maxBotScore)bestHands=hands;
    } else if(mode==='B_WIN'){
      /* Human gets strong cards (Pair/Color/Seq) so game feels exciting, yet 1 bot holds a stronger hand */
      if(humanStrong&&maxBotScore>evs[0].score){bestHands=hands;break;}
      if(!bestHands&&maxBotScore>evs[0].score)bestHands=hands;
    }
  }

  if(!bestHands){
    const deck=shuffleDeck();
    bestHands=[[],[],[],[],[]];
    for(let c=0;c<3;c++)for(let i=0;i<5;i++)bestHands[i].push(deck.pop());
  }
  return{hands:bestHands,mode};
}

const strength=ev=>ev.score/60000014;

/* ---------- Table Theme & Effects ---------- */
let curTier=1;
function applyTheme(boot,animate){
  let t=1;
  if(boot>=10000000)t=6;
  else if(boot>=2500000)t=5;
  else if(boot>=500000)t=4;
  else if(boot>=100000)t=3;
  else if(boot>=25000)t=2;

  const changed=(t!==curTier);
  curTier=t;
  document.body.dataset.tier=String(t);
  const name=TIER_NAMES[t-1];
  $('#tinfo').innerHTML=`${name} <small>(Ante ${fmt(boot)})</small>`;

  if(changed&&animate){
    const f=$('#flash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');
    const u=$('#upg');u.textContent='✦ '+name.toUpperCase()+' ✦';u.classList.remove('on');void u.offsetWidth;u.classList.add('on');
    SFX.win();
  }
}

function initFx(){
  const s=$('#spot');if(!s)return;
  for(let i=0;i<10;i++){
    const d=document.createElement('div');d.className='spk';
    d.style.left=rnd(10,90)+'%';d.style.top=rnd(10,80)+'%';
    d.style.animationDelay=(i*.3)+'s';
    s.appendChild(d);
  }
}

/* ---------- Game State & Players ---------- */
const S={
  boot:10000,potLimit:1000000,maxStake:160000,stake:10000,pot:0,
  dealer:0,turn:-1,active:false,busy:false,started:false,gen:0,
  timerId:null,ssResolve:null,roundMode:'NATURAL'
};

const P=[
  {id:0,name:'You',          chips:save.chips,hand:[],seen:false,folded:false,blindCount:0,ev:null,isBot:false},
  {id:1,name:'Priya Sharma', chips:0,         hand:[],seen:false,folded:false,blindCount:0,ev:null,isBot:true,cc:'IN',row:0,col:0,noise:0},
  {id:2,name:'Arjun Khan',   chips:0,         hand:[],seen:false,folded:false,blindCount:0,ev:null,isBot:true,cc:'PK',row:0,col:1,noise:0},
  {id:3,name:'Jack Miller',  chips:0,         hand:[],seen:false,folded:false,blindCount:0,ev:null,isBot:true,cc:'US',row:0,col:3,noise:0},
  {id:4,name:'Emma Wilson',  chips:0,         hand:[],seen:false,folded:false,blindCount:0,ev:null,isBot:true,cc:'UK',row:0,col:4,noise:0}
];

let pendingBoot=null;
let activeTargetBot=-1;

function populateBots(){
  const chosen=window.pickFreshTableBots();
  for(let i=1;i<5;i++){
    const b=chosen[i-1];
    P[i].name=b.name;
    P[i].cc=b.cc;
    P[i].row=b.row;
    P[i].col=b.col;
    P[i].chips=S.boot*ri(45,130);
    P[i].noise=(Math.random()-.5)*.12;
    renderSeatMeta(i);
  }
}

function simulatePlayerRotation(){
  for(let i=1;i<5;i++){
    if(P[i].chips<S.boot*3||Math.random()<.12){
      const usedNames=P.map(x=>x.name);
      const pool=window.BOT_ROSTER.filter(b=>!usedNames.includes(b.name));
      const cand=pool[ri(0,pool.length-1)]||window.BOT_ROSTER[ri(0,window.BOT_ROSTER.length-1)];
      P[i].name=cand.name;P[i].cc=cand.cc;P[i].row=cand.row;P[i].col=cand.col;
      P[i].chips=S.boot*ri(50,150);
      P[i].noise=(Math.random()-.5)*.12;
      renderSeatMeta(i);
    }
  }
}

const timeouts=[];
function later(fn,ms){const id=setTimeout(fn,ms);timeouts.push(id);return id}
function clearAll(){while(timeouts.length)clearTimeout(timeouts.pop())}

const alive=()=>P.filter(p=>!p.folded);
const prevActive=cur=>{let p=cur;do{p=(p+4)%5}while(P[p].folded);return p};
const amt=(p,m)=>S.stake*(p.seen?2:1)*m;

function banner(t){$('#banner').textContent=t}
function toast(t){
  const el=$('#toast');el.textContent=t;el.hidden=false;
  clearTimeout(el._to);el._to=setTimeout(()=>{el.hidden=true},2400);
}

function renderChips(){
  $('#pot').textContent=fmt(S.pot);
  $('#stakeLbl').textContent='Stake '+fmt(S.stake);
  $('#myChipsH').textContent=fmt(P[0].chips);
  const lb=$('#lobbyChips');if(lb)lb.textContent=fmt(P[0].chips);
  for(let i=0;i<5;i++){
    const el=$('#ch-'+i);
    if(el)el.textContent=fmt(P[i].chips);
  }
}

function setSt(i,txt,cls=''){
  const el=$('#st-'+i);if(!el)return;
  el.textContent=txt;el.className='st '+(cls||'');
}

function bubble(i,txt){
  const b=$('#bub-'+i);if(!b)return;
  b.textContent=txt;b.classList.remove('on');void b.offsetWidth;b.classList.add('on');
  setTimeout(()=>b.classList.remove('on'),1900);
}

/* ---------- Full Colored Ring + Loud Turn Expiry Alert ---------- */
function timerStart(i,ms,onExp){
  timerStop();
  const wrap=$('#avw-'+i);if(!wrap)return;
  wrap.classList.add('on');
  const ring=$('#rf-'+i);
  const C=2*Math.PI*26;
  ring.style.strokeDasharray=C;ring.style.strokeDashoffset=0;
  const t0=performance.now();
  let warned=false;

  function tick(now){
    const elap=now-t0,pct=Math.min(1,elap/ms);
    ring.style.strokeDashoffset=String(C*pct);

    /* Trigger loud warning sound & red fast pulse in final 3.5 seconds for human */
    if(i===0 && !warned && (ms-elap)<=3500){
      warned=true;
      wrap.classList.add('warn');
      SFX.turnWarn();
    }

    if(pct<1){S.timerId=requestAnimationFrame(tick)}
    else{timerStop();if(onExp)onExp()}
  }
  S.timerId=requestAnimationFrame(tick);
}

function timerStop(){
  if(S.timerId){cancelAnimationFrame(S.timerId);S.timerId=null}
  for(let i=0;i<5;i++){
    const w=$('#avw-'+i);if(w)w.classList.remove('on','warn');
  }
}

function fly(fromEl,toEl,delay=0,cls='g'){
  setTimeout(()=>{
    const r1=fromEl.getBoundingClientRect(),r2=toEl.getBoundingClientRect();
    const wrap=$('#tableWrap').getBoundingClientRect();
    const f=document.createElement('div');
    f.className=`fchip ${cls}`;
    f.style.left=(r1.left+r1.width/2-wrap.left-10)+'px';
    f.style.top=(r1.top+r1.height/2-wrap.top-10)+'px';
    $('#tableWrap').appendChild(f);
    setTimeout(()=>{
      f.style.left=(r2.left+r2.width/2-wrap.left-10)+'px';
      f.style.top=(r2.top+r2.height/2-wrap.top-10)+'px';
    },20);
    setTimeout(()=>f.remove(),580);
  },delay);
}
function flyTo(seatI){
  const cols=['g','r','bl'];
  fly($('#av-'+seatI),$('#potBox'),0,cols[ri(0,2)]);
}

/* ---------- Seats & Cards Rendering ---------- */
function buildSeats(){
  for(let i=0;i<5;i++){
    const s=$('#seat-'+i);
    if(i===0){
      s.innerHTML=`
        <div class="bubble" id="bub-0"></div>
        <div class="handlbl" id="handLbl" hidden>HIGH CARD</div>
        <div class="mycards" id="cards-0"></div>
        <div class="mebar">
          <div class="avwrap" id="avw-0">
            <svg class="ring" viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="26"/><circle class="fg" id="rf-0" cx="30" cy="30" r="26"/></svg>
            <div class="av" id="av-0">${window.humanAvatarHTML()}</div>
            <div class="dealer" id="dealer-0" hidden>D</div>
          </div>
          <div>
            <div class="nm">You</div>
            <div class="ch" id="ch-0">0</div>
          </div>
          <div class="st" id="st-0">READY</div>
        </div>
        <div class="tag" id="tag-0">WINNER 🏆</div>
      `;
    } else {
      s.innerHTML=`
        <div class="bubble" id="bub-${i}"></div>
        <div class="tag" id="tag-${i}">WINNER 🏆</div>
        <div class="avwrap" id="avw-${i}">
          <svg class="ring" viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="26"/><circle class="fg" id="rf-${i}" cx="30" cy="30" r="26"/></svg>
          <div class="av" id="av-${i}"></div>
          <div class="dealer" id="dealer-${i}" hidden>D</div>
        </div>
        <div class="nm" id="nm-${i}"></div>
        <div class="ch" id="ch-${i}">0</div>
        <div class="st" id="st-${i}">WAITING</div>
        <div class="bcards" id="cards-${i}"></div>
      `;
      s.onclick=()=>openGiftMenu(i);
    }
  }
}

function renderSeatMeta(i){
  if(i===0)return;
  const p=P[i];
  $('#av-'+i).innerHTML=window.renderFaceHTML(p.row,p.col);
  $('#nm-'+i).innerHTML=`${p.name} <small>${p.cc}</small>`;
  $('#ch-'+i).textContent=fmt(p.chips);
}

function renderCards(i,mode,anim=false){
  const box=$('#cards-'+i),p=P[i];
  if(!p||!p.hand||!p.hand.length){box.innerHTML='';return}
  if(mode==='none'){box.innerHTML='';return}
  const isFace=(mode==='face');
  const rots=[-8,0,8];

  if(i===0){
    box.innerHTML=p.hand.map((c,k)=>`
      <div class="cw ${anim?'deal':''}" style="--rot:${rots[k]}deg;animation-delay:${k*.12}s">
        ${card3(c,isFace)}
      </div>
    `).join('');
  } else {
    box.className='bcards '+(isFace?'show':'');
    box.innerHTML=p.hand.map((c,k)=>`
      <div class="cw ${anim?'deal':''}" style="animation-delay:${k*.12}s">
        ${card3(c,isFace)}
      </div>
    `).join('');
  }
}

function flipUp(i){
  const cards=$('#cards-'+i).querySelectorAll('.card3');
  cards.forEach((c,idx)=>{
    setTimeout(()=>c.classList.add('up'),idx*110);
  });
}

function updateControls(){
  const me=P[0],my=S.active&&S.turn===0&&!me.folded&&!S.busy,n=alive().length;
  const c1=amt(me,1),c2=amt(me,2);
  $('#bChaal').innerHTML=`<span>${me.seen?'CALL':'BLIND'}</span><span class="a">${fmt(c1)}</span>`;
  $('#bRaise').innerHTML=`<span>RAISE</span><span class="a">${fmt(c2)}</span>`;
  $('#bChaal').disabled=!(my&&me.chips>=c1);
  $('#bRaise').disabled=!(my&&me.chips>=c2&&S.stake*2<=S.maxStake);
  $('#bPack').disabled=!my;
  $('#bSee').disabled=!(S.active&&!me.folded&&!me.seen);
  const ss=$('#bSS');
  if(n===2){ss.textContent='SHOWDOWN';ss.disabled=!(my&&me.chips>=c1)}
  else{ss.textContent='SIDE SHOW';ss.disabled=!(my&&n>2&&me.seen&&P[prevActive(0)].seen&&me.chips>=c1)}
  const hl=$('#handLbl');
  if(S.active&&!me.folded){hl.hidden=false;hl.textContent=me.seen?me.ev.name:'TAP CARDS TO SEE'}
  else if(!S.active&&me.hand.length&&!me.folded){hl.hidden=false;hl.textContent=me.ev.name}
  else hl.hidden=true;
}

/* ---------- Round Flow & 1.5x Bot Timing ---------- */
function cdShow(t){const e=$('#cdn');e.textContent=t;e.classList.remove('on');void e.offsetWidth;e.classList.add('on')}
function countdownStart(){
  clearAll();S.gen++;S.active=false;S.busy=true;S.turn=-1;timerStop();
  for(let i=0;i<5;i++){
    P[i].hand=[];P[i].folded=false;P[i].seen=false;
    renderCards(i,'none');
    $('#seat-'+i).classList.remove('fold','won');
    $('#dealer-'+i).hidden=true;
    setSt(i,i===0?'READY':'WAITING');
  }
  S.pot=0;S.stake=S.boot;
  banner('Welcome to '+TIER_NAMES[Math.max(0,curTier-1)]);
  renderChips();updateControls();
  let n=3;
  const tick=()=>{
    if(anyModalOpen()){later(tick,400);return}
    if(n<=0){startRound();return}
    banner(`Game begins in ${n}...`);cdShow(n);SFX.tone(520+(3-n)*110,0,.14,'triangle',.18);n--;
    later(tick,1000);
  };
  later(tick,1000);
}

function startRound(){
  clearAll();S.gen++;S.busy=false;
  if(pendingBoot){S.boot=pendingBoot;save.boot=pendingBoot;pendingBoot=null}
  applyTheme(S.boot,true);

  if(P[0].chips<S.boot){
    $('#brokeM').hidden=false;
    return;
  }

  for(let i=1;i<5;i++)if(P[i].chips<S.boot*5){
    P[i].chips=S.boot*ri(45,130);
    renderChips();
  }
  S.potLimit=S.boot*100;S.maxStake=S.boot*16;S.stake=S.boot;S.pot=0;
  S.dealer=(S.dealer+1)%5;const first=(S.dealer+1)%5;

  const dealt=dealControlledHands();
  const hands=dealt.hands;
  S.roundMode=dealt.mode;

  for(let i=0;i<5;i++){
    const p=P[i];p.chips-=S.boot;S.pot+=S.boot;p.hand=hands[i];p.ev=evalHand(p.hand);p.seen=false;p.folded=false;p.blindCount=0;
    $('#seat-'+i).classList.remove('fold','won');setSt(i,'ANTE');$('#dealer-'+i).hidden=(i!==S.dealer);flyTo(i);
  }
  save.chips=P[0].chips;persist();
  SFX.chip();SFX.deal();
  renderCards(0,'back',true);for(let i=1;i<5;i++)renderCards(i,'back',true);
  S.active=true;S.turn=-1;banner('Dealing cards...');renderChips();updateControls();
  later(()=>startTurn(first),1200);
}

function startTurn(i){
  if(!S.active)return;S.turn=i;S.busy=false;const p=P[i];
  if(!p.seen&&p.blindCount>=4){forceSee(i)}
  renderChips();
  if(i===0){
    banner('👉 Your turn to act');updateControls();
    timerStart(0,18000,()=>{toast('Auto-folded due to timeout');humanPack()});buzz(30);
  } else {
    banner(`${p.name}'s turn...`);updateControls();
    /* Bot thinking time increased by 1.5x (1.7s to 3.2s) */
    const think=rnd(1700,3200);
    timerStart(i,think+350);later(()=>botDecide(i),think);
  }
}

function forceSee(i){const p=P[i];p.seen=true;if(i===0){renderCards(0,'face');flipUp(0);toast('4 Blinds reached: Cards revealed')}setSt(i,'SEEN','seen')}
function pay(i,cost,label,cls){const p=P[i];cost=Math.min(cost,p.chips);p.chips-=cost;S.pot+=cost;if(i===0){save.chips=p.chips;persist()}flyTo(i);SFX.chip();setSt(i,label+' '+fmt(cost),cls);renderChips();return cost}
function placeBet(i,m){const p=P[i],lbl=m===2?'RAISE':(p.seen?'CALL':'BLIND'),c=amt(p,m);
 if(!p.seen)p.blindCount++;S.stake*=m;pay(i,c,lbl,p.seen?'seen':'');banner(`${p.name}: ${lbl} ${fmt(c)}`);afterBet()}
function afterBet(){updateControls();nextTurn()}

function nextTurn(){
  timerStop();const cur=S.turn;S.turn=-1;const al=alive();
  if(al.length===1){endRound(al[0].id,{});return}
  if(S.pot>=S.potLimit){banner('Pot limit reached — Showdown!');let b=al[0];for(const p of al)if(p.ev.score>b.ev.score)b=p;S.busy=true;later(()=>endRound(b.id,{reveal:true}),900);return}
  let n=cur;do{n=(n+1)%5}while(P[n].folded);S.busy=true;updateControls();later(()=>startTurn(n),550);
}
function fold(i){const p=P[i];p.folded=true;setSt(i,'FOLDED','pack');$('#seat-'+i).classList.add('fold');if(i>0)renderCards(i,'none');SFX.pack();updateControls();nextTurn()}
function showdown(i){
  const me=P[0],o=alive().find(p=>p.id!==i);if(!o)return;
  timerStop();const c=amt(me,1);pay(i,c,'SHOWDOWN');bubble(i,'Showdown!');S.busy=true;updateControls();
  const w=me.ev.score>o.ev.score?me.id:o.id;
  banner('SHOWDOWN!');later(()=>endRound(w,{reveal:true}),900);
}
function requestSideShow(i){
  const p=P[i],q=P[prevActive(i)];timerStop();S.busy=true;updateControls();
  pay(i,amt(p,1),'SIDE SHOW');banner(`${p.name} requests Side Show with ${q.name}`);bubble(i,'Side show?');
  const resolve=acc=>{
   if(!acc){bubble(q.id,'Declined ✋');toast(`${q.name} declined Side Show`);later(()=>nextTurn(),900);return}
   bubble(q.id,'Accepted 🤝');const loser=p.ev.score>q.ev.score?q:p;const humanIn=(p.id===0||q.id===0);
   if(humanIn){const o=p.id===0?q:p;renderCards(o.id,'face');
     later(()=>{renderCards(o.id,'back');fold(loser.id)},2400)}
   else later(()=>fold(loser.id),1000);
  };
  if(q.id===0){$('#ssTxt').textContent=`${p.name} requests a Side Show. Accept?`;$('#ssM').hidden=false;S.ssResolve=resolve;
    later(()=>{if(S.ssResolve){$('#ssM').hidden=true;const r=S.ssResolve;S.ssResolve=null;r(false)}},9000)}
  else later(()=>{const s=strength(q.ev)+q.noise;resolve(Math.random()<(s>.6?.85:s>.35?.55:.3))},1500);
}

function botDecide(i){
  if(!S.active||S.turn!==i)return;timerStop();const p=P[i],n=alive().length,s=strength(p.ev)+p.noise;
  const isTopBot=(p.ev.score>=Math.max(...alive().map(x=>x.ev.score)));

  if(!p.seen){
    const ch=.12+.22*p.blindCount+(S.stake>=S.boot*4?.25:0)+(S.pot>S.boot*30?.15:0);
    if(Math.random()<ch){
      p.seen=true;setSt(i,'SEEN','seen');
      if(Math.random()<0.2) bubble(i,'Seen 👀');
      /* 1.5x bot decision delay after seeing cards */
      const seeThink=rnd(1350,2400);
      timerStart(i,seeThink+350);
      later(()=>botDecide(i),seeThink);
      return;
    }
  }

  const c1=amt(p,1),c2=amt(p,2),canR=p.chips>=c2&&S.stake*2<=S.maxStake;
  if(p.chips<c1){bubble(i,'Fold');return fold(i)}

  if(!p.seen){
    if(n===2&&Math.random()<.18)return showdown(i);
    if(c1>p.chips*.3&&Math.random()<.08){bubble(i,'Fold');return fold(i)}
    if(canR&&Math.random()<.14){bubble(i,'Raise! 🔥');return placeBet(i,2)}
    return placeBet(i,1);
  }

  /* If this round is designated B_WIN and this bot holds the winning hand, play confidently */
  if(S.roundMode==='B_WIN'&&isTopBot){
    if(n===2&&Math.random()<.45)return showdown(i);
    if(canR&&Math.random()<.32){bubble(i,'Raise! 🔥');return placeBet(i,2)}
    return placeBet(i,1);
  }

  if(n===2){const ps=s>.62?.75:s>.4?.35:.12;if(Math.random()<ps){return showdown(i)}}
  if(n>2&&s>.5&&Math.random()<.15&&P[prevActive(i)].seen&&p.chips>=c1)return requestSideShow(i);

  let fp=s<.5?(.5-s)*1.1+Math.min(.4,(S.stake/S.boot-1)*.05):0;if(c1>p.chips*.5)fp+=.2;
  if(Math.random()<fp){
    bubble(i,['Fold','Passing','Out'][ri(0,2)]);
    return fold(i);
  }
  if(s>.7&&canR&&Math.random()<.35){bubble(i,'Raise! 🔥');return placeBet(i,2)}
  placeBet(i,1);
}

function endRound(w,o){
  clearAll();S.gen++;S.active=false;S.turn=-1;S.busy=true;timerStop();const win=P[w],pot=S.pot;
  if(o.reveal)alive().forEach(p=>{renderCards(p.id,'face');setSt(p.id,p.ev.name,p.id===w?'win':'seen')});
  if(o.reveal&&!P[0].seen&&!P[0].folded){P[0].seen=true;flipUp(0)}
  for(let k=0;k<8;k++)fly($('#potBox'),$('#av-'+w),k*70);
  win.chips+=pot;S.pot=0;
  $('#seat-'+w).classList.add('won');setSt(w,'WINNER 🏆','win');
  SFX.win();

  if(w===0){
    buzz([80,50,80]);save.wins++;save.best=Math.max(save.best,pot);
    banner(`🏆 YOU WON ${fmt(pot)}!`);
  } else {
    banner(`🏆 ${win.name} won ${fmt(pot)}${o.reveal?' — '+win.ev.name:''}`);
  }

  save.hands++;save.chips=P[0].chips;persist();renderChips();updateControls();
  simulatePlayerRotation();

  let sec=4;
  const tick=()=>{
    if(anyModalOpen()){later(tick,400);return}
    if(sec<=0){startRound();return}
    toast(`Next hand in ${sec}s`);sec--;later(tick,1000);
  };
  later(tick,2200);
}

function humanSee(){const me=P[0];if(!S.active||me.folded||me.seen)return;me.seen=true;SFX.see();buzz(15);setSt(0,'SEEN','seen');flipUp(0);updateControls();renderChips()}
function humanChaal(m){const me=P[0];if(!S.active||S.turn!==0||S.busy)return;const c=amt(me,m);if(me.chips<c)return;if(m===2&&S.stake*2>S.maxStake)return;buzz(20);placeBet(0,m)}
function humanPack(){if(!S.active||S.turn!==0||S.busy)return;timerStop();buzz(20);fold(0)}
function humanSS(){const me=P[0];if(!S.active||S.turn!==0||S.busy)return;if(alive().length===2)showdown(0);else if(me.seen&&P[prevActive(0)].seen)requestSideShow(0)}

/* ---------- Direct App Exit on Header X ---------- */
function exitAppDirect(){
  save.chips=P[0].chips;persist();
  clearAll();S.active=false;timerStop();
  try{
    if(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App){
      window.Capacitor.Plugins.App.exitApp();
      return;
    }
    if(navigator.app&&navigator.app.exitApp){
      navigator.app.exitApp();
      return;
    }
    window.close();
  }catch(e){}
  toast('Closing Royal 3-Card Casino 3D...');
}

/* ---------- Gift Tossing & Quick Chat ---------- */
function openGiftMenu(botId){
  activeTargetBot=botId;
  const rect=$('#av-'+botId).getBoundingClientRect();
  const wrap=$('#tableWrap').getBoundingClientRect();
  const gp=$('#giftPicker');
  gp.style.left=(rect.left+rect.width/2-wrap.left)+'px';
  gp.style.top=(rect.top-wrap.top-10)+'px';
  gp.hidden=false;
}

function throwGift(emoji){
  $('#giftPicker').hidden=true;
  if(activeTargetBot<1)return;
  const targetId=activeTargetBot;activeTargetBot=-1;
  const w=$('#tableWrap'),r=w.getBoundingClientRect();
  const A=$('#av-0').getBoundingClientRect(),B=$('#av-'+targetId).getBoundingClientRect();

  const g=document.createElement('div');
  g.className='fgift';g.textContent=emoji;
  g.style.left=(A.left+A.width/2-r.left-16)+'px';
  g.style.top=(A.top+A.height/2-r.top-16)+'px';
  w.appendChild(g);

  setTimeout(()=>{
    g.style.left=(B.left+B.width/2-r.left-16)+'px';
    g.style.top=(B.top+B.height/2-r.top-16)+'px';
    g.style.transform='rotate(720deg) scale(1.3)';
  },20);

  setTimeout(()=>{
    g.remove();
    splatEffect(B.left+B.width/2-r.left,B.top+B.height/2-r.top,emoji,targetId);
  },620);
}

function splatEffect(x,y,emoji,targetId){
  const w=$('#tableWrap');
  const s=document.createElement('div');
  s.className='splat';s.textContent=emoji;
  s.style.left=(x-20)+'px';s.style.top=(y-20)+'px';
  w.appendChild(s);

  if(emoji==='💣'){SFX.boom();buzz([40,30,80])}
  else{SFX.splat();buzz(30)}

  const reactions={
    '🍅':['Ouch! 🍅','Messy!','Hey!'],
    '🌹':['Thank you! 💖','So sweet!','Classy!'],
    '🍺':['Cheers! 🍻','Bottoms up!','Salute!'],
    '💣':['Boom! 💥','Watch it!','Madman! 😂'],
    '💩':['Eww! 🤮','Gross!','Unbelievable!']
  };
  const list=reactions[emoji]||['Haha!'];
  bubble(targetId,list[ri(0,list.length-1)]);
  setTimeout(()=>s.remove(),500);
}

function sendQuickChat(msg){
  $('#chatM').hidden=true;
  bubble(0,msg);
  setTimeout(()=>{
    const aliveBots=alive().filter(p=>p.id!==0);
    if(aliveBots.length&&Math.random()<.6){
      const responder=aliveBots[ri(0,aliveBots.length-1)];
      const botReplies=['Haha nice!','Play on! 🔥','Let’s see! 😎','Watch your stack!','GG!'];
      bubble(responder.id,botReplies[ri(0,botReplies.length-1)]);
    }
  },1000);
}

/* ---------- 3D Horizontal Lobby ---------- */
function buildLobby(first){
  $('#lobbySub').textContent=first?'Select your royal room to play':'Table change takes effect next round';
  $('#lClose').hidden=first;
  renderChips();
  const box=$('#tables');box.innerHTML='';
  TABLE_TIERS.forEach((t,idx)=>{
    const unlocked=P[0].chips>=t.unlock;
    const e=document.createElement('button');
    e.className='tbtn'+(unlocked?'':' locked');
    e.dataset.t=String(idx+1);
    e.innerHTML=`<b>${t.name} (Ante ${fmt(t.boot)})</b><small>${unlocked?`Pot limit ${fmt(t.boot*100)}`:`🔒 Unlock at ${fmt(t.unlock)}`}</small>`;
    e.onclick=()=>{
      if(unlocked)pickTable(t.boot,first);
      else openStore(`Unlock ${t.name} at ${fmt(t.unlock)} balance! You currently have ${fmt(P[0].chips)}.`);
    };
    box.appendChild(e);
  });
}

function pickTable(b,first){
  SFX.init();$('#lobby').hidden=true;
  S.boot=b;save.boot=b;persist();applyTheme(b,true);

  /* Load 4 fresh real faces & names on every table entry */
  populateBots();

  if(first||!S.started){
    S.started=true;countdownStart();
  } else if(!S.active){
    countdownStart();
  } else {
    pendingBoot=b;toast('New table room starts next round');
  }
}

/* ---------- LIVE PRODUCTION UNITY ADS ENGINE (Game ID: 800438848) ---------- */
const UnityAdsEngine = {
  gameId: '800438848',
  rewardedPlacement: 'Rewarded_Android',
  rewardAmount: 100000,
  cooldownMinutes: 5,
  initialized: false,
  isShowing: false,
  cooldownInterval: null,

  async init() {
    if (this.initialized) return;
    try {
      const plugin = this.getPlugin();
      if (plugin && plugin.initialize) {
        await plugin.initialize({ gameId: this.gameId, testMode: false });
        this.initialized = true;
        this.loadRewarded();
      }
    } catch (e) {}
  },

  getPlugin() {
    if (window.Capacitor && window.Capacitor.Plugins) {
      return window.Capacitor.Plugins.UnityAds || window.Capacitor.Plugins.UnityAdsPlugin;
    }
    return window.UnityAds || null;
  },

  async loadRewarded() {
    try {
      const plugin = this.getPlugin();
      if (plugin && plugin.load) {
        await plugin.load({ placementId: this.rewardedPlacement });
      }
    } catch (e) {}
  },

  async startAdReward() {
    if (this.isShowing) return;
    const now = Date.now();
    if (save.adCooldownUntil && save.adCooldownUntil > now) {
      const remSec = Math.ceil((save.adCooldownUntil - now) / 1000);
      toast(`⏳ Next ad ready in ${Math.ceil(remSec / 60)}m`);
      return;
    }

    const plugin = this.getPlugin();
    if (!plugin || !plugin.show) {
      toast('Ads available in Amazon Appstore Android build.');
      return;
    }

    try {
      this.isShowing = true;
      toast('Loading Unity Rewarded Video...');
      const res = await plugin.show({ placementId: this.rewardedPlacement });
      this.isShowing = false;

      if (res && (res.state === 'COMPLETED' || res.completed === true || res.rewarded === true)) {
        this.onAdCompleted();
      } else {
        toast('Watch full video ad to claim 1L chips.');
      }
      this.loadRewarded();
    } catch (e) {
      this.isShowing = false;
      toast('Ad not ready right now. Try again shortly.');
      this.loadRewarded();
    }
  },

  onAdCompleted() {
    creditDirect(this.rewardAmount);
    save.adCooldownUntil = Date.now() + (this.cooldownMinutes * 60 * 1000);
    persist();
    $('#brokeM').hidden = true;
    toast('🎉 +1,00,000 Free Chips Credited!');
    this.applyButtonCooldown();
  },

  applyButtonCooldown() {
    const btns = [$('#btnRewardHeader'), $('#btnRewardLobby'), $('#brokeWatchAd')];
    clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      const diff = (save.adCooldownUntil || 0) - Date.now();
      if (diff <= 0) {
        clearInterval(this.cooldownInterval);
        btns.forEach(b => {
          if (!b) return;
          b.disabled = false;
          if (b.id === 'btnRewardHeader') b.innerHTML = `<span class="ad-icon-pulse"></span><span>▶ 1L FREE CHIPS</span>`;
          else if (b.id === 'btnRewardLobby') b.innerHTML = `<span class="ad-icon-pulse"></span><span>▶ WATCH AD · +1L CHIPS</span>`;
          else b.innerHTML = `<span class="ad-icon-pulse"></span><span>▶ Watch Video Ad (+1L)</span>`;
        });
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
        btns.forEach(b => {
          if (!b) return;
          b.disabled = true;
          b.textContent = `⏱ Refill (${timeStr})`;
        });
      }
    }, 1000);
  }
};

/* ---------- LIVE PRODUCTION AMAZON IAP (Strict Verified Purchase Only) ---------- */
const PACKS=[
  {sku:'chips_pack_starter', usd:'$0.99',   chips:2000000,   tag:'STARTER'},
  {sku:'chips_pack_bronze',  usd:'$1.99',   chips:5000000,   tag:'BRONZE'},
  {sku:'chips_pack_popular', usd:'$4.99',   chips:15000000,  tag:'POPULAR'},
  {sku:'chips_pack_value',   usd:'$9.99',   chips:40000000,  tag:'VALUE'},
  {sku:'chips_pack_vip',     usd:'$19.99',  chips:100000000, tag:'VIP'},
  {sku:'chips_pack_emperor', usd:'$49.99',  chips:300000000, tag:'BEST VALUE'}
];

const AmazonIAP={
  getNativeBridge(){
    if(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.AmazonIAP){
      return window.Capacitor.Plugins.AmazonIAP;
    }
    if(window.amzn_wa&&window.amzn_wa.IAP)return window.amzn_wa.IAP;
    return null;
  },

  init(){
    const bridge=this.getNativeBridge();
    if(!bridge)return;
    try{
      if(bridge.registerObserver){
        bridge.registerObserver({
          onSdkAvailable:()=>{
            try{
              bridge.getItemData(PACKS.map(p=>p.sku));
              bridge.getUserData();
              bridge.getPurchaseUpdates(true);
            }catch(e){}
          },
          onItemDataResponse:()=>{},
          onPurchaseResponse:(resp)=>{
            if(resp&&resp.purchaseRequestStatus==='SUCCESSFUL'){
              const receiptId=resp.receipt&&resp.receipt.receiptId?resp.receipt.receiptId:null;
              if(receiptId&&save.processedReceipts.includes(receiptId))return;
              if(receiptId){save.processedReceipts.push(receiptId);persist();}
              const sku=(resp.receipt&&resp.receipt.sku)?resp.receipt.sku:'chips_pack_starter';
              const pack=PACKS.find(p=>p.sku===sku)||PACKS[0];
              creditDirect(pack.chips);
              $('#storeM').hidden=true;
              toast(`Payment Verified: +${fmt(pack.chips)} Chips Credited!`);
              if(typeof buildLobby==='function')buildLobby(!S.started);
            } else {
              toast('Purchase cancelled or not completed.');
            }
          },
          onPurchaseUpdatesResponse:(resp)=>{
            if(resp&&Array.isArray(resp.receipts)){
              resp.receipts.forEach(r=>{
                if(r&&r.receiptId&&!save.processedReceipts.includes(r.receiptId)){
                  save.processedReceipts.push(r.receiptId);
                  const pack=PACKS.find(p=>p.sku===r.sku);
                  if(pack)creditDirect(pack.chips);
                }
              });
              persist();
            }
          },
          onUserDataResponse:()=>{}
        });
      }
    }catch(e){}
  },

  async purchase(sku){
    const pack=PACKS.find(p=>p.sku===sku);
    if(!pack)return;

    const bridge=this.getNativeBridge();
    if(!bridge){
      toast('Amazon Store billing works inside the Amazon Appstore APK.');
      return;
    }

    try{
      toast(`Opening Amazon Checkout (${pack.usd})...`);
      if(bridge.purchase){
        const res=await bridge.purchase(sku);
        /* Support Promise-based Capacitor AmazonIAP plugin response */
        if(res&&res.status==='SUCCESSFUL'){
          if(res.receiptId&&save.processedReceipts.includes(res.receiptId))return;
          if(res.receiptId){save.processedReceipts.push(res.receiptId);persist();}
          creditDirect(pack.chips);
          $('#storeM').hidden=true;
          toast(`Payment Verified: +${fmt(pack.chips)} Chips Credited!`);
          buildLobby(!S.started);
        }
      }
    }catch(e){
      toast('Amazon Store checkout failed. Try again.');
    }
  }
};

window.buyPack=function(i){
  const k=PACKS[i];
  if(k)AmazonIAP.purchase(k.sku);
};

function openStore(msg){
  $('#storeMsg').textContent=msg||'Instant chips via Amazon Appstore';
  $('#packs').innerHTML=PACKS.map((k,i)=>`
    <button type="button" class="pack" data-i="${i}" onclick="buyPack(${i})">
      <span class="tg">${k.tag}</span>
      <span class="coin"></span>
      <b>${fmt(k.chips)}</b>
      <span class="pr">${k.usd}</span>
    </button>
  `).join('');
  $('#brokeM').hidden=true;
  $('#storeM').hidden=false;
}

function creditDirect(amount){
  P[0].chips+=amount;save.chips=P[0].chips;persist();renderChips();SFX.win();updateControls();
}

/* ---------- 7-Day Streak Mechanics ---------- */
const STREAK_REWARDS=[300000,500000,700000,1000000,1500000,2500000,5000000];

function getNextMidnightDiff(){
  const now=new Date();
  const nextMid=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0);
  return Math.max(0,Math.floor((nextMid.getTime()-now.getTime())/1000));
}

function checkDailyStreak(){
  const today=new Date().toISOString().slice(0,10);
  if(save.lastDailyDate!==today){
    renderStreakModal();
    $('#dailyM').hidden=false;
  }
}

function renderStreakModal(){
  const grid=$('#streakGrid');grid.innerHTML='';
  const today=new Date().toISOString().slice(0,10);
  const alreadyClaimed=(save.lastDailyDate===today);
  const curDay=save.streakDay||1;

  STREAK_REWARDS.forEach((amt,idx)=>{
    const d=idx+1;
    const isToday=d===curDay;
    const claimed=alreadyClaimed?d<=curDay:d<curDay;
    const el=document.createElement('div');
    el.className=`sday ${claimed?'claimed':''} ${isToday?'today':''} ${d===7?'day7':''}`;
    el.innerHTML=`Day ${d} ${d===7?'👑 MEGA':''}<b>+${fmt(amt)}</b><span>${claimed?'Claimed ✓':isToday?'Ready Now':'Locked'}</span>`;
    grid.appendChild(el);
  });

  const btn=$('#dailyClaim');
  if(alreadyClaimed){
    const diff=getNextMidnightDiff();
    const h=Math.floor(diff/3600),m=Math.floor((diff%3600)/60),s=diff%60;
    btn.disabled=true;
    btn.textContent=`Next Reward in ${h}h ${m}m ${s}s`;
  } else {
    btn.disabled=false;
    btn.textContent=`Claim Day ${curDay} (+${fmt(STREAK_REWARDS[curDay-1])})`;
  }
}

function claimDailyStreak(){
  const today=new Date().toISOString().slice(0,10);
  if(save.lastDailyDate===today){
    toast('Already claimed today! Next reward unlocks tomorrow.');
    return;
  }
  const curDay=save.streakDay||1;
  const reward=STREAK_REWARDS[curDay-1]||300000;
  save.lastDailyDate=today;
  save.streakDay=(curDay%7)+1;
  creditDirect(reward);
  renderStreakModal();
  toast(`+${fmt(reward)} Daily Reward Claimed!`);
  buildLobby(!S.started);
}

/* ---------- Rules Modal ---------- */
function buildRules(){
  const ex=(a)=>`<div class="mini">${a.map(c=>`<div class="cw">${card3(c,true)}</div>`).join('')}</div>`;
  const row=(t,d,a)=>`<div class="hr">${ex(a)}<div><b>${t}</b><br><span style="font-size:11px;color:#fcd34d">${d}</span></div></div>`;
  $('#rulesBody').innerHTML=`<h3>Hand Rankings</h3>
  ${row('1. Three of a Kind (Trail)','Three cards of identical rank (A-A-A is highest)',[{s:'S',v:14},{s:'H',v:14},{s:'D',v:14}])}
  ${row('2. Straight Flush (Pure Seq)','Three consecutive cards of identical suit',[{s:'H',v:12},{s:'H',v:13},{s:'H',v:14}])}
  ${row('3. Straight (Sequence)','Three consecutive cards with mixed suits',[{s:'S',v:7},{s:'H',v:8},{s:'D',v:9}])}
  ${row('4. Flush (Color)','Three cards of same suit, not consecutive',[{s:'C',v:2},{s:'C',v:9},{s:'C',v:13}])}
  ${row('5. Pair','Two cards of identical numerical rank',[{s:'S',v:10},{s:'D',v:10},{s:'C',v:4}])}
  ${row('6. High Card','Highest card value determines winning hand',[{s:'S',v:14},{s:'H',v:9},{s:'D',v:5}])}
  <h3>Table Rules</h3>
  <ul>
    <li><b>Ante:</b> Compulsory entry fee deducted before cards are dealt.</li>
    <li><b>Blind vs Seen:</b> Blind players pay 1x stake. Seen players pay 2x stake.</li>
    <li><b>Interactive Table:</b> Tap any player avatar to toss fun emojis & gifts!</li>
    <li><b>Lobby Switch:</b> Tap ☰ in the header to switch tables anytime.</li>
  </ul>`;
}

const MODALS=['lobby','rulesM','brokeM','storeM','dailyM','chatM'];
const anyModalOpen=()=>MODALS.some(id=>!$('#'+id).hidden);

function bind(){
  $('#bChaal').onclick=()=>humanChaal(1);$('#bRaise').onclick=()=>humanChaal(2);$('#bPack').onclick=()=>humanPack();
  $('#bSee').onclick=humanSee;$('#bSS').onclick=humanSS;$('#cards-0').onclick=humanSee;
  $('#hLobby').onclick=()=>{buildLobby(false);$('#lobby').hidden=false};
  $('#lClose').onclick=()=>{$('#lobby').hidden=true;if(S.started&&!S.active&&P[0].chips<S.boot)$('#brokeM').hidden=false};
  $('#hRules').onclick=$('#lRules').onclick=()=>{$('#rulesM').hidden=false};
  $('#rClose').onclick=()=>$('#rulesM').hidden=true;

  $('#lStore').onclick=()=>openStore();
  $('#lobbyBuyPill').onclick=()=>openStore();
  $('#lStreak').onclick=()=>{renderStreakModal();$('#dailyM').hidden=false};
  $('#dailyClaim').onclick=claimDailyStreak;
  $('#dailyClose').onclick=()=>$('#dailyM').hidden=true;

  const triggerAd=()=>UnityAdsEngine.startAdReward();
  $('#btnRewardHeader').onclick=triggerAd;
  $('#btnRewardLobby').onclick=triggerAd;
  $('#brokeWatchAd').onclick=triggerAd;

  $('#brokeOffer').onclick=()=>buyPack(0);
  $('#brokeClaimFree').onclick=()=>{
    $('#brokeM').hidden=true;
    renderStreakModal();
    $('#dailyM').hidden=false;
  };

  $('#hSound').onclick=()=>{save.mute=!save.mute;persist();$('#hSound').innerHTML=save.mute?'🔇':'🔊';SFX.init()};
  $('#ssYes').onclick=()=>{$('#ssM').hidden=true;const r=S.ssResolve;S.ssResolve=null;r&&r(true)};
  $('#ssNo').onclick=()=>{$('#ssM').hidden=true;const r=S.ssResolve;S.ssResolve=null;r&&r(false)};

  $('#brokeBuy').onclick=()=>openStore('Refill chips to keep playing.');
  $('#brokeTable').onclick=()=>{$('#brokeM').hidden=true;buildLobby(false);$('#lobby').hidden=false};

  $('#hBuy').onclick=()=>openStore();
  $('#storeClose').onclick=()=>{$('#storeM').hidden=true;if(!S.active&&S.started&&P[0].chips<S.boot)$('#brokeM').hidden=false};

  $('#bChat').onclick=()=>{$('#chatM').hidden=false};
  $('#chatClose').onclick=()=>$('#chatM').hidden=true;
  document.querySelectorAll('.cmsg').forEach(b=>b.onclick=()=>sendQuickChat(b.textContent));

  document.querySelectorAll('#giftPicker button').forEach(b=>{
    b.onclick=(e)=>{e.stopPropagation();throwGift(b.dataset.g)};
  });
  document.addEventListener('click',()=>{$('#giftPicker').hidden=true});

  $('#hLeave').onclick=exitAppDirect;
  $('#lExit').onclick=exitAppDirect;

  document.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();
    if(k==='c')humanChaal(1);else if(k==='r')humanChaal(2);else if(k==='f'||k==='p')humanPack();else if(k==='s')humanSee();else if(k==='h')humanSS();
  });
  document.addEventListener('contextmenu',e=>e.preventDefault());

  const unlockAudio=()=>{
    SFX.init();
    window.removeEventListener('click',unlockAudio);
    window.removeEventListener('touchstart',unlockAudio);
  };
  window.addEventListener('click',unlockAudio);
  window.addEventListener('touchstart',unlockAudio);
}

buildSeats();bind();buildRules();initFx();
AmazonIAP.init();
UnityAdsEngine.init();
applyTheme(S.boot,false);
$('#hSound').innerHTML=save.mute?'🔇':'🔊';
renderChips();
buildLobby(true);
checkDailyStreak();

if(save.adCooldownUntil&&save.adCooldownUntil>Date.now()){
  UnityAdsEngine.applyButtonCooldown();
}

})();