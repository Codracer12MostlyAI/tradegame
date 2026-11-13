/* Trade Game - browser client (UI). Game rules live in game.js; the server is the source of truth. */
'use strict';
/* ================= ICONS (no emoji) ================= */
const IC={
 grain:'<path d="M12 21V8"/><path d="M12 8c-2.2-.6-3.4-2.4-3.4-4.6 2.2.3 3.4 1.8 3.4 3.6M12 8c2.2-.6 3.4-2.4 3.4-4.6-2.2.3-3.4 1.8-3.4 3.6M12 13c-2.2-.6-3.4-2.4-3.4-4.6 2.2.3 3.4 1.8 3.4 3.6M12 13c2.2-.6 3.4-2.4 3.4-4.6-2.2.3-3.4 1.8-3.4 3.6"/>',
 lumber:'<ellipse cx="7" cy="12" rx="3" ry="5"/><path d="M7 7h10a3 5 0 0 1 0 10H7"/><path d="M7 10.5v3"/>',
 oil:'<path d="M12 3c3.2 4.2 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.8-6.8 6-11z"/>',
 gold:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/>',
 steel:'<path d="M5 5h14M5 19h14M12 5v14"/>',
 textiles:'<path d="M7 4h10M7 20h10M8.5 4v16M15.5 4v16M8.5 9l7 2M8.5 13l7 2"/>',
 electronics:'<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
 cars:'<path d="M4 16v-3.5L6.5 7h11l2.5 5.5V16z"/><path d="M4 12.5h16"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/>',
};
const OUT_SVG={
 stale:'<path d="M5 9.5h14M5 14.5h14"/>',
 loss:'<path d="M6 21V4M6 4h11l-2.5 4 2.5 4H6"/>',
 win:'<path d="M4 20 20 4M15 4h5v5M20 20 4 4M4 15v5h5"/>',
 major:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3.8M16 6h2.5a2.5 2.5 0 0 1-2.6 3.8M12 13v4M8 20h8"/>',
 clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
};
const svgI=(paths,sz)=>`<svg width="${sz||34}" height="${sz||34}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ico=(id,sz)=>svgI(IC[id],sz||18);
function codeHue(c){let h=0;for(const ch of c)h=(h*31+ch.charCodeAt(0))%360;return h;}
function av(n,cls){const h=codeHue(n.flag);return`<span class="av code ${cls||''}" style="background:hsl(${h},70%,90%);color:hsl(${h},45%,28%)">${n.flag}</span>`;}

/* ================= UI HELPERS ================= */
const $=id=>document.getElementById(id);
let toastT=0;
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2300);}
function openSheet(h){$('sheet').innerHTML='<div class="grab"></div>'+h;$('sheet').scrollTop=0;$('sheetBg').classList.add('open');}
function closeSheet(){$('sheetBg').classList.remove('open');}
const sheetOpen=()=>$('sheetBg').classList.contains('open');
const fmtSigned=v=>(v>=0?'+':'')+fmtN(v);
function itemStr(it){return it.item==='money'?fmtMoney(it.qty):`${fmtN(it.qty)} ${R[it.item].name}`;}
function tagList(n,st){return IDS.filter(id=>status(n,id)===st).map(id=>`<span class="ri" title="${R[id].name}">${ico(id)}</span>`).join(' ');}
function relC(r){return r>=30?'#16a34a':r>=10?'#65c98b':r>-10?'#9a9a9a':r>-40?'#f59e0b':'#dc2626';}
function momLine(cur,prev){if(prev==null||Math.abs(prev)<1)return'— month over month';const p=(cur-prev)/Math.abs(prev)*100;return`${p>=0?'+':''}${p.toFixed(Math.abs(p)<10?1:0)}% month over month`;}


/* ================= SCREENS ================= */
function render(){
 if(!G)return;
 const sc=$('screen'),st=sc.scrollTop,hs={};
 document.querySelectorAll('[data-keep]').forEach(e=>hs[e.dataset.keep]=e.scrollLeft);
 $('avatar').innerHTML=av(P,'top');updateFab();
 $('spectate').classList.toggle('hidden',!CUR.over);
 sc.innerHTML='<div class="wrap">'+{home:vHome,search:vSearch,trade:vTrade,wallet:vWallet}[UI.nav]()+'</div>';
 sc.scrollTop=st;
 document.querySelectorAll('[data-keep]').forEach(e=>{if(hs[e.dataset.keep]!=null)e.scrollLeft=hs[e.dataset.keep];});
 document.querySelectorAll('.bn').forEach(b=>b.classList.toggle('active',b.dataset.nav===UI.nav));
 $('dotTrade').classList.toggle('hidden',!G.offer&&!G.requests.length);$('dotHome').classList.toggle('hidden',!G.war&&!P.gov.decision&&!G.invOffer);
 drawSparks();drawGdpChart();bindMap();
}
function vHome(){
 const pills=[['map','Map'],['nation','Nation'],['business','Business'],['global','Global'],['wars','Wars']];
 return`<div class="pills">${pills.map(([k,l])=>`<button class="pill ${UI.pill===k?'on':''}" onclick="setPill('${k}')">${l}${(k==='wars'&&G.war)||(k==='nation'&&P.gov.decision)||(k==='global'&&G.invOffer)?'<i class="rd"></i>':''}</button>`).join('')}</div>`+(UI.pill==='wars'?'<div class="narrow">'+vWars()+'</div>':{map:vMap,nation:vNation,business:vBusiness,global:vGlobal}[UI.pill]());
}
function vMap(){
 const prev=G.hist[G.hist.length-2];const rk=rankOf(P);
 const prog=clamp((P.gdp-G.startGdp)/(G.target-G.startGdp),0,1);
 const short=Object.keys(NEED).filter(k=>(P.lastNeedRatio[k]??1)<0.9);
 const cards=[
  ['Treasury',fmtMoney(P.money),momLine(P.money,prev&&prev.money)],
  ['GDP per year',fmtMoney(P.gdp),momLine(P.gdp,prev&&prev.gdp)],
  ['World rank','#'+rk,prev&&prev.rank?(prev.rank>rk?`▲ up ${prev.rank-rk} since last month`:prev.rank<rk?`▼ down ${rk-prev.rank} since last month`:'No change since last month'):`of ${G.nations.length} nations`],
  ['Stability',Math.round(P.gov.stab)+'%',P.gov.decision?'A decision needs your attention':P.gov.pol.gov===0?`Election in ${monthsUntil(P.gov.nextElection)} · ${voteShare(P).toFixed(0)}% projected`:'Autocracy · no elections'],
  ['Happiness',Math.round(P.happy)+'%',short.length?`Short on ${short.map(k=>R[k].name.toLowerCase()).join(', ')}`:'All citizen needs met'],
  ['Goal',Math.round(prog*100)+'%',G.won?'Goal reached ':`${G.goalMult}× GDP → ${fmtMoney(G.target)}`],
 ];
 let h=`<div class="hscroll" data-keep="stats">${cards.map(c=>`<div class="stat"><div class="st-t">${c[0]}</div><div class="st-v">${c[1]}</div><div class="st-s">${c[2]}</div></div>`).join('')}</div>`;
 h+=`<div class="map-split"><div class="mapcard"><canvas id="map"></canvas><div class="map-date">${dateStr()}</div><div class="map-ctl"><button onclick="zoomMap(1)">+</button><button onclick="zoomMap(-1)">−</button><button onclick="centerMap()" title="Center on you">◎</button></div></div>`;
 const list=G.nations.filter(n=>n.id!==P.id).sort((a,b)=>{const pr=n=>(G.war&&G.war.enemy===n.id?8:0)+(n.isPlayer?4:0)+(G.offer&&G.offer.partner===n.id?2:0)+(G.deals.some(d=>d.partner===n.id)?1:0);return pr(b)-pr(a)||b.rel-a.rel;});
 h+=`<div class="card"><div class="card-t">Countries <span class="xs muted">tap for deals & diplomacy</span></div>${list.map(n=>countryRow(n)).join('')}</div></div>`;
 return h;
}
function vBusiness(){
 let h=`<div class="card" style="margin-top:0"><div class="card-t">National industry</div>
  <div class="kv"><span>Total upkeep</span><span>${fmtMoney(upkeep(P))}/mo</span></div>
  <div class="kv"><span>Building materials</span><span>${fmtN(P.stock.steel)} steel · ${fmtN(P.stock.lumber)} lumber</span></div>
  <div class="fine">Steel needs oil, electronics need gold, cars need steel + electronics. Missing building materials are bought automatically.</div></div><div class="cards">`;
 RES.forEach(r=>{const id=r.id,lv=P.ind[id],locked=DEPOSIT.includes(id)&&!P.dep[id];
  const per=outPer(id)*prodMult(P,id);let inCost=0;const rec=RECIPE[id];if(rec)for(const k in rec)inCost+=rec[k]*M.price[k];
  const prof=per*(M.price[id]-inCost)-levelUpkeep(P,id),c=buildCost(P,id);
  h+=`<div class="card"><div class="ind-h"><span class="av sq">${ico(r.id)}</span><span class="cr-main"><span class="cr-n">${r.name}</span><span class="cr-s">${locked?'No natural deposits':`${fmtN(capacity(P,id))} units/mo · $${M.price[id].toFixed(0)} each`}</span></span><span class="lvl">Lv ${lv}</span></div>`;
  if(locked)h+=`<div class="fine">${r.name} needs natural deposits. A survey has a 40% chance to find some.</div><button class="btn dark full" onclick="survey('${id}')" ${P.money<SURVEY_COST?'disabled':''}>Survey · ${fmtMoney(SURVEY_COST)}</button>`;
  else h+=`<div class="kv"><span>Inputs per unit</span><span>${rec?Object.entries(rec).map(([k,v])=>`${v} ${R[k].name.toLowerCase()}`).join(' + '):'none'}</span></div>
   <div class="kv"><span>Profit per level</span><span class="${prof>=0?'pos':'neg'}">${sign(prof)}/mo</span></div>
   <div class="row-btns"><button class="btn dark grow" onclick="upgrade('${id}')" ${P.money<c.money?'disabled':''}>${lv?'Upgrade':'Build'} · ${fmtMoney(c.money)}</button>${lv?`<button class="btn" onclick="downsize('${id}')" title="Downsize">−</button>`:''}</div>
   <div class="fine">Uses ${c.steel} steel · ${c.lumber} lumber</div>`;
  h+='</div>';});
 return h+'</div>';
}
function vWars(){
 const w=G.war;let h='';
 const tiles=reelState?reelState.tiles:Array.from({length:24},(_,i)=>OUT_ORDER[i%4]);
 const tf=reelState?`style="transform:translateX(${reelState.x}px)"`:'';
 let e;
 if(w){e=G.nations[w.enemy];
  const sw=Math.abs(w.score)/2,left=w.score>=0?50:50-sw;
  h+=`<div class="card" style="margin-top:0"><div class="card-t">At war with ${e.name} <span class="tag war">Month ${G.turn-w.start+1}</span></div>
   <div class="vs"><div class="side">${av(P,"")}<div class="big">${Math.round(P.army)}</div><div class="xs muted">Your army</div></div><div class="x">VS</div><div class="side">${av(e,"")}<div class="big">${Math.round(e.army)}</div><div class="xs muted">${e.name}</div></div></div>
   <div class="score"><div style="left:${left}%;width:${sw}%;background:${w.score>=0?'#16a34a':'#dc2626'}"></div></div>
   <div class="kv"><span>War score</span><span><b>${w.score>0?'+':''}${Math.round(w.score)}</b> / ±100</span></div>
   <div class="fine">Reach +100 and they surrender. Hit −100 and you lose. War weariness lowers happiness each month.</div></div>`;
 }else{
  const rivals=G.nations.filter(n=>n.id!==P.id).sort((a,b)=>(b.isPlayer?1:0)-(a.isPlayer?1:0)||a.rel-b.rel);
  if(UI.warTarget==null||!G.nations[UI.warTarget]||UI.warTarget===P.id)UI.warTarget=rivals[0].id;
  e=G.nations[UI.warTarget];
  h+=`<div class="card-t" style="margin:0 0 6px">Pick a rival <span class="xs muted">sorted by hostility</span></div>
   <div class="chips" data-keep="rivals">${rivals.map(n=>`<button class="chip ${n.id===e.id?'on':''}" onclick="selectRival(${n.id})">${av(n,"")}<span>${n.name}</span></button>`).join('')}</div>
   <div class="card"><div class="vs"><div class="side">${av(P,"")}<div class="big">${Math.round(P.army)}</div><div class="xs muted">Your army</div></div><div class="x">VS</div><div class="side">${av(e,"")}<div class="big">${Math.round(e.army)}</div><div class="xs muted">${e.name} · ${relWord(e.rel)}</div></div></div></div>`;
 }
 const odds=battleOdds(e);
 h+=`<div class="reel-wrap"><svg class="marker" width="24" height="20" viewBox="0 0 24 20"><path d="M4 1h16a3 3 0 0 1 2.4 4.8l-8 10.7a3 3 0 0 1-4.8 0l-8-10.7A3 3 0 0 1 4 1z" fill="#d4d4d4"/></svg><div class="reel" id="reel"><div class="strip" id="strip" ${tf}>${tiles.map(tileHtml).join('')}</div></div></div>`;
 h+=`<div class="odds">${OUT_ORDER.map(k=>`<div><i style="background:${OUTCOMES[k].color}"></i><b>${Math.round(odds[k]*100)}%</b>${OUTCOMES[k].label}</div>`).join('')}</div>`;
 if(w){const ready=w.lastBattle!==G.turn;
  h+=`<button class="btn dark full spin-lock" onclick="spin()" ${ready?'':'disabled'}>${ready?`Fight a battle · ${fmtMoney(battleCost())}`:'Troops regrouping — next battle next month'}</button>
   <button class="btn full spin-lock" onclick="peaceSheet()">Seek peace</button>`;
 }else h+=`<button class="btn dark full" onclick="confirmWar(${e.id})">Declare war on ${e.name}</button>`;
 h+=`<div class="card"><div class="card-t">Your army <span class="xs muted">${fmtMoney(P.army*ARMY_UPKEEP*(P.gov.pol.draft?0.7:1))}/mo upkeep</span></div>
  <div class="kv"><span>Strength</span><span><b>${Math.round(P.army)}</b> units</span></div>
  <div class="row-btns"><button class="btn dark grow spin-lock" onclick="recruit(5)">Recruit +5 · ${fmtMoney(5*RECRUIT_COST*(P.gov.pol.draft?0.5:1))}</button><button class="btn spin-lock" onclick="recruit(20)">+20</button><button class="btn spin-lock" onclick="disband(5)">−5</button></div>
  <div class="fine">Each unit costs ${fmtMoney(RECRUIT_COST)} + 1 steel, and ${fmtMoney(ARMY_UPKEEP)}/month. Bigger armies shift the odds on the reel.</div></div>`;
 return h;
}
function searchList(){
 const q=(UI.q||'').toLowerCase().trim();
 return ranking().map((n,i)=>({n,i})).filter(({n})=>!q||n.name.toLowerCase().includes(q)).map(({n,i})=>n.id===P.id?
  `<button class="crow me" onclick="selfSheet()"><span class="rk">${i+1}</span>${av(n,"")}<span class="cr-main"><span class="cr-n">${n.name} (you)</span><span class="cr-s">GDP ${fmtMoney(n.gdp)} · Pop ${fmtPop(n.pop)}</span></span></button>`:
  countryRow(n,`<span class="rk">${i+1}</span>`)).join('')||'<div class="fine">No country matches.</div>';
}
function vSearch(){
 return`<div class="narrow"><div class="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg><input placeholder="Search countries" value="${(UI.q||'').replace(/"/g,'&quot;')}" oninput="UI.q=this.value;$('slist').innerHTML=searchList()"></div>
  <div class="sec">World rankings <span class="xs muted">by GDP</span></div><div id="slist">${searchList()}</div></div>`;
}
function vTrade(){
 let h='';
 if(G.offer){const o=G.offer,a=G.nations[o.partner];
  h+=`<div class="card" style="margin-top:0;border-color:#f3d48a;background:#fffbeb"><div class="card-t">Offer from ${a.name}</div>
   <div class="kv"><span>You give</span><span>${itemStr(o.pGive)}/mo</span></div><div class="kv"><span>You get</span><span>${itemStr(o.pGet)}/mo</span></div>
   <div class="kv"><span>For</span><span>${o.months} months · ${fmtMoney(mval(o.pGive))} → ${fmtMoney(mval(o.pGet))}</span></div>
   <div class="row-btns"><button class="btn dark grow" onclick="acceptOffer()">Accept</button><button class="btn grow" onclick="declineOffer()">Decline</button></div></div>`;}
 h+=requestsHtml();
 h+=`<div class="sec" style="margin-top:${G.offer||G.requests.length?22:4}px">World market <span class="xs muted">fee ${(fee()*100).toFixed(1)}% · tap a good to trade</span></div><div class="cards">`;
 RES.forEach(r=>{const id=r.id,p=M.price[id],ch=(p/M.close[id]-1)*100,net=netOf(P,id),open=UI.openRes===id,q=UI.qty[id]||10;
  h+=`<div class="card mrow"><div class="mr-top" onclick="openRes('${id}')"><span class="av sq">${ico(r.id)}</span><span class="cr-main"><span class="cr-n">${r.name}</span><span class="cr-s">Stock ${fmtN(P.stock[id])} · <span class="${net>=0.5?'pos':net<=-0.5?'neg':''}">${fmtSigned(net)}/mo</span></span></span>
   <canvas class="spark" data-r="${id}"></canvas><span class="mr-price"><b>$${p.toFixed(p<100?1:0)}</b><span class="${ch>=0?'pos':'neg'}">${ch>=0?'▲':'▼'} ${Math.abs(ch).toFixed(1)}%</span></span></div>`;
  if(open)h+=`<div class="mr-act"><div class="stepper"><button onclick="stepQty('${id}',-1)">−</button><span>${q}</span><button onclick="stepQty('${id}',1)">+</button></div>
   <button class="btn buy" onclick="manualBuy('${id}')">Buy ${fmtMoney(quote(id,q,'buy'))}</button><button class="btn sell" onclick="manualSell('${id}')">Sell ${fmtMoney(quote(id,q,'sell'))}</button></div>
   <div class="toggles"><button class="tog ${G.autoSell[id]?'on':''}" onclick="toggleAutoSell('${id}')"><i></i>Auto-sell surplus</button><button class="tog ${G.autoBuy[id]?'on':''}" onclick="toggleAutoBuy('${id}')"><i></i>Auto-buy shortfall</button></div>
   <div class="fine">Big orders move the price. <a href="#" onclick="manualSell('${id}',true);return false" style="color:inherit">Sell all ${fmtN(P.stock[id])}</a></div>`;
  h+='</div>';});
 h+='</div>';
 const inc=incomingDeals(),total=G.deals.length+inc.length;
 h+=`<div class="sec">Active deals <span class="xs muted">${total}</span></div>`;
 h+=total?`<div class="card" style="margin-top:8px">${G.deals.map((d,i)=>{const a=G.nations[d.partner],apl=playerOf(a);return`<div class="crow">${av(a,"")}<span class="cr-main"><span class="cr-n">${a.name}${apl?' ('+esc(apl.name)+')':''} · ${d.left}mo left${d.misses?' · missed delivery':''}</span><span class="cr-s">Give ${itemStr(d.pGive)} · Get ${itemStr(d.pGet)}</span></span><button class="btn sm red" onclick="cancelDeal(${i})">End</button></div>`;}).join('')}${inc.map(x=>{const a=G.nations[x.pl.nation];return`<div class="crow">${av(a,"")}<span class="cr-main"><span class="cr-n">${a.name} (${esc(x.pl.name)}) · ${x.d.left}mo left</span><span class="cr-s">Give ${itemStr(x.d.pGet)} · Get ${itemStr(x.d.pGive)}</span></span><button class="btn sm red" onclick="cancelIncoming('${x.pl.id}',${x.i})">End</button></div>`;}).join('')}</div>`
  :`<div class="fine">No deals yet. Open a country (Home → Map, or Search) and propose one.</div>`;
 return h;
}
function vWallet(){
 const L=G.lastLedger,prev=G.hist[G.hist.length-2];
 const prog=clamp((P.gdp-G.startGdp)/(G.target-G.startGdp),0,1),left=Math.max(0,END_TURN-G.turn);
 let h=`<div class="stat" style="width:100%;margin-top:0"><div class="st-t">Treasury</div><div class="st-v" style="font-size:34px">${fmtMoney(P.money)}</div><div class="st-s">${momLine(P.money,prev&&prev.money)} · ${dateStr()}</div></div><div class="masonry">`;
 h+=`<div class="card"><div class="card-t">Goal <span class="xs muted">${left>0?Math.floor(left/12)+'y '+left%12+'m left':'Sandbox'}</span></div>
  <div class="kv"><span>Grow GDP ${G.goalMult}× by Dec ${START_YEAR+9}</span><span>${G.won?'Done':Math.round(prog*100)+'%'}</span></div>
  <div class="bar" style="margin:8px 0"><div style="width:${prog*100}%"></div></div>
  <div class="kv"><span>${fmtMoney(P.gdp)} now</span><span>Target ${fmtMoney(G.target)}</span></div></div>`;
 const rows=[['Taxes',L.taxes],['Domestic sales',L.domestic],['Market sales',L.sales],['Deal income',L.dealsIn],['Market purchases',L.purchases],['Deal payments',L.dealsOut],['Tariffs',L.tariffs],['Tourism',L.tourism],['Foreign dividends',L.dividends],['Government budget',L.budget],['Industry upkeep',L.upkeep],['Military',L.military],['War',L.war],['Construction',L.construction],['Aid & other',L.other],['Interest',L.interest]];
 const net=rows.reduce((s,r)=>s+(r[1]||0),0);
 h+=`<div class="card"><div class="card-t">Last month</div>${G.turn===0?'<div class="fine">Advance a month to see your ledger.</div>':rows.filter(r=>Math.abs(r[1]||0)>=0.5).map(r=>`<div class="kv"><span>${r[0]}</span><span class="${r[1]>=0?'pos':'neg'}">${sign(r[1])}</span></div>`).join('')+`<div class="kv total"><span>Net</span><span class="${net>=0?'pos':'neg'}">${sign(net)}</span></div>`}</div>`;
 h+=`<div class="card"><div class="card-t">Citizens <span class="xs muted">Happiness ${Math.round(P.happy)}%</span></div>`;
 for(const k in NEED){const r=P.lastNeedRatio[k]??1;h+=`<div class="need"><span>${R[k].name}</span><div class="bar"><div class="${r<0.5?'b':r<0.9?'w':'g'}" style="width:${r*100}%"></div></div><span>${Math.round(r*100)}%</span></div>`;}
 h+=`<div class="fine">Unmet needs lower happiness. Under 12% for 3 months = revolution.</div></div>`;
 h+=`<div class="card"><div class="card-t">GDP history <span class="xs muted">dashed = goal</span></div><canvas id="gdpChart" class="chart"></canvas></div>`;
 if(G.mods.length)h+=`<div class="card"><div class="card-t">World effects</div>${G.mods.map(m=>`<div class="kv"><span style="color:var(--text)">${m.label}</span><span>${m.months}mo</span></div>`).join('')}</div>`;
 h+=`<div class="card"><div class="card-t">News</div>${G.news.slice(0,25).map(n=>`<div class="news"><span class="t">${n.t}</span>${n.text}</div>`).join('')}</div></div>`;
 return h;
}


/* ================= NATION ================= */
function decisionHtml(){
 const dd=DILEMMAS.find(x=>x.id===P.gov.decision.id);
 return`<div class="card-t">${dd.title}<span class="tag offer">Decision</span></div><div class="fine" style="font-size:13.5px;color:#333;margin:0 0 4px">${dd.text}</div>`+
  dd.opts.map((o,i)=>{const c=o.cost?o.cost(P):0;return`<button class="opt" onclick="chooseDecision(${i})"><b>${o.l}${c?` · ${fmtMoney(c)}`:''}${o.pc?` · ${o.pc} political capital`:''}${o.gain?` · +${fmtMoney(o.gain(P))}`:''}</b><span>${o.d}</span></button>`;}).join('')+
  `<div class="fine">If you don't decide within 2 months, the last option is chosen for you.</div>`;
}
function decisionSheet(){if(P.gov.decision)openSheet(decisionHtml());}
function statRow(label,v,t,good,note){
 const d=t-v,arrow=Math.abs(d)<1.5?'steady':(d>0?'rising':'falling');
 const okColor=good?(v>=60?'g':v>=35?'w':'b'):(v<=25?'g':v<=50?'w':'b');
 const trendGood=good?d>0:d<0;
 return`<div class="srow"><div class="kv"><span style="color:var(--text)">${label}</span><span><b>${Math.round(v)}</b> <span class="xs ${arrow==='steady'?'muted':trendGood?'pos':'neg'}">${arrow==='steady'?'steady':(arrow==='rising'?'▲ ':'▼ ')+arrow}</span></span></div><div class="bar"><div class="${okColor}" style="width:${v}%"></div></div>${note?`<div class="fine" style="margin-top:4px">${note}</div>`:''}</div>`;
}
function seg(opts,cur,fn,dis){return`<div class="seg">${opts.map((o,i)=>`<button class="${i===cur?'on':''}" onclick="${fn}(${i})" ${dis&&i!==cur?'disabled':''}>${o}</button>`).join('')}</div>`;}
function monthsUntil(t){const m=t-G.turn;return m<=0?'this month':m<12?`${m} month${m>1?'s':''}`:`${Math.floor(m/12)}y ${m%12}m`;}
function vNation(){
 const g=P.gov,t=govTargets(P),dem=g.pol.gov===0;let h='';
 if(g.decision)h+=`<div class="card" style="border-color:#f3d48a;background:#fffbeb">${decisionHtml()}</div>`;
 h+='<div class="masonry">';
 // government
 const v=voteShare(P),toEl=g.nextElection-G.turn;
 h+=`<div class="card"><div class="card-t">Government <span class="tag">${POLICIES[0].opts[g.pol.gov]}</span></div>
  <div class="kv"><span>Political capital</span><span><b>${Math.floor(g.pc)}</b>/100 · ${pcGain(P)>=0?'+':''}${pcGain(P).toFixed(1)}/mo</span></div>
  <div class="bar"><div style="width:${g.pc}%"></div></div>
  <div class="fine">Spent to change laws. Earned each month, faster when stable.</div>`;
 if(dem){h+=`<div class="kv" style="margin-top:10px"><span>Next election</span><span>${monthsUntil(g.nextElection)}</span></div>
  <div class="kv"><span>Projected vote</span><span class="${v>=50?'pos':'neg'}"><b>${v.toFixed(1)}%</b> ${v>=55?'(safe)':v>=50?'(close)':'(losing)'}</span></div>
  ${toEl<=12?`<button class="btn full" onclick="campaign()" ${g.campaign>=12?'disabled':''}>Hold campaign rallies · ${fmtMoney(P.pf*150)} (+3%)${g.campaign?` · now +${g.campaign}%`:''}</button>`:''}
  <div class="fine">Below 50% on election day and you are voted out. Happiness, stability and interest groups drive the vote.</div>`;}
 else h+=`<div class="kv" style="margin-top:10px"><span>Coup risk</span><span class="${g.fac.military<25?'neg':'pos'}"><b>${g.fac.military<25?'High':'Low'}</b></span></div><div class="fine">No elections, but if the military's approval drops under 25 they may try to overthrow you.</div>`;
 h+='</div>';
 // stats
 h+=`<div class="card"><div class="card-t">State of the nation</div>
  ${statRow('Stability',g.stab,t.stab,true,'Under 12% for 3 months means revolution.')}
  ${statRow('Education',g.edu,t.edu,true)}${statRow('Health',g.health,t.health,true)}${statRow('Infrastructure',g.infra,t.infra,true)}${statRow('Corruption',g.corr,t.corr,false)}
  <div class="kv" style="margin-top:8px"><span>Industry output</span><span>×${outMult(P).toFixed(2)}</span></div>
  <div class="kv"><span>Tax efficiency</span><span>${Math.round(taxGovMult(P)*100)}%</span></div>
  <div class="kv"><span>Industry upkeep</span><span>×${upkeepMult(P).toFixed(2)}</span></div></div>`;
 // budget
 const bc=budgetCost(P);
 h+=`<div class="card"><div class="card-t">Budget <span class="xs muted">${fmtMoney(bc)}/mo</span></div>
  <div class="kv"><span style="color:var(--text)">Tax rate</span><span><b id="taxv">${Math.round(P.tax*100)}%</b></span></div>
  <input type="range" min="5" max="40" value="${Math.round(P.tax*100)}" oninput="setTax(this.value)">
  <div class="kv"><span>Tax income</span><span id="taxinc">${fmtMoney(taxIncome(P))}/mo</span></div>
  <div class="fine" style="margin-bottom:6px">Higher taxes lower happiness and annoy business.</div>`;
 MINISTRIES.forEach(m=>{const l=g.budget[m.id];h+=`<div class="mrow2"><div class="kv"><span style="color:var(--text);font-weight:500">${m.name}</span><span class="xs">${fmtMoney(ministryCost(P,l))}/mo</span></div>${seg(LEVELS,l,`(i=>setBudget('${m.id}',i))`)}<div class="fine" style="margin-top:4px">${m.desc}</div></div>`;});
 h+=`</div>`;
 // factions
 const ft=facTargets(P),FN={workers:['Workers','Welfare, short work week, happy people'],business:['Business','Low taxes, free market, good infrastructure'],military:['Military','A strong army, security, victories']};
 h+=`<div class="card"><div class="card-t">Interest groups</div>`;
 for(const k in FN)h+=statRow(FN[k][0],g.fac[k],ft[k],true,'Wants: '+FN[k][1]);
 h+=`<div class="fine">Unhappy groups cause trouble: strikes, capital flight or coups.</div></div>`;
 // policies
 h+=`<div class="card"><div class="card-t">Laws <span class="xs muted">${Math.floor(g.pc)} political capital</span></div>`;
 POLICIES.forEach(p=>{const cur=g.pol[p.id];h+=`<div class="mrow2"><div class="kv"><span style="color:var(--text);font-weight:500">${p.name}</span><span class="xs">${p.cost} to change</span></div>${seg(p.opts,cur,`(i=>setPolicy('${p.id}',i))`,g.pc<p.cost)}<div class="fine" style="margin-top:4px">${p.desc[cur]}</div></div>`;});
 h+='</div>';
 // research
 const cur=g.research?TECHS.find(x=>x.id===g.research):null;
 h+=`<div class="card"><div class="card-t">Research <span class="xs muted">${rpGain(P).toFixed(1)} points/mo</span></div>`;
 if(cur)h+=`<div class="kv"><span style="color:var(--text)">${cur.name}</span><span>${Math.floor(Math.min(g.rp,researchCost(P,cur)))}/${researchCost(P,cur)}</span></div><div class="bar"><div style="width:${Math.min(100,g.rp/researchCost(P,cur)*100)}%"></div></div><div class="fine">${cur.desc} · about ${Math.max(1,Math.ceil((researchCost(P,cur)-g.rp)/Math.max(0.1,rpGain(P))))} months left</div>`;
 else h+=`<div class="fine" style="margin-top:0">Pick a technology. Points bank up meanwhile (${Math.floor(g.rp)} saved).</div>`;
 const avail=TECHS.filter(x=>!g.techs.includes(x.id)&&x.id!==g.research&&(x.req||[]).every(r=>g.techs.includes(r)));
 h+=avail.map(x=>`<button class="opt" onclick="startResearch('${x.id}')"><b>${x.name} · ${researchCost(P,x)} pts${researchCost(P,x)<x.cost?` (was ${x.cost})`:''}</b><span>${x.desc}</span></button>`).join('');
 const locked=TECHS.filter(x=>!g.techs.includes(x.id)&&x.id!==g.research&&!(x.req||[]).every(r=>g.techs.includes(r)));
 if(locked.length)h+=`<div class="fine">Locked: ${locked.map(x=>`${x.name} (needs ${x.req.map(r=>TECHS.find(y=>y.id===r).name).join(' + ')})`).join(', ')}</div>`;
 if(g.techs.length)h+=`<div class="fine">Researched: ${g.techs.map(id=>TECHS.find(x=>x.id===id).name).join(', ')}</div>`;
 h+='</div></div>';
 return h;
}

function selfSheet(){
 openSheet(`<div class="sh-head">${av(P,"lg")}<div><h2>${P.name}</h2><div class="xs muted">#${rankOf(P)} in the world · GDP ${fmtMoney(P.gdp)}</div></div></div>
  <div class="card" style="margin-top:4px"><div class="crow" style="padding:0"><span class="av sq code">${P.trait.name[0]}</span><span class="cr-main"><span class="cr-n">${P.trait.name}</span><span class="cr-s" style="white-space:normal">${P.trait.desc}</span></span></div></div>
  <div class="kv" style="margin-top:10px"><span>Population</span><span>${fmtPop(P.pop)}</span></div>
  <div class="kv"><span>Happiness</span><span>${Math.round(P.happy)}%</span></div>
  <div class="kv"><span>Army</span><span>${Math.round(P.army)} units</span></div>
  <div class="card-t" style="margin:14px 0 8px">Stockpile</div>
  <div class="grid4">${RES.map(r=>{const n=netOf(P,r.id);return`<div>${r.name}<b>${fmtN(P.stock[r.id])} <span class="${n>=0.5?'pos':n<=-0.5?'neg':'muted'}" style="font-weight:500;font-size:11px">${fmtSigned(n)}</span></b></div>`;}).join('')}</div>
  <button class="btn full" onclick="closeSheet()">Close</button>`);
}
/* ================= CHARTS ================= */
function drawSparks(){
 document.querySelectorAll('canvas.spark').forEach(cv=>{
  const id=cv.dataset.r,h=M.hist[id],ctx=cv.getContext('2d'),dpr=devicePixelRatio||1,W=56,H=26;
  cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const mn=Math.min(...h,R[id].base)*0.95,mx=Math.max(...h,R[id].base)*1.05,y=v=>H-2-(v-mn)/(mx-mn)*(H-4);
  ctx.strokeStyle='#e2e2e2';ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(0,y(R[id].base));ctx.lineTo(W,y(R[id].base));ctx.stroke();ctx.setLineDash([]);
  if(h.length<2)return;
  ctx.strokeStyle=h[h.length-1]>=h[0]?'#16a34a':'#dc2626';ctx.lineWidth=1.5;ctx.beginPath();
  h.forEach((v,i)=>{const x=i/(h.length-1)*W;i?ctx.lineTo(x,y(v)):ctx.moveTo(x,y(v));});ctx.stroke();
 });
}
function drawGdpChart(){
 const cv=$('gdpChart');if(!cv)return;
 const ctx=cv.getContext('2d'),dpr=devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
 cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const h=G.hist.map(x=>x.gdp),mx=Math.max(...h,G.target)*1.08,pl=46,pb=14,y=v=>(H-pb)-v/mx*(H-pb-6);
 ctx.font='10.5px system-ui';
 for(let i=0;i<=3;i++){const v=mx*i/3;ctx.fillStyle='#9a9a9a';ctx.fillText(fmtMoney(v),0,y(v)+3);ctx.strokeStyle='#f0f0f0';ctx.beginPath();ctx.moveTo(pl,y(v));ctx.lineTo(W,y(v));ctx.stroke();}
 ctx.strokeStyle='#d97706';ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(pl,y(G.target));ctx.lineTo(W,y(G.target));ctx.stroke();ctx.setLineDash([]);
 const n=Math.max(h.length,13),x=i=>pl+i/(n-1)*(W-pl-4);
 if(h.length>1){
  ctx.beginPath();h.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.lineTo(x(h.length-1),y(0));ctx.lineTo(x(0),y(0));ctx.fillStyle='rgba(26,26,26,.06)';ctx.fill();
  ctx.beginPath();h.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.strokeStyle='#1a1a1a';ctx.lineWidth=2;ctx.stroke();
 }
}


/* ================= NETWORK ================= */
let ws=null,ME=null,ROOM=null,SESSION=null,rid=1,pendingState=null,seenFlash=0,lastTurn=-1,reconnectT=0;
const calls={};
const UI={nav:'home',pill:'map',qty:{},openRes:null,q:'',warTarget:null};
IDS.forEach(id=>UI.qty[id]=10);
try{SESSION=JSON.parse(localStorage.getItem('tg_session')||'null');}catch(e){}
function saveSession(){try{localStorage.setItem('tg_session',JSON.stringify(SESSION));}catch(e){}}
function wsSend(m){if(ws&&ws.readyState===1)ws.send(JSON.stringify(m));else toast('Reconnecting…');}
function connect(){
 ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
 ws.onopen=()=>{setConn(true);if(SESSION&&SESSION.token)wsSend({t:'rejoin',code:SESSION.code,token:SESSION.token});};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}onMsg(m);};
 ws.onclose=()=>{setConn(false);clearTimeout(reconnectT);reconnectT=setTimeout(connect,1500);};
}
function setConn(ok){$('conn').classList.toggle('hidden',ok);}
function onMsg(m){
 if(m.t==='joined'){ME=m.you;SESSION={code:m.code,token:m.token,name:(SESSION&&SESSION.name)||''};saveSession();
  try{seenFlash=Number(localStorage.getItem('tg_flash_'+m.code+'_'+ME)||0);}catch(e){}
  history.replaceState(null,'','?room='+m.code);}
 else if(m.t==='lobby'){ROOM=m.room;G=null;showLobby();}
 else if(m.t==='state'){ROOM=m.room;if(spinning){pendingState=m.g;return;}applyState(m.g);}
 else if(m.t==='res'){const cb=calls[m.rid];if(cb){delete calls[m.rid];cb(m);}}
 else if(m.t==='error'){toast(m.msg);if(m.expired){SESSION=null;saveSession();history.replaceState(null,'','/');showEntry();}}
}
function applyState(g){
 const first=!G;useGame(g);const me=G.players.find(p=>p.id===ME);
 if(!me){toast('You are not part of this game');return;}
 setCtx(me);
 if(G.turn!==lastTurn){reelState=null;lastTurn=G.turn;}
 if(first)enterGame();
 render();checkFlash();
}
function call(a){return new Promise(res=>{const id=rid++;calls[id]=res;wsSend({t:'act',rid:id,a});setTimeout(()=>{if(calls[id]){delete calls[id];res({ok:false,msg:'No answer from server'});}},8000);});}
async function doAct(a,quiet){const r=await call(a);if(r.msg&&(!quiet||!r.ok))toast(r.msg);return r;}

/* ================= LOBBY ================= */
function showEntry(){
 $('start').classList.remove('hidden');$('entry').classList.remove('hidden');$('lobby').classList.add('hidden');
 const q=new URLSearchParams(location.search).get('room');if(q)$('codeIn').value=q.toUpperCase();
 $('nameIn').value=(SESSION&&SESSION.name)||localStorage.getItem('tg_name')||'';
}
function myName(){const n=$('nameIn').value.trim().slice(0,18);try{localStorage.setItem('tg_name',n);}catch(e){}SESSION={...(SESSION||{}),name:n};return n;}
function createGame(){wsSend({t:'create',name:myName()});}
function joinGame(){const c=$('codeIn').value.trim().toUpperCase();if(c.length!==4)return toast('Enter the 4-letter game code');wsSend({t:'join',code:c,name:myName()});}
function leaveGame(){wsSend({t:'leave'});SESSION=null;saveSession();G=null;ROOM=null;closeSheet();history.replaceState(null,'','/');showEntry();}
function showLobby(){
 $('start').classList.remove('hidden');$('entry').classList.add('hidden');$('lobby').classList.remove('hidden');
 const isHost=ROOM.hostId===ME,me=ROOM.players.find(p=>p.id===ME);
 const link=location.origin+'/?room='+ROOM.code;
 let h=`<div class="card" style="text-align:center"><div class="xs muted">Game code</div><div class="code-big">${ROOM.code}</div>
  <div class="row-btns" style="justify-content:center"><button class="btn sm" onclick="copyText('${link}')">Copy invite link</button><button class="btn sm" onclick="copyText('${ROOM.code}')">Copy code</button></div>
  <div class="fine">Friends open the game and join with this code. ${ROOM.players.length}/8 players.</div></div>`;
 ROOM.players.forEach(p=>{const k=p.pick;if(!k)return;const meP=p.id===ME;
  h+=`<div class="card"><div class="sh-head" style="margin:0">${av(k,'lg')}<div style="flex:1"><div class="xs muted">${meP?'You':p.name}${p.id===ROOM.hostId?' · host':''}</div><h2 style="font-size:19px;margin:2px 0">${k.name}</h2><div class="xs muted">Population ${fmtPop(k.pop)} · Treasury ${fmtMoney(k.money)}</div></div></div>
   <div class="kv" style="margin-top:8px"><span>Trait</span><span>${k.trait.name}</span></div><div class="fine" style="margin-top:0">${k.trait.desc}</div>
   ${meP?`<div class="grid4" style="margin-top:10px"><div>Education<b>${k.gov.edu}</b></div><div>Health<b>${k.gov.health}</b></div><div>Infrastructure<b>${k.gov.infra}</b></div><div>Corruption<b>${k.gov.corr}</b></div></div>
   <div class="grid4" style="margin-top:8px">${RES.map(r=>`<div>${r.name}<b>${DEPOSIT.includes(r.id)&&!k.dep[r.id]?'<span class="muted">none</span>':'Lv '+k.ind[r.id]}</b></div>`).join('')}</div>
   <button class="btn full" onclick="wsSend({t:'reroll'})">Reroll my country</button>`:''}</div>`;});
 h+=`<div class="card"><div class="card-t">Turn timer <span class="xs muted">${isHost?'you decide':'host decides'}</span></div>${seg(['Off','30s','60s','2m','5m'],[0,30,60,120,300].indexOf(ROOM.timer),`(i=>wsSend({t:'timer',s:[0,30,60,120,300][i]}))`,!isHost)}
  <div class="fine">A month advances when everyone presses Ready${ROOM.timer?`, or after ${ROOM.timer<60?ROOM.timer+' seconds':ROOM.timer/60+' minute'+(ROOM.timer>60?'s':'')}`:''}.</div></div>`;
 h+=isHost?`<button class="btn dark full" onclick="wsSend({t:'start'})">Start game${ROOM.players.length===1?' (solo)':` with ${ROOM.players.length} players`}</button>`:`<div class="fine" style="text-align:center;margin-top:14px">Waiting for the host to start…</div>`;
 h+=`<button class="btn full" onclick="leaveGame()">Leave</button>`;
 $('lobby').innerHTML=h;
}
function copyText(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Copied')).catch(()=>{prompt('Copy this:',t);});}
function enterGame(){
 UI.nav='home';UI.pill='map';
 mapView.cLon=P.lon;mapView.cLat=clamp(P.lat,-20,50);mapView.zoom=1.4;
 $('start').classList.add('hidden');
}

/* ================= TURN BUTTON ================= */
function meRoom(){return ROOM&&ROOM.players.find(p=>p.id===ME);}
function updateFab(){
 const fab=$('fab');if(!G||!CUR)return;
 if(CUR.over){fab.classList.add('hidden');return;}fab.classList.remove('hidden');
 const mr=meRoom(),others=ROOM.players.filter(p=>p.id!==ME&&p.connected&&!(G.players.find(x=>x.id===p.id)||{}).over);
 const readyN=ROOM.players.filter(p=>p.ready&&p.connected).length,need=others.length+1;
 const left=ROOM.deadline?Math.max(0,Math.ceil((ROOM.deadline-Date.now())/1000)):0;
 const t=left?` · ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`:'';
 $('fabDate').textContent=dateStr();
 $('fabLbl').textContent=mr&&mr.ready?`Waiting ${readyN}/${need}${t}`:(others.length?`Ready${t}`:'Next month →');
 fab.classList.toggle('waiting',!!(mr&&mr.ready));
}
function nextMonth(){if(!G||spinning||CUR.over)return;const mr=meRoom();wsSend({t:'ready',v:!(mr&&mr.ready)});}
setInterval(()=>{if(G&&ROOM&&ROOM.deadline)updateFab();},1000);

/* ================= ACTIONS (sent to the server) ================= */
let spinning=false,reelState=null;
function setNav(n){UI.nav=n;$('screen').scrollTop=0;render();}
function setPill(p){UI.pill=p;$('screen').scrollTop=0;render();}
function stepQty(id,d){const steps=[1,5,10,25,50,100,250,500];const q=UI.qty[id]||10;let i=steps.indexOf(q);if(i<0)i=2;i=clamp(i+d,0,steps.length-1);UI.qty[id]=steps[i];render();}
function openRes(id){UI.openRes=UI.openRes===id?null:id;render();}
function manualBuy(id){doAct({t:'buy',id,q:UI.qty[id]||10});}
function manualSell(id,all){doAct({t:'sell',id,q:UI.qty[id]||10,all:!!all});}
function toggleAutoSell(id){doAct({t:'autoSell',id,v:!G.autoSell[id]},true);}
function toggleAutoBuy(id){doAct({t:'autoBuy',id,v:!G.autoBuy[id]},true);}
let taxT=0;
function setTax(v){$('taxv').textContent=v+'%';const old=P.tax;P.tax=v/100;$('taxinc').textContent=fmtMoney(taxIncome(P))+'/mo';P.tax=old;clearTimeout(taxT);taxT=setTimeout(()=>doAct({t:'tax',v:Number(v)},true),250);}
function upgrade(id){doAct({t:'upgrade',id});}
function downsize(id){doAct({t:'downsize',id});}
function survey(id){doAct({t:'survey',id});}
async function sendAid(aid){await doAct({t:'aid',n:aid});setTimeout(()=>{if(sheetOpen())countrySheet(aid);},150);}
async function toggleEmbargo(aid){await doAct({t:'embargo',n:aid});setTimeout(()=>{if(sheetOpen())countrySheet(aid);},150);}
function cancelDeal(i){doAct({t:'cancelDeal',i});}
function cancelIncoming(from,i){doAct({t:'cancelIncoming',from,i});}
function acceptOffer(){doAct({t:'acceptOffer'});}
function declineOffer(){doAct({t:'declineOffer'},true);}
function reqAccept(id){doAct({t:'reqAccept',rid:id});}
function reqDecline(id){doAct({t:'reqDecline',rid:id});}
function recruit(n){doAct({t:'recruit',n});}
function disband(n){doAct({t:'disband',n});}
async function declareWar(id){const r=await doAct({t:'declare',n:id});if(r.ok){reelState=null;UI.nav='home';UI.pill='wars';closeSheet();}}
function confirmWar(id){
 const e=G.nations[id],epl=playerOf(e);
 openSheet(`<div class="sh-head">${av(e,"lg")}<div><h2>Declare war on ${e.name}?</h2><div class="xs muted">Your army ${Math.round(P.army)} vs their ${Math.round(e.army)}${epl?` · led by ${epl.name}`:''}</div></div></div>
  <div class="fine" style="font-size:13px">All deals with them end, every computer-run nation's opinion of you drops by 6, and war weariness lowers happiness until peace. Win battles to push the war score to +100 and they surrender: reparations plus one of their industry regions.${epl?` ${epl.name} can fight back with their own battles.`:''}</div>
  <button class="btn dark full" style="background:#b91c1c;border-color:#b91c1c" onclick="declareWar(${id})">Declare war</button><button class="btn full" onclick="closeSheet()">Cancel</button>`);
}
function peaceSheet(){const e=G.nations[G.war.enemy],pt=peaceTerms();
 openSheet(`<h2>Seek peace with ${e.name}</h2><div class="fine" style="font-size:13.5px;color:#333">${pt.t}</div><button class="btn dark full" onclick="makePeace()">${pt.k==='human'?'Send peace proposal':'Sign peace'}</button><button class="btn full" onclick="closeSheet()">Keep fighting</button>`);}
async function makePeace(){const r=await doAct({t:'peace'});if(r.ok){reelState=null;closeSheet();}}
function selectRival(id){UI.warTarget=id;render();}
function setBudget(id,l){doAct({t:'budget',id,l},true);}
function setPolicy(id,i){doAct({t:'policy',id,i});}
function startResearch(id){doAct({t:'research',id});}
function campaign(){doAct({t:'campaign'});}
async function chooseDecision(i){const r=await doAct({t:'decision',i},true);if(r.ok)closeSheet();}

/* reel */
let TW=90;
function tileHtml(k){const o=OUTCOMES[k];return`<div class="tile" style="background:${o.color}"><small>${o.label}</small></div>`;}
async function spin(){
 const w=G.war;if(!w||spinning)return;
 if(w.lastBattle===G.turn)return toast('Troops need a month to regroup');
 if(P.money<battleCost())return toast('Not enough money to fund a battle');
 const e=G.nations[w.enemy],odds=battleOdds(e);
 spinning=true;document.querySelectorAll('.spin-lock').forEach(b=>b.disabled=true);$('fab').disabled=true;
 const r=await call({t:'battle'});
 if(!r.ok){spinning=false;$('fab').disabled=false;toast(r.msg);if(pendingState){const s=pendingState;pendingState=null;applyState(s);}else render();return;}
 const res=r.outcome;
 TW=$('strip').firstElementChild?$('strip').firstElementChild.getBoundingClientRect().width:90;
 const N=58,T=50,tiles=[];for(let i=0;i<N;i++)tiles.push(i===T?res:rollOutcome(odds));
 const reel=$('reel'),strip=$('strip');
 strip.style.transition='none';strip.innerHTML=tiles.map(tileHtml).join('');strip.style.transform='translateX(0)';void strip.offsetWidth;
 const x=-(T*TW+TW/2-reel.clientWidth/2+(Math.random()-0.5)*TW*0.6);
 strip.style.transition='transform 4.2s cubic-bezier(.12,.72,.12,1)';strip.style.transform=`translateX(${x}px)`;
 setTimeout(()=>{
  spinning=false;$('fab').disabled=false;reelState={tiles,x};
  if(pendingState){const s=pendingState;pendingState=null;applyState(s);}else render();
  const o=OUTCOMES[res];
  openSheet(`<div class="result"><div class="ico" style="background:${o.color}">${svgI(OUT_SVG[res])}</div><h2>${o.label}</h2><p class="fine" style="font-size:13.5px;color:#333">${r.msg}</p></div><button class="btn dark full" onclick="closeSheet()">Continue</button>`);
 },4350);
}

/* deals */
let draft=null;
function openDeal(aid){
 const a=G.nations[aid];if(a.embargo)return toast('Lift the embargo first');
 draft=defaultDraft(aid);const apl=playerOf(a);
 const opts=sel=>`<option value="money" ${sel==='money'?'selected':''}>Money ($M)</option>`+RES.map(r=>`<option value="${r.id}" ${sel===r.id?'selected':''}>${r.name}</option>`).join('');
 openSheet(`<div class="sh-head">${av(a,"lg")}<div><h2>Deal with ${a.name}</h2><div class="xs muted">${apl?`Led by ${apl.name} · `:''}Exports ${tagList(a,'surplus')||'—'} · Needs ${tagList(a,'need')||'—'}</div></div></div>
  <div class="two"><div class="field"><label>You give / month</label><select id="dGiveI" onchange="updDraft()">${opts(draft.pGive.item)}</select></div><div class="field"><label>Amount</label><input id="dGiveQ" type="number" min="1" value="${draft.pGive.qty}" oninput="updDraft()"></div></div>
  <div class="fine" id="dGiveV"></div>
  <div class="two"><div class="field"><label>You get / month</label><select id="dGetI" onchange="updDraft()">${opts(draft.pGet.item)}</select></div><div class="field"><label>Amount</label><input id="dGetQ" type="number" min="1" value="${draft.pGet.qty}" oninput="updDraft()"></div></div>
  <div class="fine" id="dGetV"></div>
  <div class="field"><label>Duration</label><select id="dMonths" onchange="updDraft()">${[3,6,12,24].map(m=>`<option value="${m}" ${m===6?'selected':''}>${m} months</option>`).join('')}</select></div>
  <div class="mood" id="dMood"></div>
  <button class="btn dark full" onclick="proposeDraft()">${apl?`Send to ${apl.name}`:'Propose deal'}</button><button class="btn full" onclick="closeSheet()">Cancel</button>`);
 updDraft();
}
function updDraft(){
 draft.pGive={item:$('dGiveI').value,qty:Math.max(0,parseFloat($('dGiveQ').value)||0)};
 draft.pGet={item:$('dGetI').value,qty:Math.max(0,parseFloat($('dGetQ').value)||0)};
 draft.months=parseInt($('dMonths').value);
 $('dGiveV').textContent=`Worth ≈ ${fmtMoney(mval(draft.pGive))}/mo`+(draft.pGive.item!=='money'?` · you have ${fmtN(P.stock[draft.pGive.item])}, net ${fmtSigned(netOf(P,draft.pGive.item))}/mo`:'');
 $('dGetV').textContent=`Worth ≈ ${fmtMoney(mval(draft.pGet))}/mo`;
 const e=evalDeal(draft);
 $('dMood').innerHTML=e.human?`<b>${e.mood}</b><span class="xs muted">They will see your proposal and can accept or decline it.</span>`:e.mood?`<b>${e.mood}</b><span class="xs muted">${e.ok?'They would likely accept.':'They would reject this — offer more or ask for less.'}</span>`:`<b>Not possible</b><span class="xs muted">${e.msg}</span>`;
}
async function proposeDraft(){const r=await doAct({t:'propose',deal:draft});if(r.ok)closeSheet();else if($('dMood'))updDraft();}

/* human players in lists */
function plTag(pl){return`<span class="tag" style="background:${pl.color}1f;color:${pl.color}">${pl.id===ME?'You':esc(pl.name)}</span>`;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function partnerTag(n){
 const pl=playerOf(n);let t='';
 if(G.war&&G.war.enemy===n.id)t='<span class="tag war">At war</span>';
 else if(G.offer&&G.offer.partner===n.id)t='<span class="tag offer">Offer</span>';
 else{const d=G.deals.filter(x=>x.partner===n.id).length+incomingDeals().filter(x=>x.pl.nation===n.id).length;if(d)t=`<span class="tag deal">${d} deal${d>1?'s':''}</span>`;else if(n.embargo)t='<span class="tag">Embargo</span>';}
 return(pl?plTag(pl):'')+t;
}
function countryRow(n,extra){const pl=playerOf(n);return`<button class="crow" onclick="countrySheet(${n.id})">${extra||''}${av(n,"")}<span class="cr-main"><span class="cr-n">${n.name}</span><span class="cr-s">${pl?`Led by ${esc(pl.name)}`:`<span style="color:${relC(n.rel)}">●</span> ${relWord(n.rel)}`} · GDP ${fmtMoney(n.gdp)}</span></span><span class="tags">${partnerTag(n)}</span></button>`;}
function incomingDeals(){const out=[];G.players.forEach(pl=>{if(pl.id===ME||pl.over)return;pl.deals.forEach((d,i)=>{if(d.partner===P.id)out.push({pl,d,i});});});return out;}
function requestsHtml(){
 if(!G.requests.length)return'';
 return G.requests.map(r=>{const from=playerById(r.from);if(!from)return'';const fn=G.nations[from.nation];
  if(r.kind==='deal'){const d=r.deal;return`<div class="card" style="border-color:#c7d2fe;background:#eef2ff"><div class="card-t">Proposal from ${esc(from.name)} (${fn.name})</div>
   <div class="kv"><span>You give</span><span>${itemStr(d.pGet)}/mo</span></div><div class="kv"><span>You get</span><span>${itemStr(d.pGive)}/mo</span></div>
   <div class="kv"><span>For</span><span>${d.months} months · ${fmtMoney(mval(d.pGet))} → ${fmtMoney(mval(d.pGive))}</span></div>
   <div class="row-btns"><button class="btn dark grow" onclick="reqAccept(${r.id})">Accept</button><button class="btn grow" onclick="reqDecline(${r.id})">Decline</button></div></div>`;}
  if(r.kind==='invest')return`<div class="card" style="border-color:#c7d2fe;background:#eef2ff"><div class="card-t">${esc(from.name)} (${fn.name}) wants to invest</div><div class="fine" style="margin-top:0;font-size:13px;color:#333">Their companies will pay to build one ${R[r.res].name} level in your country. You gain the output and jobs; they keep ${Math.round(INVEST_SHARE*100)}% of its profits.</div>
   <div class="row-btns"><button class="btn dark grow" onclick="reqAccept(${r.id})">Accept</button><button class="btn grow" onclick="reqDecline(${r.id})">Decline</button></div></div>`;
  if(r.kind==='blocJoin'||r.kind==='blocInvite'){const b=blocById(r.bloc);if(!b)return'';return`<div class="card" style="border-color:#c7d2fe;background:#eef2ff"><div class="card-t">${r.kind==='blocJoin'?`${esc(from.name)} (${fn.name}) applies to join ${esc(b.name)}`:`${esc(from.name)} invites you to ${esc(b.name)}`}</div>
   <div class="row-btns"><button class="btn dark grow" onclick="reqAccept(${r.id})">${r.kind==='blocJoin'?'Let them in':'Join'}</button><button class="btn grow" onclick="reqDecline(${r.id})">Decline</button></div></div>`;}
  return`<div class="card" style="border-color:#bbf7d0;background:#f0fdf4"><div class="card-t">${esc(from.name)} (${fn.name}) proposes peace</div><div class="fine" style="margin-top:0">A white peace ends the war with no payments.</div>
   <div class="row-btns"><button class="btn dark grow" onclick="reqAccept(${r.id})">Accept peace</button><button class="btn grow" onclick="reqDecline(${r.id})">Keep fighting</button></div></div>`;
 }).join('');
}


/* ================= GLOBAL (UI) ================= */
function setTariff(v){doAct({t:'tariff',v});}
function wtoJoin(){doAct({t:'wtoJoin'});}
function wtoLeave(){if(confirmNew())doAct({t:'wtoLeave'});}
function blocJoin(id){doAct({t:'blocJoin',b:id});}
function blocLeave(){if(confirmNew())doAct({t:'blocLeave'});}
async function blocInvite(n){await doAct({t:'blocInvite',n});if(sheetOpen())countrySheet(n);}
function foundBlocSheet(){
 openSheet(`<h2>Found a trade bloc</h2><div class="fine" style="font-size:13px;color:#333;margin-top:0">Create your own free-trade union with a mutual defense pact. Costs 30 political capital and ${fmtMoney(P.pf*50)}. Then invite countries from their country page: computer-run countries join if their relations with you are 30 or more.</div>
  <div class="field"><label>Bloc name</label><input id="blocName" maxlength="28" placeholder="e.g. Pacific Alliance"></div>
  <button class="btn dark full" onclick="foundBloc()">Found bloc</button><button class="btn full" onclick="closeSheet()">Cancel</button>`);
}
async function foundBloc(){const r=await doAct({t:'blocFound',name:$('blocName').value});if(r.ok)closeSheet();}
function investSheet(aid){
 const h=G.nations[aid],apl=playerOf(h);
 const opts=IDS.filter(id=>!DEPOSIT.includes(id)||h.dep[id]);
 openSheet(`<div class="sh-head">${av(h,'lg')}<div><h2>Invest in ${h.name}</h2><div class="xs muted">You pay to build one industry level there and earn ${Math.round(INVEST_SHARE*100)}% of its profits every month${apl?`. ${esc(apl.name)} must approve.`:'.'}</div></div></div>
  ${opts.map(id=>{const c=investCost(h,id),d=Math.max(0,levelProfit(h,id))*INVEST_SHARE,pay=d>0?Math.ceil(c/d):null;
   return`<button class="opt" onclick="invest(${aid},'${id}')" ${P.money<c?'disabled':''}><b>${R[id].name} · ${fmtMoney(c)}</b><span>About ${fmtMoney(d)}/mo for you${pay?` · pays back in ~${pay} months`:' · currently unprofitable'} · they have Lv ${h.ind[id]}</span></button>`;}).join('')}
  <div class="fine">Plants are seized if you go to war with ${h.name} or either side places an embargo.</div>
  <button class="btn full" onclick="closeSheet()">Cancel</button>`);
}
async function invest(aid,res){const r=await doAct({t:'invest',n:aid,res});if(r.ok)closeSheet();}
function sellBranch(id){if(confirmNew())doAct({t:'sellBranch',id});}
function nationalize(id){if(confirmNew())doAct({t:'nationalize',id});}
function invAccept(){doAct({t:'invAccept'});}
function invDecline(){doAct({t:'invDecline'},true);}
async function exchange(n){await doAct({t:'exchange',n});if(sheetOpen())countrySheet(n);}
function vGlobal(){
 const b=blocOf(P),L=G.lastLedger;let h='';
 if(G.invOffer){const o=G.invOffer,a=G.nations[o.owner],est=Math.max(0,levelProfit(P,o.res))*o.levels*INVEST_SHARE;
  h+=`<div class="card" style="margin-top:0;border-color:#f3d48a;background:#fffbeb"><div class="card-t">Investment offer from ${a.name}</div>
   <div class="fine" style="margin-top:0;font-size:13px;color:#333">A company from ${a.name} wants to build ${o.levels} ${R[o.res].name} level${o.levels>1?'s':''} in ${P.name} at no cost to you. Your output, jobs and GDP grow; they keep ${Math.round(INVEST_SHARE*100)}% of the plants' profits (about ${fmtMoney(est)}/mo).</div>
   <div class="row-btns"><button class="btn dark grow" onclick="invAccept()">Accept</button><button class="btn grow" onclick="invDecline()">Decline</button></div></div>`;}
 h+='<div class="masonry">';
 h+=`<div class="card"><div class="card-t">Trade policy</div>
  <div class="kv"><span style="color:var(--text);font-weight:500">Import tariff</span><span>${Math.round(P.tariff*100)}%</span></div>
  <div class="seg">${TARIFFS.map(t=>`<button class="${t===P.tariff?'on':''}" onclick="setTariff(${t})" ${P.wto&&t>0.1?'disabled':''}>${Math.round(t*100)}%</button>`).join('')}</div>
  <div class="kv" style="margin-top:8px"><span>Tariff income last month</span><span class="pos">${sign(L.tariffs||0)}</span></div>
  <div class="kv"><span>Export price penalty</span><span class="${exportPenalty(P)>0?'neg':''}">−${(exportPenalty(P)*100).toFixed(1)}%</span></div>
  <div class="fine">Tariffs earn money on everything you import and please local business and workers. But other countries hit back: your exports sell for less, prices rise for citizens, and relations cool.</div>
  <div class="kv" style="margin-top:12px"><span style="color:var(--text);font-weight:500">World Trade Organization</span><span>${P.wto?'Member':'Not a member'}</span></div>
  <div class="fine" style="margin-top:2px">${P.wto?'Members pay 1% lower market fees, get on better with other members and face little retaliation, but tariffs are capped at 10%.':'Outside the WTO you can set any tariff, but member countries trust you less.'}</div>
  <button class="btn full" onclick="${P.wto?'wtoLeave':'wtoJoin'}()">${P.wto?'Leave the WTO · 10 political capital':'Join the WTO · 20 political capital'}</button></div>`;
 h+=`<div class="card"><div class="card-t">Trade blocs</div>`;
 if(b)h+=`<div class="kv"><span style="color:var(--text);font-weight:600">${esc(b.name)}</span><span>${b.members.length} member${b.members.length>1?'s':''}</span></div>
   <div class="avs">${b.members.map(id=>`<span onclick="countrySheet(${id})" style="cursor:pointer">${av(G.nations[id],'sm')}</span>`).join('')}</div>
   <div class="fine">Free trade inside the bloc: members accept deals more readily, you pay 1% lower market fees and face less tariff retaliation. Mutual defense: your army fights 20% stronger against outsiders, and anyone attacking a member angers the whole bloc.</div>
   <button class="btn full" onclick="blocLeave()">Leave ${esc(b.short)} · 10 political capital</button><div class="fine">Invite countries from their country page.</div>`;
 else h+=`<div class="fine" style="margin-top:0">You are not in a bloc. Apply to one below or found your own.</div>`;
 h+=G.blocs.filter(x=>x!==b).map(x=>`<div class="crow"><span class="av sq code" style="font-size:9.5px">${esc(x.short.slice(0,5))}</span><span class="cr-main"><span class="cr-n">${esc(x.name)}</span><span class="cr-s">${x.members.length} members · ${x.members.slice(0,7).map(id=>G.nations[id].flag).join(' ')}${x.members.length>7?' …':''}</span></span>${b?'':`<button class="btn sm" onclick="blocJoin(${x.id})">Apply</button>`}</div>`).join('');
 if(!b)h+=`<button class="btn dark full" onclick="foundBlocSheet()">Found a new bloc</button><div class="fine">Applying costs 15 political capital; members vote based on their relations with you (average 15 or more).</div>`;
 h+='</div>';
 const mine=G.invest.filter(i=>i.owner===P.id),foreign=G.invest.filter(i=>i.host===P.id);
 const inc=mine.reduce((s,i)=>s+(i.last||0),0),out=foreign.reduce((s,i)=>s+(i.last||0),0);
 h+=`<div class="card"><div class="card-t">Your multinational companies <span class="xs muted">${sign(inc)}/mo</span></div>`;
 h+=mine.length?mine.map(i=>{const host=G.nations[i.host];return`<div class="crow">${av(host,'')}<span class="cr-main"><span class="cr-n">${R[i.res].name} plants in ${host.name}</span><span class="cr-s">${i.levels} level${i.levels>1?'s':''} · ${fmtMoney(i.last||dividendOf(i))}/mo to you</span></span><button class="btn sm" onclick="sellBranch(${i.id})">Sell</button></div>`;}).join('')
  :`<div class="fine" style="margin-top:0">No branches abroad yet. Open any country and choose "Invest here": you pay to build plants there and earn ${Math.round(INVEST_SHARE*100)}% of their profits every month.</div>`;
 h+=`<div class="card-t" style="margin:14px 0 4px">Foreign companies in ${P.name} <span class="xs muted">${sign(-out)}/mo</span></div>`;
 h+=foreign.length?foreign.map(i=>{const o=G.nations[i.owner];return`<div class="crow">${av(o,'')}<span class="cr-main"><span class="cr-n">${o.name}'s ${R[i.res].name} plants</span><span class="cr-s">${i.levels} level${i.levels>1?'s':''} · ${fmtMoney(i.last||dividendOf(i))}/mo goes abroad</span></span><button class="btn sm red" onclick="nationalize(${i.id})">Nationalize</button></div>`;}).join('')
  :`<div class="fine" style="margin-top:0">None yet. Foreign companies sometimes offer to build here.</div>`;
 h+=`<div class="fine">Plants are seized if the two countries go to war or embargo each other, and hostile governments may nationalize them. Nationalizing keeps the plants but scares every foreign investor.</div></div>`;
 const bySoft=[...G.nations].sort((a,c)=>c.soft-a.soft);
 h+=`<div class="card"><div class="card-t">Culture and soft power</div>
  <div class="kv"><span style="color:var(--text)">Your soft power</span><span><b>${Math.round(P.soft)}</b> · #${bySoft.indexOf(P)+1} in the world</span></div>
  <div class="bar"><div style="width:${P.soft}%"></div></div>
  <div class="kv" style="margin-top:6px"><span>Tourism income</span><span class="pos">${fmtMoney(tourismOf(P))}/mo</span></div>
  <div class="kv"><span>Culture budget</span><span>${LEVELS[P.gov.budget.culture]} · <a href="#" onclick="setPill('nation');return false" style="color:inherit">change in Nation</a></span></div>
  <div class="fine">Soft power grows with education, wealth, technology, car and electronics exports, and your culture budget. It brings tourists and slowly makes every country friendlier. Cultural exchanges (on a country's page) also share ideas: +3 research for both sides.</div>
  <div class="card-t" style="margin:12px 0 4px">Most influential</div>${bySoft.slice(0,8).map((n,i)=>`<div class="kv"><span style="color:var(--text)">${i+1}. ${n.name}${n.id===P.id?' (you)':''}</span><span>${Math.round(n.soft)}</span></div>`).join('')}</div>`;
 const ps=partnersOf(P);
 h+=`<div class="card"><div class="card-t">Ideas and technology</div>
  <div class="kv"><span>Connected countries</span><span>${ps.length}</span></div>
  <div class="kv"><span>Idea spillover</span><span>+${spillover(P).toFixed(1)} research/mo</span></div>
  <div class="fine">Trade partners, bloc members, investment links and exchange partners share know-how. Technologies they already have cost you up to 40% less, and another 15% less once most of the world knows them.</div>
  ${TECHS.map(t=>{const k=knownBy(t.id),have=P.gov.techs.includes(t.id),d=researchDiscount(P,t.id);return`<div class="kv"><span style="color:var(--text)">${t.name}${have?' <span class="tag deal">yours</span>':''}</span><span class="xs">${k} countr${k===1?'y':'ies'}${!have&&d>0?` · <span class="pos">−${Math.round(d*100)}%</span>`:''}</span></div>`;}).join('')}</div>`;
 return h+'</div>';
}

/* ================= SHEETS ================= */
function countrySheet(aid){
 const a=G.nations[aid];if(a.id===P.id)return selfSheet();
 const atWar=G.war&&G.war.enemy===aid,apl=playerOf(a);
 openSheet(`<div class="sh-head">${av(a,"lg")}<div style="flex:1"><h2>${a.name}</h2><div class="xs muted">#${rankOf(a)} in the world · GDP ${fmtMoney(a.gdp)}</div></div><span class="tags">${partnerTag(a)}</span></div>
  ${apl?`<div class="kv"><span>Leader</span><span style="font-weight:600;color:${apl.color}">${esc(apl.name)} (human player)</span></div>`:`<div class="kv"><span>Relations</span><span style="color:${relC(a.rel)};font-weight:600">${relWord(a.rel)} (${Math.round(a.rel)})</span></div>`}
  <div class="kv"><span>Population</span><span>${fmtPop(a.pop)}</span></div>
  <div class="kv"><span>Army</span><span>${Math.round(a.army)} units (you: ${Math.round(P.army)})</span></div>
  <div class="kv"><span>Exports</span><span>${tagList(a,'surplus')||'—'}</span></div>
  <div class="kv"><span>Needs</span><span>${tagList(a,'need')||'—'}</span></div>
  <div class="kv"><span>Trade bloc</span><span>${blocOf(a)?esc(blocOf(a).name):'None'}${a.wto?' · WTO':''}</span></div>
  <div class="kv"><span>Import tariff · soft power</span><span>${Math.round(a.tariff*100)}% · ${Math.round(a.soft)}</span></div>
  ${G.invest.filter(i=>i.owner===P.id&&i.host===a.id).map(i=>`<div class="kv"><span>Your ${R[i.res].name} plants</span><span>${i.levels} lvl · ${fmtMoney(i.last||dividendOf(i))}/mo</span></div>`).join('')}
  <div class="card-t" style="margin:14px 0 8px">Industries</div>
  <div class="grid4">${RES.map(r=>`<div>${r.name}<b>${DEPOSIT.includes(r.id)&&!a.dep[r.id]?'—':'Lv '+a.ind[r.id]}</b></div>`).join('')}</div>
  ${CUR.over?'':atWar?`<button class="btn dark full" onclick="closeSheet();UI.nav='home';UI.pill='wars';render()">Go to the war room</button>`:
  `<button class="btn dark full" onclick="openDeal(${aid})" ${a.embargo?'disabled':''}>${apl?`Propose a deal to ${esc(apl.name)}`:'Propose a trade deal'}</button>
   <div class="row-btns"><button class="btn grow" onclick="sendAid(${aid})" ${a.embargo?'disabled':''}>${apl?'Gift $600M':'Aid $600M'}</button><button class="btn grow" onclick="toggleEmbargo(${aid})">${a.embargo?'Lift embargo':'Embargo'}</button></div>
   <div class="row-btns"><button class="btn grow" onclick="investSheet(${aid})" ${a.embargo?'disabled':''}>Invest here</button><button class="btn grow" onclick="exchange(${aid})" ${a.embargo?'disabled':''}>Cultural exchange $300M</button></div>
   ${blocOf(P)&&!blocOf(P).members.includes(aid)?`<button class="btn full" onclick="blocInvite(${aid})">Invite to ${esc(blocOf(P).name)}</button>`:''}
   <button class="btn red full" onclick="confirmWar(${aid})" ${G.war?'disabled':''}>Declare war${G.war?' (already at war)':''}</button>`}`);
}
function menuSheet(){
 if(!ROOM)return;const isHost=ROOM.hostId===ME,link=location.origin+'/?room='+ROOM.code;
 openSheet(`<h2>Game ${ROOM.code}</h2><div class="xs muted" style="margin-bottom:6px">Everything is saved on the server. Close the tab and come back any time.</div>
  <div class="card-t" style="margin:12px 0 4px">Players</div>
  ${ROOM.players.map(p=>{const gp=G.players.find(x=>x.id===p.id),n=gp?G.nations[gp.nation]:null;return`<div class="crow">${n?av(n,''):''}<span class="cr-main"><span class="cr-n">${esc(p.name)}${p.id===ME?' (you)':''}${p.id===ROOM.hostId?' · host':''}</span><span class="cr-s">${n?n.name:''} · ${gp&&gp.over?'government fallen':p.connected?(p.ready?'ready':'playing'):'offline'}</span></span><span class="dot ${p.connected?(p.ready?'g':'y'):'x'}"></span></div>`;}).join('')}
  <div class="card-t" style="margin:14px 0 4px">Turn timer <span class="xs muted">${isHost?'':'host only'}</span></div>
  ${seg(['Off','30s','60s','2m','5m'],[0,30,60,120,300].indexOf(ROOM.timer),`(i=>{wsSend({t:'timer',s:[0,30,60,120,300][i]});closeSheet();})`,!isHost)}
  <button class="btn full" onclick="copyText('${link}')">Copy invite link</button>
  <button class="btn full" onclick="helpSheet()">How to play</button>
  <button class="btn red full" onclick="if(confirmNew())leaveGame()">Leave this game</button>`);
}
function helpSheet(){
 openSheet(`<div class="help"><h2>How to play</h2>
  <p>Every player leads a random nation in a shared world of 60 countries. When everyone presses <b>Ready</b> (or the turn timer runs out), a month passes. Grow your GDP by your goal multiplier within 10 years.</p>
  <ul><li><b>Home → Map</b>: your stats, the real world map (drag, zoom, tap a country) and every nation. Other players' countries show in their colour.</li>
  <li><b>Home → Nation</b>: budget and taxes, laws, interest groups, research, elections and crises.</li>
  <li><b>Home → Business</b>: build and upgrade industries. Steel needs oil, electronics need gold, cars need steel + electronics.</li>
  <li><b>Home → Global</b>: globalization. Set import tariffs, join or leave the WTO, apply to or found trade blocs, invest in factories abroad, handle foreign companies, grow soft power and share technology with connected countries.</li>
  <li><b>Home → Wars</b>: declare war, then spin the reel to fight one battle a month. Human rivals fight back with their own battles.</li>
  <li><b>Search</b>: world rankings. <b>Trade</b>: market, offers and proposals from other players. <b>Wallet</b>: money, goals and news.</li></ul>
  <p>Deals with other players need their approval. You lose if your debt passes −$15B, stability collapses, you lose an election, or the army stages a coup; the computer then takes over your country.</p></div>
  <button class="btn dark full" onclick="closeSheet()">Got it</button>`);
}
let confirmArm=0;
function confirmNew(){if(Date.now()-confirmArm<4000)return true;confirmArm=Date.now();toast('Tap again to confirm');return false;}
function checkFlash(){
 if(!CUR||!CUR.flashSeq||CUR.flashSeq<=seenFlash)return;
 seenFlash=CUR.flashSeq;try{localStorage.setItem('tg_flash_'+ROOM.code+'_'+ME,String(seenFlash));}catch(e){}
 if(spinning)return;handleFlash(CUR.flash);
}
function handleFlash(f){
 if(!f)return;
 const res=(bg,svg,title,text,btns)=>openSheet(`<div class="result"><div class="ico" style="background:${bg}">${svgI(svg)}</div><h2>${title}</h2><p class="fine" style="font-size:13.5px;color:#333">${text}</p></div>${btns}`);
 const cont='<button class="btn dark full" onclick="closeSheet()">Continue</button>';
 if(f==='decision')return decisionSheet();
 if(f==='election_won')return res('#B3BAF5',OUT_SVG.major,'Re-elected!',`You won ${G.lastVote.toFixed(1)}% of the vote. Four more years in power, plus 20 political capital.`,cont);
 if(f==='attacked'&&G.war){const e=G.nations[G.war.enemy],epl=playerOf(e);return res('#F3B7B5',OUT_SVG.win,`${e.name} attacks!`,`${epl?esc(epl.name)+' has':'They have'} declared war on you. Recruit troops and fight back, or seek peace.`,`<button class="btn dark full" onclick="closeSheet();UI.nav='home';UI.pill='wars';render()">Go to the war room</button>`);}
 if(f==='war_won')return res('#B3BAF5',OUT_SVG.major,'Your enemy surrenders!','Check the news for the reparations and land you gained.',cont);
 if(f==='war_lost')return res('#F3B7B5',OUT_SVG.loss,'You surrendered','You lost the war. Check the news for what it cost you.',cont);
 const stats=`<div class="kv"><span>Final GDP</span><span>${fmtMoney(P.gdp)}</span></div><div class="kv"><span>Growth</span><span>${(P.gdp/G.startGdp).toFixed(2)}×</span></div><div class="kv"><span>World rank</span><span>#${rankOf(P)}</span></div>`;
 if(f==='won')return res('#B3BAF5',OUT_SVG.major,'Victory!',`${P.name} reached ${fmtMoney(P.gdp)} GDP in ${dateStr()}.`,stats+cont);
 if(f==='end')return res('#F8D5B0',G.won?OUT_SVG.major:OUT_SVG.clock,'The decade is over',G.won?'You hit your goal — well played!':`You didn't reach ${fmtMoney(G.target)}, but the world keeps turning.`,stats+'<button class="btn dark full" onclick="closeSheet()">Keep playing</button>');
 const T={bankrupt:['Bankrupt!','Your debts spiralled out of control and creditors seized the treasury.'],revolution:['Revolution!','Stability collapsed and angry citizens overthrew your government.'],voted_out:['Voted out!',`Voters turned against you: only ${(G.lastVote||0).toFixed(1)}% backed your government.`],coup:['Military coup!','The army seized power while the country was unstable.']}[f];
 if(T)res('#F3B7B5',OUT_SVG.loss,T[0],T[1]+' The computer now runs your country; you can keep watching.',stats+'<button class="btn dark full" onclick="closeSheet()">Spectate</button><button class="btn full" onclick="leaveGame()">Leave game</button>');
}

/* ================= MAP (real borders) ================= */
const mapView={cLon:0,cLat:20,zoom:1.4};
let WORLD=null,mapPts=[];
fetch('/world.json').then(r=>r.json()).then(d=>{WORLD=d.map(f=>{const p=new Path2D();f.p.forEach(poly=>poly.forEach(ring=>{ring.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();}));let mnx=180,mxx=-180;f.p.forEach(poly=>poly[0].forEach(([x])=>{mnx=Math.min(mnx,x);mxx=Math.max(mxx,x);}));return{c:f.c,n:f.n,path:p,mnx,mxx};});}).catch(()=>{});
const mapScale=H=>H/140*mapView.zoom;
function clampView(H){const s=mapScale(H),hh=H/2/s;mapView.cLat=clamp(mapView.cLat,-58+hh,84-hh);if(mapView.cLon>180)mapView.cLon-=360;if(mapView.cLon<-180)mapView.cLon+=360;}
function zoomMap(d){const cv=$('map');mapView.zoom=clamp(mapView.zoom*(d>0?1.4:1/1.4),cv?Math.max(1,cv.clientWidth/(cv.clientHeight/140*360)):1,7);if(cv)clampView(cv.clientHeight);}
function centerMap(){const cv=$('map');mapView.cLon=P.lon;mapView.cLat=P.lat;if(mapView.zoom<2)mapView.zoom=2;if(cv)clampView(cv.clientHeight);}
function nationByCode(){const m={};if(G)G.nations.forEach(n=>m[n.flag]=n);return m;}
function fillFor(n){
 if(!n)return'#e7e5df';
 const pl=playerOf(n);if(pl)return pl.id===ME?pl.color:pl.color+'b3';
 if(G.war&&G.war.enemy===n.id)return'#f19c9c';
 const r=n.rel;return r>=30?'#bfe3c8':r>=10?'#d7ecd3':r>-10?'#e9e6cf':r>-40?'#f6dcc0':'#f4c4b8';
}
function drawMap(ts){
 requestAnimationFrame(drawMap);
 const cv=$('map');if(!G||!P||!cv||cv.offsetParent===null)return;
 const W=cv.clientWidth,H=cv.clientHeight,dpr=devicePixelRatio||1;
 if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
 const minZ=W/(H/140*360);if(mapView.zoom<minZ)mapView.zoom=minZ;
 clampView(H);
 const ctx=cv.getContext('2d'),s=mapScale(H),cx=W/2,cy=H/2;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const py=lat=>cy-(lat-mapView.cLat)*s;
 const og=ctx.createLinearGradient(0,py(80),0,py(-60));og.addColorStop(0,'#d6e9f5');og.addColorStop(.5,'#b3d6ec');og.addColorStop(1,'#cbe2f1');
 ctx.fillStyle=og;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1;
 for(let la=-60;la<=80;la+=20){ctx.beginPath();ctx.moveTo(0,py(la));ctx.lineTo(W,py(la));ctx.stroke();}
 if(WORLD){
  const byCode=nationByCode();
  for(let k=-1;k<=1;k++){
   const ox=cx+(k*360-mapView.cLon)*s;
   if(ox+180*s<0||ox-180*s>W)continue;
   ctx.setTransform(s*dpr,0,0,-s*dpr,ox*dpr,(cy+mapView.cLat*s)*dpr);
   ctx.lineWidth=0.7/s;ctx.lineJoin='round';
   WORLD.forEach(f=>{const x1=ox+f.mnx*s,x2=ox+f.mxx*s;if(x2<0||x1>W)return;const n=byCode[f.c];ctx.fillStyle=fillFor(n);ctx.fill(f.path);ctx.strokeStyle=n&&n.id===P.id?'#111':'rgba(90,90,80,.45)';if(n&&n.id===P.id){ctx.lineWidth=1.8/s;ctx.stroke(f.path);ctx.lineWidth=0.7/s;}else ctx.stroke(f.path);});
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 mapPts=G.nations.map(n=>{const dx=((n.lon-mapView.cLon)%360+540)%360-180;return{n,x:cx+dx*s,y:py(n.lat)};});
 const pp=mapPts[P.id];
 const route=(q,color,dash,w)=>{if(Math.abs(q.x-pp.x)>W*1.5)return;const mx=(pp.x+q.x)/2,my=(pp.y+q.y)/2-Math.abs(pp.x-q.x)*0.2-12;
  ctx.strokeStyle=color;ctx.lineWidth=w;ctx.setLineDash(dash);ctx.lineDashOffset=-ts/45;ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.quadraticCurveTo(mx,my,q.x,q.y);ctx.stroke();ctx.setLineDash([]);};
 G.deals.forEach(d=>route(mapPts[d.partner],'rgba(22,101,52,.9)',[7,6],2));
 incomingDeals().forEach(x=>route(mapPts[x.pl.nation],'rgba(22,101,52,.9)',[7,6],2));
 if(G.offer)route(mapPts[G.offer.partner],'rgba(180,83,9,.9)',[3,5],1.8);
 if(G.war)route(mapPts[G.war.enemy],`rgba(185,28,28,${0.55+0.35*Math.sin(ts/250)})`,[10,5],2.4);
 const showAll=mapView.zoom>=2.6;
 const important=n=>n.id===P.id||n.isPlayer||(G.war&&G.war.enemy===n.id)||G.deals.some(d=>d.partner===n.id)||(G.offer&&G.offer.partner===n.id);
 ctx.textAlign='center';ctx.textBaseline='middle';
 mapPts.forEach(p=>{const n=p.n;if(p.x<-40||p.x>W+40)return;
  if(!(showAll||important(n)||(mapView.zoom>=1.8&&n.pop>40)))return;
  const me=n.id===P.id,pl=playerOf(n);
  ctx.font=(me||pl?'600 12px':'500 10.5px')+' Inter,system-ui,sans-serif';
  const label=pl&&!me?`${n.name} · ${pl.name}`:n.name;
  ctx.lineWidth=3;ctx.strokeStyle='rgba(255,255,255,.92)';ctx.strokeText(label,p.x,p.y);ctx.fillStyle=me?'#000':'#1f1f1f';ctx.fillText(label,p.x,p.y);
 });
}
function mapHit(e){
 const cv=$('map'),b=cv.getBoundingClientRect(),mx=e.clientX-b.left,my=e.clientY-b.top,W=cv.clientWidth,H=cv.clientHeight,dpr=devicePixelRatio||1;
 if(WORLD){const ctx=cv.getContext('2d'),s=mapScale(H),cx=W/2,cy=H/2,byCode=nationByCode();
  for(let k=-1;k<=1;k++){const ox=cx+(k*360-mapView.cLon)*s;ctx.setTransform(s*dpr,0,0,-s*dpr,ox*dpr,(cy+mapView.cLat*s)*dpr);
   for(const f of WORLD){const n=byCode[f.c];if(ctx.isPointInPath(f.path,mx*dpr,my*dpr)){ctx.setTransform(dpr,0,0,dpr,0,0);return n?{n}:{name:f.n};}}}
  ctx.setTransform(dpr,0,0,dpr,0,0);}
 let best=null,bd=16;mapPts.forEach(p=>{const d=Math.hypot(p.x-mx,p.y-my);if(d<bd){bd=d;best=p;}});return best;
}
function bindMap(){
 const cv=$('map');if(!cv||cv._bound)return;cv._bound=1;let down=null;
 cv.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,lon:mapView.cLon,lat:mapView.cLat,moved:false};cv.setPointerCapture(e.pointerId);});
 cv.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>5)down.moved=true;
  if(down.moved){const s=mapScale(cv.clientHeight);mapView.cLon=down.lon-dx/s;mapView.cLat=down.lat+dy/s;clampView(cv.clientHeight);}});
 cv.addEventListener('pointerup',e=>{if(down&&!down.moved){const hit=mapHit(e);if(hit&&hit.n)hit.n.id===P.id?selfSheet():countrySheet(hit.n.id);else if(hit&&hit.name)toast(`${hit.name} is not a playable nation`);}down=null;});
 cv.addEventListener('pointercancel',()=>down=null);
 cv.addEventListener('wheel',e=>{e.preventDefault();zoomMap(e.deltaY<0?1:-1);},{passive:false});
}

/* ================= BOOT ================= */
function boot(){
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&sheetOpen())closeSheet();
  if(e.code==='Space'&&G&&$('start').classList.contains('hidden')&&!sheetOpen()&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();nextMonth();}
 });
 let rsT=0;window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(()=>{if(G&&!spinning)render();},120);});
 showEntry();connect();
 requestAnimationFrame(drawMap);
}
boot();
