/* Trade Game - shared game logic.
   Runs in the browser (as plain globals) and on the server (one isolated vm context per room). */
'use strict';
/* ================= DATA ================= */
const RES=[
 {id:'grain',name:'Grain',base:20},{id:'lumber',name:'Lumber',base:28},{id:'oil',name:'Oil',base:60},{id:'gold',name:'Gold',base:220},
 {id:'steel',name:'Steel',base:50},{id:'textiles',name:'Textiles',base:35},{id:'electronics',name:'Electronics',base:130},{id:'cars',name:'Cars',base:260},
];
const R={};RES.forEach(r=>R[r.id]=r);
const IDS=RES.map(r=>r.id);
const DEPOSIT=['oil','gold'];
const RECIPE={steel:{oil:0.3},electronics:{gold:0.1},cars:{steel:1,electronics:0.25}};
const OUTR={gold:4};
const outPer=id=>OUTR[id]||10;
const NEED={grain:4,lumber:1,oil:1.5,textiles:1.5,electronics:0.5,cars:0.25};
const HAPPY_W={grain:30,oil:15,lumber:10,textiles:10,electronics:8,cars:7};
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const START_YEAR=2027,END_TURN=120,SURVEY_COST=2500;
const PLAYER_COLORS=['#3b6cf6','#f97316','#a855f7','#0d9488','#e11d48','#ca8a04','#0284c7','#65a30d'];

// [code, name, lon, lat, pop (millions), strengths]
const COUNTRY_DATA=[
 ['US','United States',-98.8,39.9,333,{grain:3,lumber:2,oil:3,steel:2,textiles:1,gold:1,electronics:3,cars:2}],
 ['CA','Canada',-99,58.6,39,{grain:2,lumber:3,oil:3,steel:1,gold:2,cars:1}],
 ['MX','Mexico',-102.2,23.9,128,{grain:1,oil:2,textiles:2,gold:1,electronics:1,cars:2}],
 ['BR','Brazil',-53.2,-10.7,215,{grain:3,lumber:3,oil:1,steel:2,textiles:1,gold:1,cars:1}],
 ['AR','Argentina',-64.8,-34.5,46,{grain:3,lumber:1,oil:1,gold:1}],
 ['CL','Chile',-71,-34.4,19,{grain:1,lumber:1,steel:1,gold:2}],
 ['CO','Colombia',-73.1,3.9,52,{grain:1,oil:2,gold:1,textiles:1}],
 ['PE','Peru',-74.4,-9.1,34,{grain:1,gold:2,steel:1,textiles:1}],
 ['VE','Venezuela',-66.2,7.1,28,{oil:3,gold:1}],
 ['EC','Ecuador',-78.4,-1.4,18,{grain:1,oil:2}],
 ['GB','United Kingdom',-2.4,53.8,67,{oil:1,steel:1,textiles:1,electronics:1,cars:1}],
 ['FR','France',2.5,46.6,68,{grain:2,lumber:1,textiles:1,electronics:1,cars:2}],
 ['DE','Germany',10.4,51,84,{grain:1,lumber:1,steel:2,electronics:2,cars:3}],
 ['ES','Spain',-3.6,40.4,48,{grain:2,textiles:2,cars:2}],
 ['IT','Italy',12.3,43.5,59,{grain:1,textiles:3,cars:2,steel:1}],
 ['NL','Netherlands',5.6,52.3,18,{grain:2,electronics:2,oil:1}],
 ['BE','Belgium',4.7,50.6,12,{steel:1,textiles:1,electronics:1}],
 ['CH','Switzerland',8.2,46.8,9,{gold:1,electronics:2}],
 ['AT','Austria',14.1,47.6,9,{lumber:2,steel:1,cars:1}],
 ['PL','Poland',19.4,52.1,37,{grain:2,lumber:2,steel:1,cars:1}],
 ['CZ','Czechia',15.3,49.7,11,{steel:1,cars:2}],
 ['SE','Sweden',16.3,62.4,10.5,{lumber:3,steel:2,cars:1}],
 ['FI','Finland',26.2,64.3,5.5,{lumber:3,electronics:1}],
 ['NO','Norway',10,61,5.5,{lumber:1,oil:3}],
 ['UA','Ukraine',31.3,49.2,37,{grain:3,steel:2}],
 ['RO','Romania',25,45.9,19,{grain:2,lumber:1,oil:1}],
 ['GR','Greece',22.6,39.5,10.4,{grain:1,textiles:1}],
 ['PT','Portugal',-8,39.7,10.3,{textiles:2,lumber:1}],
 ['RU','Russia',95.5,62,144,{grain:2,lumber:3,oil:3,steel:2,gold:2}],
 ['TR','Turkey',35.4,39.1,85,{grain:1,steel:1,textiles:2,cars:1}],
 ['KZ','Kazakhstan',67.3,48.4,20,{grain:2,oil:2,gold:1,steel:1}],
 ['IR','Iran',54.4,32.5,89,{oil:3,steel:1,grain:1}],
 ['IQ','Iraq',43.8,33,45,{oil:3}],
 ['SA','Saudi Arabia',44.7,24.1,36,{oil:3}],
 ['AE','United Arab Emirates',54.3,23.9,10,{oil:3,gold:1}],
 ['QA','Qatar',51.2,25.3,2.7,{oil:3}],
 ['IL','Israel',35,31.5,9.8,{electronics:2,grain:1}],
 ['EG','Egypt',29.9,26.5,110,{grain:1,oil:1,textiles:2}],
 ['MA','Morocco',-6.5,31.8,37,{grain:1,textiles:1}],
 ['DZ','Algeria',2.6,28.1,45,{oil:2,grain:1}],
 ['NG','Nigeria',8.1,9.6,220,{grain:1,oil:2,textiles:1}],
 ['GH','Ghana',-1.2,8,34,{gold:2,grain:1}],
 ['ET','Ethiopia',39.6,8.6,125,{grain:2,textiles:1}],
 ['KE','Kenya',37.8,0.6,55,{grain:2}],
 ['CD','DR Congo',23.6,-2.9,100,{gold:2,lumber:2}],
 ['AO','Angola',17.6,-12.3,36,{oil:2,gold:1}],
 ['ZA','South Africa',25.2,-29,60,{grain:1,steel:1,gold:3}],
 ['IN','India',79.5,22.8,1420,{grain:3,steel:2,textiles:3,electronics:1,cars:1}],
 ['PK','Pakistan',69.2,29.9,235,{grain:2,textiles:2}],
 ['BD','Bangladesh',90.2,23.9,170,{textiles:3,grain:1}],
 ['CN','China',103.4,35,1410,{grain:2,lumber:1,steel:3,textiles:3,gold:1,electronics:3,cars:2}],
 ['JP','Japan',137.9,36.6,125,{steel:2,electronics:3,cars:3}],
 ['KR','South Korea',127.9,36.5,52,{steel:2,electronics:3,cars:2}],
 ['VN','Vietnam',106.4,16.5,99,{grain:2,textiles:2,electronics:2}],
 ['TH','Thailand',101,15.1,70,{grain:2,electronics:1,cars:1,textiles:1}],
 ['MY','Malaysia',102.3,4,34,{oil:1,electronics:2,lumber:1}],
 ['PH','Philippines',121.4,15.9,115,{grain:1,electronics:1,textiles:1}],
 ['ID','Indonesia',114,-0.5,277,{grain:1,lumber:2,oil:1,textiles:2,gold:1}],
 ['AU','Australia',134,-25.5,26,{grain:2,steel:2,oil:1,gold:2}],
 ['NZ','New Zealand',172.5,-41.5,5.2,{grain:2,lumber:1}],
];
const COUNTRIES=COUNTRY_DATA.map(([flag,name,lon,lat,pop,s])=>({flag,name,lon,lat,pop,s}));

const TRAITS=[
 {id:'fertile',name:'Fertile Lands',desc:'+30% grain & lumber output',prod:{grain:1.3,lumber:1.3}},
 {id:'oil',name:'Black Gold',desc:'Guaranteed oil deposits, +25% oil output',prod:{oil:1.25},dep:['oil']},
 {id:'mines',name:'Rich Mines',desc:'Guaranteed gold deposits, +25% gold output',prod:{gold:1.25},dep:['gold']},
 {id:'industry',name:'Industrial Heartland',desc:'+20% steel & car output',prod:{steel:1.2,cars:1.2}},
 {id:'tech',name:'Tech Pioneers',desc:'+25% electronics output',prod:{electronics:1.25}},
 {id:'weavers',name:'Master Weavers',desc:'+35% textiles output',prod:{textiles:1.35}},
 {id:'hub',name:'Trade Hub',desc:'World market fees are halved'},
 {id:'diplomat',name:'Diplomatic Tradition',desc:'+25 starting relations; partners accept deals more easily'},
 {id:'frugal',name:'Efficient Bureaucracy',desc:'-15% industry upkeep'},
 {id:'builder',name:'Master Builders',desc:'-25% construction costs'},
 {id:'content',name:'Content Citizens',desc:'+10 happiness'},
];

/* ================= UTIL ================= */
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function wpick(list){const t=list.reduce((s,x)=>s+x.w,0);let r=Math.random()*t;for(const x of list){r-=x.w;if(r<=0)return x;}return list[list.length-1];}
function fmtMoney(v){const s=v<0?'-':'';v=Math.abs(v);if(v>=1e6)return s+'$'+(v/1e6).toFixed(2)+'T';if(v>=1000)return s+'$'+(v/1000).toFixed(v>=1e4?1:2)+'B';return s+'$'+Math.round(v)+'M';}
const sign=v=>(v>=0?'+':'−')+fmtMoney(Math.abs(v));
const fmtN=v=>Math.round(v).toLocaleString('en-US');
const fmtPop=p=>p>=1000?(p/1000).toFixed(2)+'B':(p>=10?Math.round(p):p.toFixed(1))+'M';

/* ================= STATE & PLAYER CONTEXT =================
   G holds the whole shared world. CUR is the player whose point of view the code runs in;
   G.deals / G.war / G.offer ... and nation.rel / nation.embargo transparently refer to CUR. */
let G=null,P=null,M=null,CUR=null;
const blankLedger=()=>({taxes:0,sales:0,purchases:0,dealsIn:0,dealsOut:0,upkeep:0,construction:0,other:0,interest:0,military:0,war:0,budget:0,domestic:0,tariffs:0,tourism:0,dividends:0});
const PFIELDS=['deals','offer','war','ledgerCur','lastLedger','autoSell','autoBuy','news','flash','won','over','endShown','startGdp','target','goalMult','hist','lastVote','requests','invOffer'];
function installProxies(){
 PFIELDS.forEach(f=>Object.defineProperty(G,f,{get(){return CUR?CUR[f]:undefined;},set(v){if(CUR)CUR[f]=v;},configurable:true,enumerable:false}));
 G.nations.forEach(n=>{
  if(!n.rels)n.rels={};if(!n.embs)n.embs={};
  Object.defineProperty(n,'rel',{get(){return CUR?(this.rels[CUR.nation]||0):0;},set(v){if(CUR)this.rels[CUR.nation]=v;},configurable:true,enumerable:false});
  Object.defineProperty(n,'embargo',{get(){return CUR?!!this.embs[CUR.nation]:false;},set(v){if(CUR)this.embs[CUR.nation]=!!v;},configurable:true,enumerable:false});
 });
}
function useGame(g){G=g;M=g.market;installProxies();CUR=null;P=null;}
function setCtx(pl){CUR=pl||null;P=pl?G.nations[pl.nation]:null;}
function playerById(id){return G.players.find(p=>p.id===id);}
function playerOf(n){return n&&n.isPlayer?G.players.find(p=>p.nation===n.id&&!p.over):null;}
const DUMMY_LEDGER=blankLedger();
function ledgerOf(n){const pl=playerOf(n);return pl?pl.ledgerCur:DUMMY_LEDGER;}
function activePlayers(){return G.players.filter(p=>!p.over);}
function dateStr(){return MONTHS[G.month]+' '+G.year;}
function newsTo(pl,text,type){if(!pl)return;pl.news.unshift({t:dateStr(),text,type:type||''});if(pl.news.length>70)pl.news.pop();}
function news(text,type){newsTo(CUR,text,type);}
function newsAll(text,type){G.players.forEach(pl=>newsTo(pl,text,type));}
function flashTo(pl,f){if(!pl)return;pl.flash=f;pl.flashSeq=(pl.flashSeq||0)+1;}

/* ================= NATION MODEL ================= */
function buildNation(def,isPlayer,trait){
 const pf=Math.sqrt(def.pop)/2,scale=1+pf/8;
 const n={id:0,name:def.name,flag:def.flag,lat:def.lat,lon:def.lon,pop:def.pop,pf,isPlayer,ind:{},dep:{},stock:{},money:0,happy:60,tax:0.15,rels:{},embs:{},
  trait:trait||{id:'none',prod:{}},lastProd:{},lastUse:{},lastCons:{},lastNeedRatio:{},gdp:0,lowHappy:0,str:def.s};
 IDS.forEach(id=>{
  const s=def.s[id]||0;
  let lvl=s>0?Math.max(1,Math.round(s*scale*rand(0.8,1.2))):0;
  if(isPlayer){lvl=Math.max(0,lvl+randi(-1,1));if(lvl===0&&!DEPOSIT.includes(id)&&Math.random()<0.3)lvl=randi(1,2);}
  n.ind[id]=lvl;
  if(DEPOSIT.includes(id))n.dep[id]=s>0||(isPlayer&&Math.random()<0.2);
  n.stock[id]=0;
 });
 if(trait&&trait.dep)trait.dep.forEach(d=>{n.dep[d]=true;if(n.ind[d]<2)n.ind[d]=2;});
 DEPOSIT.forEach(d=>{if(!n.dep[d])n.ind[d]=0;});
 n.money=isPlayer?randi(4000,8000):Math.round(pf*900*rand(0.7,1.3));
 n.army=isPlayer?Math.round(pf*3+6):Math.round((pf*5+5)*rand(0.85,1.15));
 if(isPlayer&&trait&&trait.id==='content')n.happy=70;
 return n;
}
function prodMult(n,id){let m=(n.trait.prod&&n.trait.prod[id])||1;if(G)G.mods.forEach(md=>{if(md.kind==='prod'&&(md.res===id||md.res==='*')&&md.target===n.id)m*=md.mult;});if(n.gov)m*=outMult(n)*techResMult(n,id);return m;}
function capacity(n,id){return n.ind[id]*outPer(id)*prodMult(n,id);}
function usage(n,id){let u=needAmt(n,id);for(const k in RECIPE)if(RECIPE[k][id])u+=capacity(n,k)*inputAmt(n,k,id);return u;}
function eachDeal(fn){if(G)G.players.forEach(pl=>{if(!pl.over)pl.deals.forEach((d,i)=>fn(pl,d,i));});}
function outFlow(n,id){let f=0;eachDeal((pl,d)=>{if(pl.nation===n.id&&d.pGive.item===id)f+=d.pGive.qty;if(d.partner===n.id&&d.pGet.item===id)f+=d.pGet.qty;});return f;}
function inFlow(n,id){let f=0;eachDeal((pl,d)=>{if(pl.nation===n.id&&d.pGet.item===id)f+=d.pGet.qty;if(d.partner===n.id&&d.pGive.item===id)f+=d.pGive.qty;});return f;}
function netOf(n,id){return capacity(n,id)-usage(n,id)+inFlow(n,id)-outFlow(n,id);}
function reserveOf(n,id,months){return(usage(n,id)+outFlow(n,id))*months;}
function status(n,id){const net=netOf(n,id);const sc=Math.max(capacity(n,id),usage(n,id),5);if(net>Math.max(3,sc*0.15))return'surplus';if(net<-Math.max(1.5,sc*0.05))return'need';return'neutral';}
function levelUpkeep(n,id){return(outPer(id)*R[id].base*0.42+5)*(n.trait.id==='frugal'?0.85:1);}
function utilOf(n,id){const c=capacity(n,id);if(c<=0||!n.lastProd||n.lastProd[id]==null)return 1;return clamp(n.lastProd[id]/c,0,1);}
function upkeep(n){let u=0;IDS.forEach(id=>u+=n.ind[id]*levelUpkeep(n,id)*(0.4+0.6*utilOf(n,id)));return u*upkeepMult(n);}
function taxMult(){let m=1;G.mods.forEach(md=>{if(md.kind==='tax')m*=md.mult;});return m;}
function taxIncome(n){return n.pf*110*(n.tax/0.15)*(0.4+n.happy/100)*taxMult()*taxGovMult(n);}
function calcGdp(n){let v=0;IDS.forEach(id=>v+=(n.lastProd[id]||0)*M.price[id]);v+=n.pf*150*(0.5+n.happy/100);return v*12;}
function buildCost(n,id){const L=n.ind[id],b=R[id].base;let money=(500+b*40)*(1+L*0.4),steel=4+L*1.5,lumber=6+L*1.5;if(n.trait.id==='builder'){money*=0.75;steel*=0.75;lumber*=0.75;}if(n.gov)money*=1-(n.gov.infra-50)/300;return{money:Math.round(money),steel:Math.round(steel),lumber:Math.round(lumber)};}
function ranking(){return[...G.nations].sort((a,b)=>b.gdp-a.gdp);}
function rankOf(n){return ranking().indexOf(n)+1;}
function relWord(r){return r>=60?'Allied':r>=30?'Friendly':r>=10?'Cordial':r>-10?'Neutral':r>-40?'Cool':r>-70?'Hostile':'Enemy';}

/* ================= SETUP ================= */
function rollNation(excludeIdx){
 const opts=COUNTRIES.map((c,i)=>i).filter(i=>!excludeIdx.includes(i));
 const idx=pick(opts),trait=pick(TRAITS);
 const nation=buildNation(COUNTRIES[idx],true,trait);nation.gov=makeGov();
 return{idx,trait,nation};
}
// specs: [{id,name,pick:{idx,nation}}]
function newGame(specs){
 const nations=[],players=[];
 specs.forEach((s,i)=>{nations.push(s.pick.nation);});
 const taken=specs.map(s=>s.pick.idx);
 COUNTRIES.forEach((def,i)=>{if(!taken.includes(i))nations.push(buildNation(def,false,null));});
 nations.forEach((n,i)=>n.id=i);
 specs.forEach((s,i)=>{
  const pl={id:s.id,name:s.name,color:PLAYER_COLORS[i%PLAYER_COLORS.length],nation:i,deals:[],offer:null,war:null,ledgerCur:blankLedger(),lastLedger:blankLedger(),
   autoSell:{},autoBuy:{},news:[],flash:null,flashSeq:0,won:false,over:false,endShown:false,startGdp:0,target:0,goalMult:1,hist:[],lastVote:0,requests:[],invOffer:null};
  IDS.forEach(id=>{pl.autoSell[id]=true;pl.autoBuy[id]=true;});
  players.push(pl);
  nations[i].owner=s.id;
 });
 G={v:4,turn:0,month:0,year:START_YEAR,nations,players,mods:[],market:null,reqSeq:1};
 useGame(G);
 G.nations.forEach(n=>IDS.forEach(id=>{n.stock[id]=Math.round(reserveOf(n,id,2)*(n.isPlayer?1.6:rand(0.9,1.2))+(n.isPlayer?8:3));}));
 initMarket();
 players.forEach(pl=>{const me=G.nations[pl.nation];G.nations.forEach(n=>{if(!n.isPlayer)n.rels[pl.nation]=randi(-20,25)+(me.trait.id==='diplomat'?25:0);});});
 G.nations.forEach(n=>{IDS.forEach(id=>n.lastProd[id]=capacity(n,id));for(const k in NEED)n.lastNeedRatio[k]=1;n.gdp=calcGdp(n);});
 initGlobal();
 players.forEach(pl=>{const me=G.nations[pl.nation];G.nations.forEach(n=>{if(!n.isPlayer&&sameBloc(n,me))n.rels[pl.nation]+=10;});});
 players.forEach(pl=>{
  setCtx(pl);
  G.startGdp=P.gdp;G.goalMult=Math.round(clamp(1.4+200/(P.gdp/1000),1.5,5)*10)/10;G.target=Math.round(P.gdp*G.goalMult);
  news(`You now lead ${P.name}. Grow your GDP ${G.goalMult}× to ${fmtMoney(G.target)} by the end of ${START_YEAR+9}!`,'gold');
  news(`Your national trait: ${P.trait.name} — ${P.trait.desc}.`,'info');
  if(blocOf(P))news(`${P.name} is a member of the ${blocOf(P).name}: free trade and mutual defense with its members.`,'info');
  if(players.length>1)news(`Rival leaders in this world: ${players.filter(o=>o!==pl).map(o=>`${o.name} (${G.nations[o.nation].name})`).join(', ')}.`,'info');
  G.hist.push({gdp:P.gdp,money:P.money,rank:rankOf(P)});
 });
 setCtx(null);
 return G;
}
function initMarket(){
 M=G.market={price:{},close:{},hist:{},depth:{},extBuy:{},extSell:{},buy:{},sell:{},pBuy:{},pSell:{}};
 IDS.forEach(id=>{
  let cap=0,use=0;G.nations.forEach(n=>{cap+=capacity(n,id);use+=usage(n,id);});
  const p=R[id].base*rand(0.9,1.1);
  M.price[id]=p;M.close[id]=p;M.hist[id]=[p];M.depth[id]=Math.max(40,cap);
  M.extBuy[id]=Math.max(0,cap-use)+cap*0.1+5;M.extSell[id]=Math.max(0,use-cap)+cap*0.1+5;
  M.buy[id]=0;M.sell[id]=0;M.pBuy[id]=0;M.pSell[id]=0;
 });
}

/* ================= SIMULATION ================= */
function produce(n){
 n.lastProd={};n.lastUse={};
 IDS.forEach(id=>{
  const cap=capacity(n,id)*rand(0.94,1.06);let o=cap;const rec=RECIPE[id];
  if(rec&&cap>0){let ratio=1;for(const k in rec)ratio=Math.min(ratio,n.stock[k]/(cap*inputAmt(n,id,k)));ratio=clamp(ratio,0,1);o=cap*ratio;
   for(const k in rec){const a=o*inputAmt(n,id,k);n.stock[k]=Math.max(0,n.stock[k]-a);n.lastUse[k]=(n.lastUse[k]||0)+a;}}
  n.stock[id]+=o;n.lastProd[id]=o;
 });
}
function consume(n){
 let target=-2;const L=ledgerOf(n);
 for(const k in NEED){const want=needAmt(n,k),take=Math.min(want,n.stock[k]);n.stock[k]-=take;n.lastCons[k]=take;const rev=take*M.price[k]*0.5;n.money+=rev;L.domestic+=rev;const r=want>0?take/want:1;n.lastNeedRatio[k]=r;target+=HAPPY_W[k]*r;}
 target-=(n.tax-0.15)*120;
 target+=govHappy(n);
 const pl=playerOf(n);if(pl&&pl.war)target-=8;
 if(n.trait.id==='content')target+=10;
 n.happy+=(clamp(target,0,100)-n.happy)*0.25;
}
function fee(){let f=0.04;if(P.trait.id==='hub')f/=2;G.mods.forEach(m=>{if(m.kind==='fee')f+=m.add;});if(hasTech(P,'logi'))f-=0.015;if(P.gov&&P.gov.pol.econ===0)f-=0.01;if(P.wto)f-=0.01;if(G.blocs&&blocOf(P))f-=0.01;return Math.max(0.005,f);}
function quote(id,q,side){const p=M.price[id],d=M.depth[id];if(side==='buy')return q*p*(1+q/d*0.15)*(1+fee());return q*p*Math.max(0.5,1-q/d*0.15)*(1-fee())*(1-exportPenalty(P));}
function execBuy(id,q,L){const c=quote(id,q,'buy');P.money-=c;P.stock[id]+=q;L.purchases-=c;M.price[id]=Math.min(R[id].base*5,M.price[id]*(1+q/M.depth[id]*0.3));M.pBuy[id]+=q;return c;}
function execSell(id,q,L){const c=quote(id,q,'sell');P.money+=c;P.stock[id]-=q;L.sales+=c;M.price[id]=Math.max(R[id].base*0.25,M.price[id]*Math.max(0.5,1-q/M.depth[id]*0.3));M.pSell[id]+=q;return c;}
function maxAfford(id,q){q=Math.floor(q);while(q>0&&quote(id,q,'buy')>P.money)q=Math.floor(q*0.85);return q;}

function runDeals(L){
 G.deals=G.deals.filter(d=>{
  const a=G.nations[d.partner],apl=playerOf(a),AL=ledgerOf(a);let ok=true;
  if(d.pGive.item==='money'){if(P.money>=d.pGive.qty){P.money-=d.pGive.qty;a.money+=d.pGive.qty;L.dealsOut-=d.pGive.qty;AL.dealsIn+=d.pGive.qty;}else ok=false;}
  else{if(P.stock[d.pGive.item]>=d.pGive.qty-0.01){P.stock[d.pGive.item]=Math.max(0,P.stock[d.pGive.item]-d.pGive.qty);a.stock[d.pGive.item]+=d.pGive.qty;}else ok=false;}
  if(!ok){d.misses++;a.rel-=12;
   if(d.misses>=2){a.rel-=10;news(`Deal with ${a.name} collapsed after missed deliveries.`,'bad');newsTo(apl,`${P.name} failed to deliver twice; your deal with them collapsed.`,'bad');return false;}
   news(`You missed a delivery to ${a.name}! Relations damaged.`,'bad');newsTo(apl,`${P.name} missed a delivery to you.`,'bad');}
  else{
   if(d.pGet.item==='money'){const q=apl?Math.max(0,Math.min(d.pGet.qty,a.money)):d.pGet.qty;a.money-=q;P.money+=q;L.dealsIn+=q;AL.dealsOut-=q;if(apl&&q<d.pGet.qty)newsTo(apl,`You could not fully pay ${P.name} this month.`,'bad');}
   else{const q=Math.min(d.pGet.qty,a.stock[d.pGet.item]);a.stock[d.pGet.item]-=q;P.stock[d.pGet.item]+=q;
    if(q<d.pGet.qty*0.9){news(`${a.name} could only deliver ${fmtN(q)}/${fmtN(d.pGet.qty)} ${R[d.pGet.item].name}.`,'info');newsTo(apl,`You could only deliver ${fmtN(q)} of ${fmtN(d.pGet.qty)} ${R[d.pGet.item].name} to ${P.name}.`,'bad');}}
   a.rel=Math.min(100,a.rel+1);
  }
  d.left--;
  if(d.left<=0){a.rel=Math.min(100,a.rel+4);news(`Trade deal with ${a.name} completed successfully.`,'good');newsTo(apl,`Your trade deal with ${P.name} completed.`,'good');return false;}
  return true;
 });
}
function autoBuy(L){IDS.forEach(id=>{if(!G.autoBuy[id])return;const short=reserveOf(P,id,1.5)-P.stock[id];if(short>0.5){const q=maxAfford(id,Math.ceil(short));if(q>0)execBuy(id,q,L);}});}
function autoSell(L){IDS.forEach(id=>{if(!G.autoSell[id])return;let keep=reserveOf(P,id,2);if(id==='steel'||id==='lumber')keep+=25;const ex=Math.floor(P.stock[id]-keep);if(ex>=1)execSell(id,ex,L);});}
function aiTrade(a){
 IDS.forEach(id=>{
  const res=reserveOf(a,id,2)+(id==='gold'?a.pf*2:0),st=a.stock[id],p=M.price[id];
  if(st>res*1.3+2){const q=(st-res)*0.6;a.stock[id]-=q;a.money+=q*p*0.97;M.sell[id]+=q;}
  else if(st<res){let q=(res-st)*0.6;const unit=p*1.03;if(q*unit>a.money*0.8)q=Math.max(0,a.money*0.8/unit);if(q>0){a.stock[id]+=q;a.money-=q*unit;M.buy[id]+=q;}}
 });
}
function priceMult(id){let m=1;G.mods.forEach(md=>{if(md.kind==='price'&&(md.res===id||md.res==='*'))m*=md.mult;});return m;}
function updateMarket(){
 IDS.forEach(id=>{
  const b=M.buy[id]+M.pBuy[id],s=M.sell[id]+M.pSell[id];
  const imb=(b-s)/(b+s+M.depth[id]*0.3);
  let p=M.price[id];p*=1+0.3*imb;
  const tgt=R[id].base*priceMult(id);p+=(tgt-p)*0.1;
  p*=1+(Math.random()-0.5)*0.05;
  p=clamp(p,R[id].base*0.25,R[id].base*5);
  M.close[id]=M.price[id];M.price[id]=p;M.hist[id].push(p);if(M.hist[id].length>36)M.hist[id].shift();
  M.extBuy[id]*=1.004;M.pBuy[id]=0;M.pSell[id]=0;
 });
}
function aiDevelop(a){
 if(Math.random()>0.06)return;
 const opts=IDS.filter(id=>!DEPOSIT.includes(id)||a.dep[id]);
 const c=wpick(opts.map(id=>({id,w:Math.pow(M.price[id]/R[id].base,2)*(1+(a.ind[id]>0?1:0)+(a.str[id]||0)*0.5+(status(a,id)==='need'?1:0))})));
 const cost=buildCost(a,c.id);
 if(a.money>cost.money*2.5){a.money-=cost.money;a.ind[c.id]++;}
}
function addMod(m){G.mods.push(m);}
// personal events run in a player's context
const EVENTS=[
 {w:3,f(){addMod({kind:'prod',res:'grain',target:P.id,mult:0.6,months:3,label:'Drought: your grain −40%'});return[`A severe drought hits ${P.name}. Grain output −40% for 3 months.`,'bad'];}},
 {w:3,f(){addMod({kind:'prod',res:'grain',target:P.id,mult:1.5,months:2,label:'Bumper harvest: your grain +50%'});return[`Perfect weather! Bumper harvest in ${P.name}: grain +50% for 2 months.`,'good'];}},
 {w:2,f(){const o=IDS.filter(id=>P.ind[id]>0);if(!o.length)return null;const id=pick(o);addMod({kind:'prod',res:id,target:P.id,mult:0,months:2,label:`${R[id].name} workers on strike`});return[`${R[id].name} workers in ${P.name} go on strike! Output halted for 2 months.`,'bad'];}},
 {w:1,f(){const o=IDS.filter(id=>P.ind[id]>1);if(!o.length)return null;const id=pick(o);P.ind[id]--;return[`A fire destroys a ${R[id].name} facility. Industry level −1.`,'bad'];}},
 {w:2,f(){G.nations.forEach(n=>{if(!n.isPlayer)n.rel=Math.min(100,n.rel+8);});return['A trade summit improves your relations with every nation (+8).','good'];}},
 {w:2,f(){const v=randi(1500,4000);P.money+=v;G.ledgerCur.other+=v;return[`Foreign investors pour ${fmtMoney(v)} into ${P.name}.`,'good'];}},
 {w:1.2,f(){const o=DEPOSIT.filter(d=>!P.dep[d]);if(o.length){const d=pick(o);P.dep[d]=true;return[`Geologists discover ${R[d].name} deposits in ${P.name}! You can now build ${R[d].name} industry.`,'gold'];}const d=pick(DEPOSIT);P.ind[d]++;return[`A rich new ${R[d].name} field is found: +1 ${R[d].name} level!`,'gold'];}},
 {w:2,f(){const a=pick(G.nations.filter(n=>!n.isPlayer));a.rel-=12;return[`A trade dispute sours relations with ${a.name} (−12).`,'bad'];}},
 {w:1,f(){P.pop*=1.03;P.pf=Math.sqrt(P.pop)/2;return[`A baby boom! ${P.name}'s population grows 3%.`,'good'];}},
];
// world events hit everyone
const WORLD_EVENTS=[
 {w:2,f(){addMod({kind:'price',res:'oil',mult:1.7,months:4,label:'Oil crisis'});return['Major producers slash output — world oil prices are soaring!','info'];}},
 {w:2,f(){addMod({kind:'price',res:'electronics',mult:1.45,months:4,label:'Tech boom'});return['A global tech boom sends electronics prices up!','info'];}},
 {w:1.5,f(){addMod({kind:'price',res:'cars',mult:1.35,months:4,label:'Car demand surge'});return['Consumers worldwide are buying cars — prices rising.','info'];}},
 {w:1.5,f(){addMod({kind:'price',res:'gold',mult:1.5,months:3,label:'Safe-haven gold rush'});return['Investors flee to safety — gold prices spike!','info'];}},
 {w:1.5,f(){addMod({kind:'price',res:'lumber',mult:1.5,months:3,label:'Construction boom'});return['A global construction boom drives lumber prices up.','info'];}},
 {w:1.2,f(){addMod({kind:'price',res:'grain',mult:1.5,months:3,label:'Global food shortage'});return['Crop failures abroad — grain prices jump worldwide.','info'];}},
 {w:1.2,f(){addMod({kind:'price',res:'*',mult:0.8,months:6,label:'Global recession (prices −20%)'});addMod({kind:'tax',mult:0.8,months:6,label:'Recession: tax income −20%'});return['A global recession begins. Prices and tax revenue are falling.','bad'];}},
 {w:2,f(){addMod({kind:'fee',add:0.05,months:3,label:'Shipping disruption (+5% fees)'});return['Canal blockage! Market fees +5% for 3 months.','bad'];}},
 {w:1.5,f(){const a=pick(G.nations.filter(n=>!n.isPlayer));const id=pick(IDS.filter(x=>!DEPOSIT.includes(x)||a.dep[x]));a.ind[id]+=2;return[`${a.name} opens huge new ${R[id].name} plants.`,'info'];}},
];
function fireEvent(){const r=wpick(EVENTS).f();if(r)news(r[0],r[1]);}
function fireWorldEvent(){const r=wpick(WORLD_EVENTS).f();if(r)newsAll(r[0],r[1]);}

function genOffer(){
 const cands=G.nations.filter(n=>!n.isPlayer&&!n.embargo&&n.rel>-30&&G.deals.filter(d=>d.partner===n.id).length<3);
 if(!cands.length)return;
 const a=pick(cands);
 const aSur=IDS.filter(id=>status(a,id)==='surplus');if(!aSur.length)return;
 const pNeed=IDS.filter(id=>status(P,id)==='need');
 const get=aSur.find(id=>pNeed.includes(id))||pick(aSur);
 const qGet=Math.max(3,Math.round(Math.min(netOf(a,get)*0.6,40)));
 const val=qGet*M.price[get];
 const aNeed=IDS.filter(id=>status(a,id)==='need'&&id!==get);
 const pSur=IDS.filter(id=>status(P,id)==='surplus');
 const want=aNeed.find(id=>pSur.includes(id));
 const fair=rand(0.8,1.15);
 const pGive=want?{item:want,qty:Math.max(1,Math.round(val*fair/M.price[want]))}:{item:'money',qty:Math.max(20,Math.round(val*fair*0.95))};
 G.offer={partner:a.id,pGive,pGet:{item:get,qty:qGet},months:pick([3,6,6,12])};
 news(`${a.name} has proposed a trade deal. See the Trade tab.`,'gold');
}

function retire(pl,why){
 pl.over=true;const n=G.nations[pl.nation];n.isPlayer=false;
 const w=pl.war;if(w&&w.human){const epl=playerOf(G.nations[w.enemy]);if(epl&&epl.war&&epl.war.enemy===n.id){epl.war=null;newsTo(epl,`The war with ${n.name} ends: its government has fallen.`,'info');}}
 pl.war=null;pl.deals=[];pl.offer=null;pl.requests=[];
 G.players.forEach(o=>{if(o!==pl){o.deals=o.deals.filter(d=>d.partner!==n.id);if(!o.over)newsTo(o,`${pl.name}'s government in ${n.name} has fallen (${why}). The country is now run by the computer.`,'info');}});
}

function step(){
 const humans=activePlayers();
 humans.forEach(pl=>{pl.flash=null;});
 G.nations.forEach(produce);
 humans.forEach(pl=>{setCtx(pl);runDeals(pl.ledgerCur);autoBuy(pl.ledgerCur);});
 setCtx(null);
 G.nations.forEach(consume);
 G.nations.forEach(n=>{const L=ledgerOf(n),t=taxIncome(n),u=upkeep(n);n.money+=t-u;L.taxes+=t;L.upkeep-=u;});
 G.nations.forEach(n=>{const L=ledgerOf(n),c=n.army*ARMY_UPKEEP*(n.gov&&n.gov.pol.draft?0.7:1)*(!n.isPlayer&&n.money<0?0.3:1);n.money-=c;L.military-=c;});
 G.nations.forEach(n=>{const L=ledgerOf(n),c=budgetCost(n);n.money-=c;L.budget-=c;});
 humans.forEach(pl=>{const n=G.nations[pl.nation];if(n.money<0){const i=n.money*0.02;n.money+=i;pl.ledgerCur.interest+=i;}});
 IDS.forEach(id=>{M.buy[id]=M.extBuy[id];M.sell[id]=M.extSell[id];});
 G.nations.forEach(n=>{if(!n.isPlayer)aiTrade(n);});
 humans.forEach(pl=>{setCtx(pl);autoSell(pl.ledgerCur);});
 setCtx(null);
 updateMarket();
 G.nations.forEach(n=>{
  if(!n.isPlayer){aiDevelop(n);const t=n.pf*5+5+n.gdp/40000;n.army+=(t-n.army)*0.04;}
  n.pop*=1+0.0006*(n.happy-45)/10+(n.gov?(n.gov.health-50)*0.00003+(hasTech(n,'med')?0.0003:0)+[-0.0005,0,0.001][n.gov.pol.imm]:0);n.pf=Math.sqrt(n.pop)/2;
 });
 humans.forEach(pl=>{setCtx(pl);G.nations.forEach(n=>{if(!n.isPlayer){n.rel+=(relTarget(n)-n.rel)*0.02;n.rel=clamp(n.rel,-100,100);}});warMonth();govMonth(pl.ledgerCur);});
 setCtx(null);
 G.mods.forEach(m=>m.months--);
 G.mods.filter(m=>m.months<=0).forEach(m=>{if(m.target!=null)newsTo(playerOf(G.nations[m.target]),`Effect ended: ${m.label}`,'info');else newsAll(`Effect ended: ${m.label}`,'info');});
 G.mods=G.mods.filter(m=>m.months>0);
 humans.forEach(pl=>{setCtx(pl);
  if(G.offer){G.nations[G.offer.partner].rel-=1;G.offer=null;}
  if(Math.random()<0.16)fireEvent();
  if(Math.random()<0.3)genOffer();
 });
 setCtx(null);
 if(Math.random()<0.12)fireWorldEvent();
 G.nations.forEach(n=>n.gdp=calcGdp(n));
 globalMonth();
 humans.forEach(pl=>{setCtx(pl);globalPlayerMonth(pl.ledgerCur);});
 humans.forEach(pl=>{setCtx(pl);G.hist.push({gdp:P.gdp,money:P.money,rank:rankOf(P)});G.lastLedger=G.ledgerCur;G.ledgerCur=blankLedger();});
 setCtx(null);
 G.turn++;G.month++;if(G.month>11){G.month=0;G.year++;humans.forEach(pl=>{setCtx(pl);news(`Happy New Year ${G.year}! You rank #${rankOf(P)} in the world.`,'info');});}
 humans.forEach(pl=>{setCtx(pl);
  const short=Object.keys(NEED).filter(k=>P.lastNeedRatio[k]<0.7);
  if(short.length)news(`Shortages of ${short.map(k=>R[k].name).join(', ')} are angering citizens.`,'bad');
  if(P.money<0)news(`Treasury in debt (${fmtMoney(P.money)}). Paying 2% interest monthly! Raise taxes, trim the budget in Nation, or downsize idle industries in Business.`,'bad');
  if(G.over){}
  else if(P.money<-15000){G.over=true;G.flash='bankrupt';}
  else if(P.gov.lowStab>=3){G.over=true;G.flash='revolution';}
  else if(!G.won&&P.gdp>=G.target){G.won=true;G.flash='won';news('GOAL REACHED! Your nation is an economic powerhouse!','gold');}
  else if(G.turn>=END_TURN&&!G.endShown){G.endShown=true;G.flash='end';}
  if(G.flash)pl.flashSeq=(pl.flashSeq||0)+1;
 });
 setCtx(null);
 humans.forEach(pl=>{if(pl.over)retire(pl,{bankrupt:'bankruptcy',revolution:'revolution',voted_out:'lost an election',coup:'military coup'}[pl.flash]||'collapse');});
}

/* ================= WAR ================= */
const ARMY_UPKEEP=12,RECRUIT_COST=120;
const OUTCOMES={stale:{label:'Stalemate',color:'#F8D5B0'},loss:{label:'Defeat',color:'#F3B7B5'},win:{label:'Victory',color:'#ECB4F5'},major:{label:'Major win',color:'#B3BAF5'}};
const OUT_ORDER=['stale','loss','win','major'];
function armyStrength(n){return n.army*(hasTech(n,'doctrine')?1.25:1);}
function battleOdds(e){const pa=armyStrength(P)*blocBoost(P,e);const r=pa/(pa+Math.max(1,armyStrength(e)*blocBoost(e,P)));const w={stale:0.22,loss:0.95*(1-r),win:0.75*r,major:0.56*r*r};const t=w.stale+w.loss+w.win+w.major;for(const k in w)w[k]/=t;return w;}
function rollOutcome(w){let x=Math.random();for(const k of OUT_ORDER){x-=w[k];if(x<=0)return k;}return'stale';}
function battleCost(){return Math.round(200+P.army*5);}
function enemyWar(e){const epl=playerOf(e);return epl&&epl.war&&epl.war.enemy===P.id?epl.war:null;}
function lootFrom(e,frac,cap){
 const m=Math.min(Math.max(0,e.money)*frac,cap);e.money-=m;P.money+=m;G.ledgerCur.war+=m;ledgerOf(e).war-=m;
 let best=null,bv=0;IDS.forEach(id=>{const v=e.stock[id]*M.price[id];if(v>bv){bv=v;best=id;}});
 let res='';if(best){const q=Math.floor(e.stock[best]*frac*5);if(q>0){e.stock[best]-=q;P.stock[best]+=q;res=` and ${q} ${R[best].name}`;}}
 return fmtMoney(m)+res;
}
function checkWarEnd(){
 const w=G.war;if(!w)return'';const e=G.nations[w.enemy],epl=playerOf(e);
 const bestInd=n=>IDS.filter(id=>n.ind[id]>0).sort((a,b)=>n.ind[b]*R[b].base-n.ind[a]*R[a].base)[0];
 if(w.score>=100){
  P.gov.prestige+=20;
  const rep=Math.min(Math.max(0,e.money)*0.25,20000);e.money-=rep;P.money+=rep;G.ledgerCur.war+=rep;ledgerOf(e).war-=rep;
  const id=bestInd(e);let ann='';if(id){e.ind[id]--;P.ind[id]++;if(DEPOSIT.includes(id))P.dep[id]=true;ann=` and annex a ${R[id].name} region (+1 level)`;}
  e.rel=-50;G.war=null;const t=`${e.name} surrenders! You receive ${fmtMoney(rep)} in reparations${ann}.`;news(t,'gold');
  if(epl){epl.war=null;if(e.gov)e.gov.prestige-=10;newsTo(epl,`You surrendered to ${P.name}. You paid ${fmtMoney(rep)}${id?` and lost a ${R[id].name} region`:''}.`,'bad');flashTo(epl,'war_lost');}
  return' '+t;
 }
 if(w.score<=-100){
  const pay=Math.max(500,Math.max(0,P.money)*0.2);P.money-=pay;e.money+=pay;G.ledgerCur.war-=pay;ledgerOf(e).war+=pay;
  const id=bestInd(P);let lost='';if(id){P.ind[id]--;e.ind[id]++;lost=` and lose a ${R[id].name} region`;}
  P.happy=Math.max(0,P.happy-10);e.rel=-40;G.war=null;const t=`You lost the war against ${e.name}. You pay ${fmtMoney(pay)}${lost}.`;news(t,'bad');
  if(epl){epl.war=null;if(e.gov)e.gov.prestige+=20;newsTo(epl,`${P.name} surrenders! You receive ${fmtMoney(pay)}${id?` and annex a ${R[id].name} region`:''}.`,'gold');flashTo(epl,'war_won');}
  return' '+t;
 }
 return'';
}
function applyBattle(k,e){
 const w=G.war,ew=enemyWar(e),before=w.score;let msg;
 if(k==='major'){e.army*=0.72;P.army*=0.95;w.score+=35;P.gov.prestige+=4;msg=`A crushing victory! You seize ${lootFrom(e,0.06,4000)}.`;}
 else if(k==='win'){e.army*=0.85;P.army*=0.92;w.score+=20;P.gov.prestige+=2;msg=`Your forces win and capture ${lootFrom(e,0.03,2000)}.`;}
 else if(k==='stale'){e.army*=0.94;P.army*=0.94;msg='Neither side gains ground. Both armies take losses.';}
 else{P.army*=0.8;e.army*=0.97;w.score-=18;P.happy=Math.max(0,P.happy-4);msg='Your army is beaten back with heavy losses. Citizens are shaken.';}
 if(ew)ew.score-=(w.score-before);
 news(`Battle vs ${e.name}: ${OUTCOMES[k].label}. ${msg}`,k==='loss'?'bad':k==='stale'?'info':'good');
 newsTo(playerOf(e),`${P.name} attacked you: ${({major:'a crushing defeat for you',win:'you lost the battle',stale:'a bloody stalemate',loss:'your forces won!'})[k]}.`,k==='loss'?'good':'bad');
 return msg+checkWarEnd();
}
function warMonth(){
 if(G.war){
  const e=G.nations[G.war.enemy];
  if(!e.isPlayer&&Math.random()<0.45){const r=e.army/(e.army+P.army);
   if(Math.random()<r*0.85){const lost=Math.min(Math.max(0,P.money)*0.04+100,3000);P.money-=lost;G.ledgerCur.war-=lost;P.army*=0.95;G.war.score-=8;news(`${e.name} raids your territory! You lost ${fmtMoney(lost)}.`,'bad');}
   else{e.army*=0.95;G.war.score+=5;news(`Your forces repelled an attack by ${e.name}.`,'good');}
   checkWarEnd();}
 }else if(G.turn>6&&Math.random()<0.05){
  const c=G.nations.filter(a=>!a.isPlayer&&a.rel<-60&&a.army>P.army*0.9);
  if(c.length){const e=pick(c);G.war={enemy:e.id,score:0,lastBattle:-1,start:G.turn};e.embargo=true;e.rel=-100;G.deals=G.deals.filter(d=>d.partner!==e.id);
   if(G.offer&&G.offer.partner===e.id)G.offer=null;
   news(`${e.name} has declared war on you! Defend yourself in the Wars tab.`,'bad');G.flash=G.flash||'attacked';}
 }
}
/* ================= GOVERNMENT (logic) ================= */
const MINISTRIES=[
 {id:'health',name:'Health',desc:'Health, population growth, happiness'},
 {id:'edu',name:'Education',desc:'Productivity, tax efficiency, research speed'},
 {id:'infra',name:'Infrastructure',desc:'Productivity, cheaper upkeep and construction'},
 {id:'security',name:'Security',desc:'Stability, fights corruption'},
 {id:'welfare',name:'Welfare',desc:'Happiness, keeps workers on side'},
 {id:'research',name:'Research',desc:'Research points for new technology'},
 {id:'culture',name:'Culture',desc:'Soft power: tourism income, better relations abroad'},
];
const LEVELS=['Off','Low','Std','High','Max'],LVL_MULT=[0,0.5,1,1.7,2.6];
const ministryCost=(n,l)=>n.pf*30*LVL_MULT[l];
function budgetCost(n){if(!n.gov)return n.pf*180;let c=0;MINISTRIES.forEach(m=>c+=ministryCost(n,n.gov.budget[m.id]));return c;}
const POLICIES=[
 {id:'gov',name:'Government',opts:['Democracy','Autocracy'],cost:40,desc:['Elections every 4 years. More political capital and happiness.','No elections. More stability and corruption. Risk of a coup if the military turns on you.']},
 {id:'econ',name:'Economy',opts:['Free market','Mixed','State-run'],cost:15,desc:['Business loves it and market fees drop 1%. Workers are less keen.','A balance between business and workers.','Workers are happy and upkeep is 15% lower, but output drops 8% and business hates it.']},
 {id:'work',name:'Work week',opts:['35 hours','40 hours','50 hours'],cost:15,desc:['Happier people and workers, but 8% less output.','The standard week.','10% more output, but people and workers are unhappy.']},
 {id:'env',name:'Environment',opts:['Lax','Balanced','Strict'],cost:15,desc:['6% more output, but public health suffers.','Standard rules.','Better health and happiness, 5% less output. Business grumbles.']},
 {id:'imm',name:'Immigration',opts:['Closed','Selective','Open'],cost:15,desc:['Slower population growth, a little more stable.','Standard rules.','Faster population growth and business likes it, but less stable.']},
 {id:'draft',name:'Military service',opts:['Volunteer','Conscription'],cost:15,desc:['A professional army at normal cost.','Recruits cost half and army upkeep is 30% lower, but it is unpopular.']},
 {id:'press',name:'Press',opts:['Free press','State media'],cost:15,desc:['A free press keeps corruption in check.','More stability, but corruption grows unchecked.']},
];
const TECHS=[
 {id:'farm',name:'Mechanized farming',cost:30,desc:'+25% grain output'},
 {id:'logi',name:'Modern logistics',cost:35,desc:'Market fees 1.5% lower'},
 {id:'med',name:'Modern medicine',cost:40,desc:'Health +10, faster population growth'},
 {id:'refine',name:'Oil refining',cost:45,desc:'Steel uses 30% less oil'},
 {id:'doctrine',name:'Military doctrine',cost:50,desc:'Your army fights 25% stronger'},
 {id:'egov',name:'E-government',cost:55,desc:'Corruption −15, +1 political capital per month'},
 {id:'auto',name:'Industrial automation',cost:60,desc:'+10% output in every industry'},
 {id:'lean',name:'Lean manufacturing',cost:60,desc:'Industry upkeep 10% lower'},
 {id:'semi',name:'Semiconductors',cost:75,req:['auto'],desc:'+25% electronics, uses 40% less gold'},
 {id:'green',name:'Green energy',cost:80,req:['auto'],desc:'Citizens need 40% less oil, health +5'},
 {id:'ev',name:'Electric vehicles',cost:90,req:['semi'],desc:'+25% car output'},
 {id:'ai',name:'AI revolution',cost:140,req:['semi','auto'],desc:'+15% output everywhere, education +10'},
];
const hasTech=(n,t)=>!!(n&&n.gov&&n.gov.techs.includes(t));
function makeGov(){return{edu:randi(30,70),health:randi(30,70),infra:randi(30,70),stab:randi(55,72),corr:randi(15,50),pc:30,
 budget:{health:2,edu:2,infra:2,security:2,welfare:2,research:2,culture:1},pol:{gov:0,econ:1,work:1,env:1,imm:1,draft:0,press:0},
 fac:{workers:55,business:55,military:55},rp:0,research:null,techs:[],nextElection:48,campaign:0,prestige:0,lowStab:0,decision:null,decisionAge:0,recentDec:[]};}

function outMult(n){const g=n.gov;if(!g)return 1;let m=1+(g.edu-50)/250+(g.infra-50)/250;
 m*=[1,1,0.92][g.pol.econ]*[0.92,1,1.1][g.pol.work]*[1.06,1,0.95][g.pol.env];
 if(hasTech(n,'auto'))m*=1.1;if(hasTech(n,'ai'))m*=1.15;return m;}
function techResMult(n,id){let m=1;if(id==='grain'&&hasTech(n,'farm'))m*=1.25;if(id==='electronics'&&hasTech(n,'semi'))m*=1.25;if(id==='cars'&&hasTech(n,'ev'))m*=1.25;return m;}
function inputAmt(n,k,inp){let a=RECIPE[k][inp];if(k==='steel'&&inp==='oil'&&hasTech(n,'refine'))a*=0.7;if(k==='electronics'&&inp==='gold'&&hasTech(n,'semi'))a*=0.6;return a;}
function needAmt(n,k){let a=(NEED[k]||0)*n.pf;if(k==='oil'&&hasTech(n,'green'))a*=0.6;return a;}
function upkeepMult(n){const g=n.gov;if(!g)return 1;let m=1-(g.infra-50)/400;if(g.pol.econ===2)m*=0.85;if(hasTech(n,'lean'))m*=0.9;return m;}
function taxGovMult(n){const g=n.gov;if(!g)return 1;return(0.75+g.edu/200)*(1-g.corr/250);}
function govHappy(n){const g=n.gov;if(!g)return 0;return-(n.tariff||0)*20+(g.health-50)*0.12+[-8,-3,0,4,8][g.budget.welfare]+(g.pol.gov===0?4:-2)+[6,0,-8][g.pol.work]+[0,0,3][g.pol.env]+(g.pol.draft?-5:0);}
function facAvg(g){return(g.fac.workers+g.fac.business+g.fac.military)/3;}
function govTargets(n){const g=n.gov,b=g.budget;return{
 health:clamp(15+b.health*20+(hasTech(n,'med')?10:0)+(hasTech(n,'green')?5:0)+[-10,0,8][g.pol.env],0,100),
 edu:clamp(15+b.edu*20+(hasTech(n,'ai')?10:0),0,100),
 infra:clamp(15+b.infra*20,0,100),
 stab:clamp(28+b.security*8+(n.happy-50)*0.4+(facAvg(g)-50)*0.4-g.corr*0.2+(g.pol.gov===1?10:0)+(g.pol.press===1?8:0)+[5,0,-5][g.pol.imm]-(G&&G.war?5:0),0,100),
 corr:clamp(45-b.security*6+(g.pol.press===1?10:0)+(g.pol.gov===1?10:0)-(hasTech(n,'egov')?15:0)+(g.pol.econ===2?5:0),3,95)};}
function facTargets(n){const g=n.gov,b=g.budget,ar=n.army/(n.pf*5+5);return{
 workers:clamp(50+(n.tariff||0)*15+(n.happy-60)*0.6+(b.welfare-2)*5+[10,0,-15][g.pol.work]+[-10,0,15][g.pol.econ]-(g.pol.draft?10:0)+[0,0,-5][g.pol.imm]-(g.pol.gov===1?10:0),0,100),
 business:clamp(50+(n.tariff||0)*40-(n.tax-0.15)*150+[20,0,-20][g.pol.econ]+[-10,0,10][g.pol.work]+[8,0,-8][g.pol.env]+(g.infra-50)*0.3+[-5,0,8][g.pol.imm]-g.corr*0.1,0,100),
 military:clamp(45+clamp((ar-1)*30,-30,25)+(b.security-2)*3+(g.pol.draft?15:0)+(g.pol.gov===1?10:0)+g.prestige,0,100)};}
function pcGain(n){const g=n.gov;return 1+(g.stab-50)/25+(g.pol.gov===0?1:0)+(hasTech(n,'egov')?1:0);}
function rpGain(n){const g=n.gov;return[0,2,4,6.5,9][g.budget.research]*(0.5+g.edu/100)+(G&&G.invest?spillover(n):0);}
function voteShare(n){const g=n.gov;return clamp(25+n.happy*0.3+g.stab*0.25+(facAvg(g)-50)*0.15+g.campaign,0,100);}
function clampGov(){const g=P.gov;['edu','health','infra','stab','corr','pc'].forEach(k=>g[k]=clamp(g[k],0,100));for(const k in g.fac)g.fac[k]=clamp(g.fac[k],0,100);P.happy=clamp(P.happy,0,100);}

const DILEMMAS=[
 {id:'teachers',title:'Teachers on strike',text:'Teachers have walked out of schools demanding a pay rise.',opts:[
  {l:'Raise their pay',cost:n=>n.pf*90,d:'Education +5, workers +5',f:g=>{g.edu+=5;g.fac.workers+=5;}},
  {l:'Refuse',d:'Education −6, workers −8',f:g=>{g.edu-=6;g.fac.workers-=8;}}]},
 {id:'scandal',title:'Corruption scandal',text:'Journalists reveal ministers taking bribes from contractors.',opts:[
  {l:'Launch an investigation',pc:10,d:'Corruption −12, stability −6',f:g=>{g.corr-=12;g.stab-=6;}},
  {l:'Cover it up',d:'Corruption +10, political capital +5',f:g=>{g.corr+=10;g.pc+=5;}}]},
 {id:'flood',title:'Major flooding',text:'Heavy rains flood several cities, destroying homes and roads.',opts:[
  {l:'Full disaster relief',cost:n=>n.pf*140,d:'Happiness +5, stability +5',f:g=>{P.happy+=5;g.stab+=5;}},
  {l:'Minimal response',d:'Happiness −8, infrastructure −5',f:g=>{P.happy-=8;g.infra-=5;}}]},
 {id:'tech',title:'Tech giant wants a tax break',text:'A global tech company will build a huge factory here, if it pays no tax.',opts:[
  {l:'Grant the tax break',d:'+1 electronics level, business +10, workers −5',f:g=>{P.ind.electronics++;g.fac.business+=10;g.fac.workers-=5;}},
  {l:'Decline',d:'Business −8',f:g=>{g.fac.business-=8;}}]},
 {id:'epidemic',title:'Epidemic outbreak',text:'A fast-spreading virus is filling hospitals.',opts:[
  {l:'Order a lockdown',d:'Output −20% for 2 months, health +6, happiness −4',f:g=>{addMod({kind:'prod',res:'*',target:P.id,mult:0.8,months:2,label:'Lockdown (output −20%)'});g.health+=6;P.happy-=4;}},
  {l:'Stay open',d:'Health −12, population −1%',f:g=>{g.health-=12;P.pop*=0.99;}}]},
 {id:'union',title:'Unions demand a shorter week',text:'The largest unions want a 35-hour work week.',opts:[
  {l:'Agree to 35 hours',d:'Work week becomes 35h, workers +10, business −8',f:g=>{g.pol.work=0;g.fac.workers+=10;g.fac.business-=8;}},
  {l:'Refuse',d:'Workers −12',f:g=>{g.fac.workers-=12;}}]},
 {id:'generals',title:'Generals want more funding',text:'Top commanders say the army is underfunded and outdated.',opts:[
  {l:'Approve new funding',cost:n=>n.pf*100,d:'More army units, military +15',f:g=>{P.army+=Math.round(P.pf*2+4);g.fac.military+=15;}},
  {l:'Refuse',d:'Military −15',f:g=>{g.fac.military-=15;}}]},
 {id:'uni',title:'University partnership',text:'Top foreign universities offer to open campuses here.',opts:[
  {l:'Fund the campuses',cost:n=>n.pf*80,d:'Education +8',f:g=>{g.edu+=8;}},
  {l:'Pass',d:'Nothing happens',f:g=>{}}]},
 {id:'protest',title:'Mass protest in the capital',text:'Hundreds of thousands are marching against the government.',opts:[
  {l:'Negotiate',pc:10,d:'Stability +6, workers +5',f:g=>{g.stab+=6;g.fac.workers+=5;}},
  {l:'Crack down',d:'Stability +8, happiness −8, workers −10, world opinion −4',f:g=>{g.stab+=8;P.happy-=8;g.fac.workers-=10;G.nations.forEach(a=>{if(!a.isPlayer)a.rel-=4;});}},
  {l:'Ignore it',d:'Stability −10',f:g=>{g.stab-=10;}}]},
 {id:'spill',title:'Oil spill on the coast',text:'A tanker has run aground, spilling oil onto beaches.',opts:[
  {l:'Pay for the cleanup',cost:n=>n.pf*70,d:'No lasting damage',f:g=>{}},
  {l:'Ignore it',d:'Health −10, happiness −4',f:g=>{g.health-=10;P.happy-=4;}}]},
 {id:'bank',title:'Major bank collapsing',text:"The country's largest bank is about to fail.",opts:[
  {l:'Bail it out',cost:n=>n.pf*160,d:'Business +12',f:g=>{g.fac.business+=12;}},
  {l:'Let it fail',d:'Business −15, happiness −5',f:g=>{g.fac.business-=15;P.happy-=5;}}]},
 {id:'housing',title:'Housing crisis',text:"Rents are soaring and young families can't find homes.",opts:[
  {l:'Build public housing',cost:n=>n.pf*110,d:'Happiness +6, workers +8',f:g=>{P.happy+=6;g.fac.workers+=8;}},
  {l:'Leave it to the market',d:'Happiness −5, business +5',f:g=>{P.happy-=5;g.fac.business+=5;}}]},
 {id:'bribe',title:'A generous "donation"',text:'A foreign company offers a large donation to your party. No strings attached, they say.',opts:[
  {l:'Accept it',gain:n=>n.pf*120,d:'Money now, corruption +8',f:g=>{g.corr+=8;}},
  {l:'Reject it',d:'Stability +2',f:g=>{g.stab+=2;}}]},
 {id:'festival',title:'National festival',text:'Your advisors suggest a grand national celebration.',opts:[
  {l:'Throw the festival',cost:n=>n.pf*40,d:'Happiness +5, stability +3',f:g=>{P.happy+=5;g.stab+=3;}},
  {l:'Skip it',d:'Nothing happens',f:g=>{}}]},
 {id:'drought2',title:'Farmers demand subsidies',text:'Farmers say rising costs will ruin them without help.',opts:[
  {l:'Pay subsidies',cost:n=>n.pf*60,d:'+1 grain level, workers +4',f:g=>{P.ind.grain++;g.fac.workers+=4;}},
  {l:'Refuse',d:'Grain output −20% for 3 months',f:g=>{addMod({kind:'prod',res:'grain',target:P.id,mult:0.8,months:3,label:'Farmer protests (grain −20%)'});}}]},
];
function rollDecision(){
 const g=P.gov;const opts=DILEMMAS.filter(d=>!g.recentDec.includes(d.id));
 const d=pick(opts);g.decision={id:d.id};g.decisionAge=0;g.recentDec.push(d.id);if(g.recentDec.length>6)g.recentDec.shift();
 news(`Decision needed: ${d.title}. See the Nation tab.`,'gold');G.flash=G.flash||'decision';
}
function resolveDecision(i,auto){
 const g=P.gov,dd=DILEMMAS.find(x=>x.id===g.decision.id),o=dd.opts[i],cost=o.cost?o.cost(P):0;
 if(!auto){if(cost&&P.money<cost)return'money';if(o.pc&&g.pc<o.pc)return'pc';}
 if(cost){P.money-=cost;G.ledgerCur.other-=cost;}
 if(o.gain){const v=o.gain(P);P.money+=v;G.ledgerCur.other+=v;}
 if(o.pc)g.pc-=o.pc;
 o.f(g);clampGov();
 news(`${dd.title}: ${auto?'no decision was made in time, so you defaulted to':'you chose to'} "${o.l.toLowerCase()}".`,'info');
 g.decision=null;g.decisionAge=0;return'ok';
}
function govMonth(L){
 const g=P.gov,t=govTargets(P);
 g.health+=(t.health-g.health)*0.08;g.edu+=(t.edu-g.edu)*0.04;g.infra+=(t.infra-g.infra)*0.04;g.stab+=(t.stab-g.stab)*0.15;g.corr+=(t.corr-g.corr)*0.05;
 const ft=facTargets(P);for(const k in ft)g.fac[k]+=(ft[k]-g.fac[k])*0.15;
 g.prestige*=0.97;
 g.pc=clamp(g.pc+pcGain(P),0,100);
 g.rp+=rpGain(P);
 if(g.research){const tt=TECHS.find(x=>x.id===g.research);const tc=researchCost(P,tt);if(g.rp>=tc){g.rp-=tc;g.techs.push(tt.id);g.research=null;news(`Research complete: ${tt.name}. ${tt.desc}.`,'gold');}}
 // elections / coups
 if(g.pol.gov===0){
  if(G.turn+1>=g.nextElection){const v=clamp(voteShare(P)+rand(-3,3),0,100);G.lastVote=v;
   if(v>=50){g.pc=clamp(g.pc+20,0,100);news(`Election won with ${v.toFixed(1)}% of the vote. Four more years!`,'gold');G.flash=G.flash||'election_won';}
   else{G.over=true;G.flash='voted_out';news(`You lost the election with ${v.toFixed(1)}% of the vote.`,'bad');}
   g.nextElection+=48;g.campaign=0;}
  else if(g.nextElection-(G.turn+1)===6)news('Elections are 6 months away. Check your projected vote in the Nation tab.','info');
 }else if(g.fac.military<25&&Math.random()<0.12){
  if(g.stab<40){G.over=true;G.flash='coup';}
  else{g.stab-=10;g.fac.military+=10;news('A military coup attempt was crushed. Stability is shaken.','bad');}
 }
 // unrest and faction crises
 if(g.stab<35&&Math.random()<0.3){addMod({kind:'prod',res:'*',target:P.id,mult:0.85,months:1,label:'Protests (output −15%)'});news('Protests and strikes spread across the country. Output −15% this month.','bad');}
 if(g.fac.workers<20&&Math.random()<0.2){addMod({kind:'prod',res:'*',target:P.id,mult:0.7,months:2,label:'General strike (output −30%)'});news('Workers launch a general strike! Output −30% for 2 months.','bad');}
 if(g.fac.business<20&&Math.random()<0.2){const v=Math.min(Math.max(0,P.money)*0.08+200,4000);P.money-=v;L.other-=v;news(`Capital flight! Unhappy businesses move ${fmtMoney(v)} abroad.`,'bad');}
 if(g.stab<12)g.lowStab++;else g.lowStab=0;
 if(g.stab<25&&g.lowStab<3)news('Stability is dangerously low. If it stays under 12% for 3 months, there will be a revolution.','bad');
 // dilemmas
 if(g.decision){g.decisionAge++;if(g.decisionAge>=2){const dd=DILEMMAS.find(x=>x.id===g.decision.id);resolveDecision(dd.opts.length-1,true);}}
 else if(G.turn>1&&Math.random()<0.2)rollDecision();
 clampGov();
}

/* ================= DEALS ================= */
function aiValue(a,item,qty,receiving){if(item==='money')return qty;const st=status(a,item),p=M.price[item]*qty;
 if(receiving)return p*(st==='need'?1.3:st==='surplus'?0.55:0.9);return p*(st==='surplus'?0.85:st==='need'?1.6:1.1);}
function evalDeal(d){
 const a=G.nations[d.partner];
 if(!a||a.id===P.id)return{ok:false,msg:'Pick another country.'};
 if(a.embargo)return{ok:false,msg:'You have an embargo on this country.'};
 if(G.war&&G.war.enemy===a.id)return{ok:false,msg:'You are at war with them.'};
 if(!(d.pGive.item in R)&&d.pGive.item!=='money'||!(d.pGet.item in R)&&d.pGet.item!=='money')return{ok:false,msg:'Invalid goods.'};
 if(d.pGive.item===d.pGet.item)return{ok:false,msg:'Pick two different things to trade.'};
 if(!(d.pGive.qty>0)||!(d.pGet.qty>0))return{ok:false,msg:'Enter quantities above zero.'};
 if(![3,6,12,24].includes(d.months))return{ok:false,msg:'Invalid duration.'};
 if(G.deals.filter(x=>x.partner===a.id).length>=3)return{ok:false,msg:'You already have 3 deals with them.'};
 if(a.isPlayer){const apl=playerOf(a);return{ok:true,human:true,mood:`${apl.name} decides`,msg:`Sent to ${apl.name} for approval.`};}
 if(d.pGet.item!=='money'){const avail=Math.max(0,netOf(a,d.pGet.item))+a.stock[d.pGet.item]/d.months;
  if(d.pGet.qty>avail*1.1)return{ok:false,msg:`They can only spare about ${Math.floor(avail)} ${R[d.pGet.item].name}/month.`};}
 else if(a.money<d.pGet.qty*d.months*0.4)return{ok:false,msg:"They can't afford those payments."};
 const recv=aiValue(a,d.pGive.item,d.pGive.qty,true),give=aiValue(a,d.pGet.item,d.pGet.qty,false);
 const thr=1.05-a.rel/300-(P.trait.id==='diplomat'?0.08:0)-(sameBloc(a,P)?0.12:0);
 const score=recv/give/thr;
 const mood=score>=1.35?'Delighted':score>=1?'Willing':score>=0.85?'Hesitant':score>=0.6?'Unimpressed':'Insulted';
 return{ok:score>=1,score,mood};
}
function mval(it){return it.item==='money'?it.qty:it.qty*M.price[it.item];}
function defaultDraft(aid){
 const a=G.nations[aid];
 const pNeed=IDS.filter(id=>status(P,id)==='need'),aSur=IDS.filter(id=>status(a,id)==='surplus');
 let get=aSur.find(id=>pNeed.includes(id))||aSur[0]||'money';
 const aNeed=IDS.filter(id=>status(a,id)==='need'),pSur=IDS.filter(id=>status(P,id)==='surplus');
 let give=aNeed.find(id=>pSur.includes(id)&&id!==get)||pSur.find(id=>id!==get&&status(a,id)!=='surplus')||pSur.find(id=>id!==get)||'money';
 if(give==='money'&&get==='money')give=IDS.find(id=>P.stock[id]>5)||'grain';
 const getQty=get==='money'?500:Math.max(2,Math.round(Math.min(Math.max(netOf(a,get),4),40)*0.5));
 const val=get==='money'?getQty:getQty*M.price[get],unit=give==='money'?1:M.price[give];
 const d={partner:aid,pGive:{item:give,qty:Math.max(1,Math.round(val*0.9/unit))},pGet:{item:get,qty:getQty},months:6};
 if(!a.isPlayer)for(let i=0;i<40;i++){const e=evalDeal(d);if(!e.mood||e.ok)break;d.pGive.qty=Math.max(d.pGive.qty+1,Math.round(d.pGive.qty*1.08));}
 return d;
}
function peaceTerms(){const w=G.war,e=G.nations[w.enemy];
 if(e.isPlayer)return{t:`${playerOf(e).name} must agree. Sends them a proposal for a white peace.`,k:'human'};
 if(w.score>=20)return{t:`They agree to peace and pay you ${fmtMoney(Math.min(Math.max(0,e.money)*0.08,3000))} in tribute.`,k:'tribute'};
 if(w.score>-30)return{t:'A white peace: nobody gains, the fighting stops.',k:'white'};
 return{t:`They demand ${fmtMoney(Math.max(500,Math.max(0,P.money)*0.1))} to stop the war.`,k:'pay'};}

/* ================= ACTIONS (all player input goes through here) ================= */
const okr=msg=>({ok:true,msg});const err=msg=>({ok:false,msg});
const isRes=id=>typeof id==='string'&&id in R;
const posInt=(v,max)=>{v=Math.floor(Number(v));return Number.isFinite(v)&&v>0?Math.min(v,max||1e6):0;};
function nationArg(v){const n=G.nations[Number(v)];return n&&n.id!==P.id?n:null;}
function addRequest(target,req){req.id=G.reqSeq++;req.from=CUR.id;req.turn=G.turn;target.requests=target.requests.filter(r=>!(r.from===CUR.id&&r.kind===req.kind));target.requests.push(req);}
const ACTIONS={
 buy(a){if(!isRes(a.id))return err('Unknown good');let q=posInt(a.q,100000);if(!q)return err('Bad amount');if(quote(a.id,q,'buy')>P.money)q=maxAfford(a.id,q);if(q<=0)return err('Not enough money');const c=execBuy(a.id,q,G.ledgerCur);return okr(`Bought ${q} ${R[a.id].name} for ${fmtMoney(c)}`);},
 sell(a){if(!isRes(a.id))return err('Unknown good');let q=a.all?Math.floor(P.stock[a.id]):posInt(a.q,100000);q=Math.min(q,Math.floor(P.stock[a.id]));if(q<=0)return err(`No ${R[a.id].name} to sell`);const c=execSell(a.id,q,G.ledgerCur);return okr(`Sold ${q} ${R[a.id].name} for ${fmtMoney(c)}`);},
 autoSell(a){if(!isRes(a.id))return err('Unknown good');G.autoSell[a.id]=!!a.v;return okr();},
 autoBuy(a){if(!isRes(a.id))return err('Unknown good');G.autoBuy[a.id]=!!a.v;return okr();},
 tax(a){const v=clamp(Math.round(Number(a.v)||15),5,40);P.tax=v/100;return okr();},
 upgrade(a){
  const id=a.id;if(!isRes(id))return err('Unknown industry');const c=buildCost(P,id);
  if(DEPOSIT.includes(id)&&!P.dep[id])return err('No deposits — survey first');
  const ns=Math.max(0,Math.ceil(c.steel-P.stock.steel)),nl=Math.max(0,Math.ceil(c.lumber-P.stock.lumber));
  const mat=(ns?quote('steel',ns,'buy'):0)+(nl?quote('lumber',nl,'buy'):0);
  if(P.money<c.money+mat)return err(`Not enough money${mat?` (incl. ${fmtMoney(mat)} materials)`:''}`);
  if(ns)execBuy('steel',ns,G.ledgerCur);if(nl)execBuy('lumber',nl,G.ledgerCur);
  P.money-=c.money;P.stock.steel-=c.steel;P.stock.lumber-=c.lumber;G.ledgerCur.construction-=c.money;P.ind[id]++;
  news(`${R[id].name} industry expanded to level ${P.ind[id]}.`,'good');return okr(`${R[id].name} upgraded to level ${P.ind[id]}`);
 },
 downsize(a){if(!isRes(a.id)||P.ind[a.id]<=0)return err('Nothing to downsize');P.ind[a.id]--;news(`${R[a.id].name} industry reduced to level ${P.ind[a.id]}.`,'info');return okr(`${R[a.id].name} downsized`);},
 survey(a){
  const id=a.id;if(!DEPOSIT.includes(id)||P.dep[id])return err('Nothing to survey');
  if(P.money<SURVEY_COST)return err('Not enough money');
  P.money-=SURVEY_COST;G.ledgerCur.construction-=SURVEY_COST;
  if(Math.random()<0.4){P.dep[id]=true;news(`Survey success! ${R[id].name} deposits found.`,'gold');return okr(`Success! ${R[id].name} deposits found`);}
  news(`The ${R[id].name} survey found nothing.`,'bad');return okr('Survey found nothing — try again?');
 },
 aid(a){
  const t=nationArg(a.n);if(!t)return err('Pick a country');const cost=600;
  if(P.money<cost)return err('Not enough money');if(t.embargo)return err('Lift the embargo first');
  P.money-=cost;G.ledgerCur.other-=cost;
  if(t.isPlayer){t.money+=cost;ledgerOf(t).other+=cost;newsTo(playerOf(t),`${CUR.name} (${P.name}) sent you a gift of ${fmtMoney(cost)}.`,'good');news(`You sent ${fmtMoney(cost)} to ${t.name}.`,'info');return okr('Gift sent');}
  const g=Math.max(2,Math.round(10*(1-t.rel/120)));t.rel=Math.min(100,t.rel+g);
  news(`You sent ${fmtMoney(cost)} in aid to ${t.name}.`,'info');return okr(`Aid sent · relations +${g}`);
 },
 embargo(a){
  const t=nationArg(a.n);if(!t)return err('Pick a country');
  if(G.war&&G.war.enemy===t.id)return err("You can't trade with an enemy at war");
  if(!t.embargo){t.embargo=true;seizeBetween(P,t,'embargo');if(!t.isPlayer)t.rel=Math.max(-100,t.rel-30);G.deals=G.deals.filter(d=>d.partner!==t.id);if(G.offer&&G.offer.partner===t.id)G.offer=null;
   const tp=playerOf(t);if(tp){tp.deals=tp.deals.filter(d=>d.partner!==P.id);newsTo(tp,`${P.name} placed an embargo on you. Your deals with them are cancelled.`,'bad');}
   news(`You placed an embargo on ${t.name}.`,'bad');return okr(`Embargo on ${t.name}`);}
  t.embargo=false;if(!t.isPlayer)t.rel=Math.min(100,t.rel+5);news(`Embargo on ${t.name} lifted.`,'info');return okr('Embargo lifted');
 },
 cancelDeal(a){const i=Number(a.i),d=G.deals[i];if(!d)return err('No such deal');const t=G.nations[d.partner];if(!t.isPlayer)t.rel-=15;G.deals.splice(i,1);news(`You cancelled a deal with ${t.name}.`,'bad');newsTo(playerOf(t),`${P.name} cancelled a trade deal with you.`,'bad');return okr('Deal cancelled');},
 cancelIncoming(a){const pl=playerById(a.from),i=Number(a.i);if(!pl||!pl.deals[i]||pl.deals[i].partner!==P.id)return err('No such deal');pl.deals.splice(i,1);news(`You ended a deal with ${G.nations[pl.nation].name}.`,'bad');newsTo(pl,`${P.name} ended a trade deal with you.`,'bad');return okr('Deal ended');},
 acceptOffer(){const o=G.offer;if(!o)return err('No offer');const t=G.nations[o.partner];G.deals.push({...o,left:o.months,misses:0});t.rel=Math.min(100,t.rel+3);G.offer=null;news(`Deal signed with ${t.name}.`,'good');return okr('Deal signed');},
 declineOffer(){const o=G.offer;if(!o)return err('No offer');G.nations[o.partner].rel-=2;G.offer=null;return okr();},
 propose(a){
  const d=a.deal||{};const draft={partner:Number(d.partner),pGive:{item:String(d.pGive&&d.pGive.item),qty:Math.round(Number(d.pGive&&d.pGive.qty))},pGet:{item:String(d.pGet&&d.pGet.item),qty:Math.round(Number(d.pGet&&d.pGet.qty))},months:Number(d.months)};
  const e=evalDeal(draft),t=G.nations[draft.partner];
  if(!e.mood)return err(e.msg);
  if(e.human){const tp=playerOf(t);addRequest(tp,{kind:'deal',deal:draft});newsTo(tp,`${CUR.name} (${P.name}) proposes a trade deal. See the Trade tab.`,'gold');return okr(`Proposal sent to ${tp.name}`);}
  if(e.ok){G.deals.push({...draft,left:draft.months,misses:0});t.rel=Math.min(100,t.rel+4);news(`${t.name} accepted your trade deal (${draft.months} months).`,'good');return okr('Deal accepted');}
  if(e.score<0.6){t.rel-=3;return err(`${t.name} is insulted (−3 relations)`);}
  return err(`${t.name} rejected the offer`);
 },
 reqAccept(a){
  const r=G.requests.find(x=>x.id===Number(a.rid));if(!r)return err('Request expired');
  const from=playerById(r.from);G.requests=G.requests.filter(x=>x!==r);
  if(!from||from.over)return err('That player is gone');
  const fn=G.nations[from.nation];
  if(r.kind==='deal'){
   if(from.deals.filter(x=>x.partner===P.id).length>=3)return err('They already have 3 deals with you');
   from.deals.push({...r.deal,left:r.deal.months,misses:0});newsTo(from,`${P.name} accepted your trade deal.`,'good');news(`You accepted a trade deal with ${fn.name}.`,'good');return okr('Deal signed');}
  if(r.kind==='invest'){
   const res=r.res,cost=investCost(P,res);
   if(G.nations[from.nation].money<cost)return err(`${from.name} can no longer afford it`);
   fn.money-=cost;ledgerOf(fn).construction-=cost;addBranch(fn,P,res,1,cost);
   newsTo(from,`${P.name} accepted your investment: your ${R[res].name} plants are open.`,'good');news(`${fn.name} built ${R[res].name} plants in your country.`,'good');return okr('Investment accepted');}
  if(r.kind==='blocJoin'){const b=blocById(r.bloc);if(!b||!b.members.includes(P.id))return err('Bloc no longer valid');if(blocOf(fn))return err(`${fn.name} is already in a bloc`);
   b.members.push(fn.id);newsTo(from,`You joined ${b.name}!`,'good');news(`${fn.name} joined ${b.name}.`,'good');return okr(`${fn.name} joined`);}
  if(r.kind==='blocInvite'){const b=blocById(r.bloc);if(!b)return err('Bloc no longer exists');if(blocOf(P))return err('Leave your current bloc first');
   b.members.push(P.id);newsTo(from,`${P.name} joined ${b.name}!`,'good');news(`You joined ${b.name}.`,'good');return okr(`Joined ${b.name}`);}
  if(r.kind==='peace'){
   if(!(G.war&&G.war.enemy===fn.id))return err('You are not at war with them');
   G.war=null;from.war=null;news(`Peace signed with ${fn.name}.`,'info');newsTo(from,`${P.name} accepted peace. The war is over.`,'good');return okr('Peace signed');}
  return err('Unknown request');
 },
 reqDecline(a){const r=G.requests.find(x=>x.id===Number(a.rid));if(!r)return err('Request expired');G.requests=G.requests.filter(x=>x!==r);newsTo(playerById(r.from),`${P.name} declined your ${{peace:'peace proposal',deal:'trade proposal',invest:'investment proposal',blocJoin:'bloc application',blocInvite:'bloc invitation'}[r.kind]||'proposal'}.`,'bad');return okr();},
 recruit(a){
  const n=[5,20].includes(Number(a.n))?Number(a.n):5;
  const cost=n*RECRUIT_COST*(P.gov.pol.draft?0.5:1),need=Math.max(0,Math.ceil(n-P.stock.steel)),mat=need?quote('steel',need,'buy'):0;
  if(P.money<cost+mat)return err('Not enough money');
  if(need)execBuy('steel',need,G.ledgerCur);P.stock.steel-=n;P.money-=cost;G.ledgerCur.military-=cost;P.army+=n;return okr(`+${n} army units`);
 },
 disband(a){const n=5;if(P.army<=n+1)return err("You can't disband your whole army");P.army-=n;return okr(`−${n} army units`);},
 declare(a){
  const e=nationArg(a.n);if(!e)return err('Pick a country');if(G.war)return err('You are already at war');
  const epl=playerOf(e);if(epl&&epl.war)return err(`${epl.name} is already fighting another war`);
  G.war={enemy:e.id,score:0,lastBattle:-1,start:G.turn,human:!!epl};
  G.deals=G.deals.filter(d=>d.partner!==e.id);if(G.offer&&G.offer.partner===e.id)G.offer=null;
  e.embargo=true;if(!e.isPlayer)e.rel=-100;
  seizeBetween(P,e,'war');
  const eb=blocOf(e);if(eb&&!sameBloc(e,P)){eb.members.forEach(id=>{const m=G.nations[id];if(m.id===e.id)return;if(!m.isPlayer)m.rel=Math.max(-100,m.rel-25);else newsTo(playerOf(m),`${P.name} attacked ${e.name}, a fellow ${eb.name} member. Its army fights 20% stronger thanks to the defense pact.`,'bad');});}
  G.nations.forEach(o=>{if(!o.isPlayer&&o.id!==e.id)o.rel=Math.max(-100,o.rel-6);});
  if(epl){epl.deals=epl.deals.filter(d=>d.partner!==P.id);e.embs[P.id]=true;epl.war={enemy:P.id,score:0,lastBattle:-1,start:G.turn,human:true};
   newsTo(epl,`${CUR.name} (${P.name}) has declared war on you! Defend yourself in the Wars tab.`,'bad');flashTo(epl,'attacked');}
  news(`${P.name} declares war on ${e.name}! The world condemns the aggression (−6 relations with everyone).`,'bad');
  G.players.forEach(o=>{if(o!==CUR&&o!==epl&&!o.over)newsTo(o,`${P.name} has declared war on ${e.name}.`,'info');});
  return okr(`War declared on ${e.name}`);
 },
 battle(){
  const w=G.war;if(!w)return err('You are not at war');
  if(w.lastBattle===G.turn)return err('Troops need a month to regroup');
  const cost=battleCost();if(P.money<cost)return err('Not enough money to fund a battle');
  const e=G.nations[w.enemy],odds=battleOdds(e),res=rollOutcome(odds);
  P.money-=cost;G.ledgerCur.war-=cost;w.lastBattle=G.turn;
  const msg=applyBattle(res,e);
  return{ok:true,outcome:res,odds,msg};
 },
 peace(){
  const w=G.war;if(!w)return err('You are not at war');const e=G.nations[w.enemy],pt=peaceTerms();let t;
  if(pt.k==='human'){addRequest(playerOf(e),{kind:'peace'});newsTo(playerOf(e),`${CUR.name} (${P.name}) proposes peace. See the Trade tab.`,'gold');return okr('Peace proposal sent');}
  if(pt.k==='tribute'){const v=Math.min(Math.max(0,e.money)*0.08,3000);e.money-=v;P.money+=v;G.ledgerCur.war+=v;t=`${e.name} signs peace and pays ${fmtMoney(v)} tribute.`;}
  else if(pt.k==='white')t=`White peace signed with ${e.name}.`;
  else{const v=Math.max(500,Math.max(0,P.money)*0.1);P.money-=v;G.ledgerCur.war-=v;t=`You paid ${fmtMoney(v)} for peace with ${e.name}.`;}
  e.rel=-60;G.war=null;news(t,'info');return okr('Peace signed');
 },
 budget(a){if(!MINISTRIES.some(m=>m.id===a.id))return err('Unknown ministry');P.gov.budget[a.id]=clamp(Math.round(Number(a.l)||0),0,4);return okr();},
 policy(a){
  const g=P.gov,pol=POLICIES.find(p=>p.id===a.id);if(!pol)return err('Unknown law');const i=Math.round(Number(a.i));
  if(!(i>=0&&i<pol.opts.length))return err('Bad option');if(g.pol[pol.id]===i)return okr();
  if(g.pc<pol.cost)return err(`Needs ${pol.cost} political capital (you have ${Math.floor(g.pc)})`);
  g.pc-=pol.cost;g.pol[pol.id]=i;
  if(pol.id==='gov'){g.stab=Math.max(0,g.stab-15);if(i===0)g.nextElection=G.turn+24;news(i===1?'You suspend elections and rule as an autocrat. Stability is shaken.':'You restore democracy. Elections will be held in 2 years.','bad');}
  else news(`New law: ${pol.name} set to ${pol.opts[i]}.`,'info');
  return okr(`${pol.name}: ${pol.opts[i]}`);
 },
 research(a){const t=TECHS.find(x=>x.id===a.id);if(!t)return err('Unknown technology');const g=P.gov;if(g.techs.includes(t.id))return err('Already researched');if(!(t.req||[]).every(r=>g.techs.includes(r)))return err('Locked');g.research=t.id;return okr(`Researching ${t.name}`);},
 campaign(){const g=P.gov,c=Math.round(P.pf*150);if(g.pol.gov!==0||g.nextElection-G.turn>12)return err('No election coming up');if(g.campaign>=12)return err('Your campaign is already at full strength');if(P.money<c)return err('Not enough money');P.money-=c;G.ledgerCur.other-=c;g.campaign+=3;return okr('Campaign rally held: +3% projected vote');},
 decision(a){if(!P.gov.decision)return err('No decision pending');const dd=DILEMMAS.find(x=>x.id===P.gov.decision.id);const i=Math.round(Number(a.i));if(!(i>=0&&i<dd.opts.length))return err('Bad option');const r=resolveDecision(i,false);if(r==='money')return err('Not enough money for that option');if(r==='pc')return err('Not enough political capital for that option');return okr();},
};
function act(playerId,a){
 const pl=playerById(playerId);if(!pl)return err('Not in this game');if(pl.over)return err('Your government has fallen. You are spectating.');
 const f=a&&ACTIONS[a.t];if(!f)return err('Unknown action');
 setCtx(pl);let r;try{r=f(a)||okr();}catch(e){r=err('Something went wrong');if(typeof console!=='undefined')console.error(e);}
 setCtx(null);return r;
}
function stateJSON(){return JSON.stringify(G);}
function activeIds(){return G?G.players.filter(p=>!p.over).map(p=>p.id):[];}
function loadJSON(s){useGame(JSON.parse(s));return G;}

/* ================= GLOBALIZATION =================
   Tariffs, the WTO, trade blocs, foreign investment (multinational branches),
   soft power / culture and the spread of technology between connected countries. */
const TARIFFS=[0,0.05,0.1,0.2,0.4];
const BLOC_SEED=[
 {name:'European Union',short:'EU',codes:['FR','DE','ES','IT','NL','BE','AT','PL','CZ','SE','FI','RO','GR','PT']},
 {name:'North American Trade Pact',short:'NATP',codes:['US','CA','MX']},
 {name:'ASEAN',short:'ASEAN',codes:['VN','TH','MY','PH','ID']},
 {name:'Mercosur',short:'MERC',codes:['BR','AR','CL','PE','CO','EC','VE']},
 {name:'Gulf Cooperation Council',short:'GCC',codes:['SA','AE','QA']},
 {name:'African Free Trade Area',short:'AfFTA',codes:['NG','GH','KE','ET','ZA','AO','CD','EG','MA','DZ']},
];
const INVEST_SHARE=0.5,EXCHANGE_COST=300;
function initGlobal(){
 G.blocs=BLOC_SEED.map((b,i)=>({id:i+1,name:b.name,short:b.short,members:G.nations.filter(n=>b.codes.includes(n.flag)).map(n=>n.id),founder:null}));
 G.blocSeq=G.blocs.length+1;G.invest=[];G.invSeq=1;G.exchanges={};
 G.nations.forEach(n=>{
  n.wto=n.isPlayer?true:Math.random()<0.85;
  n.tariff=n.isPlayer?0.05:n.wto?pick([0,0.05,0.05,0.1]):pick([0.1,0.2,0.4]);
  n.cultureLvl=randi(0,3);
  if(!n.gov){n.techs=[];['farm','logi','med','refine'].forEach(t=>{if(Math.random()<0.3)n.techs.push(t);});}
  n.soft=softTarget(n);
 });
}
const blocById=id=>G.blocs.find(b=>b.id===id);
function blocOf(n){return G.blocs.find(b=>b.members.includes(n.id))||null;}
function sameBloc(a,b){const x=blocOf(a);return!!x&&x.members.includes(b.id);}
function exportPenalty(n){let p=n.tariff*0.5;if(n.wto)p=Math.min(p,0.05);if(blocOf(n))p*=0.7;return p;}
function techsOf(n){return n.gov?n.gov.techs:(n.techs||[]);}
function knownBy(t){return G.nations.filter(n=>techsOf(n).includes(t)).length;}
function partnersOf(n){
 const s=new Set();
 eachDeal((pl,d)=>{if(pl.nation===n.id)s.add(d.partner);if(d.partner===n.id)s.add(pl.nation);});
 const b=blocOf(n);if(b)b.members.forEach(m=>s.add(m));
 G.invest.forEach(i=>{if(i.owner===n.id)s.add(i.host);if(i.host===n.id)s.add(i.owner);});
 for(const k in G.exchanges){const[a,c]=k.split('-').map(Number);if(G.turn-G.exchanges[k]<24){if(a===n.id)s.add(c);if(c===n.id)s.add(a);}}
 s.delete(n.id);return[...s].map(id=>G.nations[id]);
}
function researchDiscount(n,t){
 const ps=partnersOf(n).filter(p=>techsOf(p).includes(t)).length;
 let d=Math.min(0.4,ps*0.06);if(knownBy(t)/G.nations.length>0.5)d+=0.15;return Math.min(0.5,d);
}
function researchCost(n,tech){return Math.round(tech.cost*(1-researchDiscount(n,tech.id)));}
function spillover(n){const mine=techsOf(n).length;return Math.min(3,partnersOf(n).filter(p=>techsOf(p).length>mine).length*0.4);}
function softTarget(n){
 const edu=n.gov?n.gov.edu:45,cl=n.gov?n.gov.budget.culture:n.cultureLvl;
 return clamp(5+edu*0.25+Math.min(30,Math.sqrt(Math.max(0,n.gdp))/25)+cl*7+techsOf(n).length*1.2+((n.lastProd.cars||0)+(n.lastProd.electronics||0))*0.05,0,100);
}
function tourismOf(n){return n.soft/100*n.pf*80;}
function relTarget(n){return(P.soft-30)*0.25+(sameBloc(n,P)?15:0)+(n.wto&&P.wto?5:0)-P.tariff*40-(P.gov&&P.gov.pol.gov===1?5:0);}
function levelProfit(host,res){let inC=0;const rec=RECIPE[res];if(rec)for(const k in rec)inC+=inputAmt(host,res,k)*M.price[k];return outPer(res)*prodMult(host,res)*(M.price[res]-inC)-levelUpkeep(host,res);}
function dividendOf(b){const h=G.nations[b.host];return Math.max(0,levelProfit(h,b.res))*b.levels*INVEST_SHARE*utilOf(h,b.res);}
function investCost(host,res){return Math.round((500+R[res].base*40)*1.15*(host.gov?1-(host.gov.infra-50)/300:1));}
function canInvest(host,res){
 if(!isRes(res))return'Pick an industry';
 if(DEPOSIT.includes(res)&&!host.dep[res])return`${host.name} has no ${R[res].name} deposits`;
 if(host.embargo)return'Lift your embargo first';
 if(G.war&&G.war.enemy===host.id)return'You are at war with them';
 return null;
}
function addBranch(owner,host,res,levels,cost){
 let b=G.invest.find(x=>x.owner===owner.id&&x.host===host.id&&x.res===res);
 if(b){b.levels+=levels;b.cost+=cost;}else{b={id:G.invSeq++,owner:owner.id,host:host.id,res,levels,cost,since:G.turn,last:0};G.invest.push(b);}
 host.ind[res]+=levels;return b;
}
function seizeBetween(a,b,why){
 const gone=G.invest.filter(i=>(i.owner===a.id&&i.host===b.id)||(i.owner===b.id&&i.host===a.id));
 if(!gone.length)return;
 G.invest=G.invest.filter(i=>!gone.includes(i));
 gone.forEach(i=>{const o=G.nations[i.owner],h=G.nations[i.host];
  newsTo(playerOf(o),`${h.name} seized your ${R[i.res].name} plants (${why}).`,'bad');
  newsTo(playerOf(h),`You took over ${o.name}'s ${R[i.res].name} plants (${why}).`,'info');});
}
function genInvestOffer(){
 const c=G.nations.filter(a=>!a.isPlayer&&!a.embargo&&a.rel>=0&&a.money>6000);if(!c.length)return;
 const a=pick(c);
 const opts=IDS.filter(id=>(!DEPOSIT.includes(id)||P.dep[id])&&((a.str[id]||0)>0||P.ind[id]>0));if(!opts.length)return;
 const res=pick(opts);G.invOffer={owner:a.id,res,levels:Math.random()<0.4?2:1};
 news(`A company from ${a.name} wants to build ${R[res].name} plants in ${P.name}. See the Global tab.`,'gold');
}
function globalMonth(){
 G.nations.forEach(n=>{n.soft+=(softTarget(n)-n.soft)*0.05;const t=tourismOf(n);n.money+=t;ledgerOf(n).tourism+=t;});
 G.invest.forEach(b=>{const o=G.nations[b.owner],h=G.nations[b.host];let d=dividendOf(b);if(h.isPlayer)d=Math.min(d,Math.max(0,h.money));
  h.money-=d;o.money+=d;ledgerOf(h).dividends-=d;ledgerOf(o).dividends+=d;b.last=d;});
 G.nations.forEach(n=>{if(n.gov)return;if(!n.techs)n.techs=[];if(Math.random()<0.015+n.gdp/3e7){const t=TECHS.find(x=>!n.techs.includes(x.id)&&(x.req||[]).every(r=>n.techs.includes(r)));if(t)n.techs.push(t.id);}});
}
function globalPlayerMonth(L){
 const rev=P.tariff*0.6*Math.max(0,-L.purchases);if(rev>0){P.money+=rev;L.tariffs+=rev;}
 G.invest=G.invest.filter(b=>{if(b.owner!==P.id)return true;const h=G.nations[b.host];
  if(!h.isPlayer&&h.rel<-40&&Math.random()<0.08){news(`${h.name} nationalized your ${R[b.res].name} plants (${b.levels} level${b.levels>1?'s':''}).`,'bad');return false;}return true;});
 if(G.invOffer){G.nations[G.invOffer.owner].rel-=1;G.invOffer=null;}
 if(Math.random()<0.1)genInvestOffer();
}
function blocBoost(x,y){return blocOf(x)&&!sameBloc(x,y)?1.2:1;}

/* globalization actions */
Object.assign(ACTIONS,{
 tariff(a){const v=Number(a.v);if(!TARIFFS.includes(v))return err('Bad tariff');if(P.wto&&v>0.1)return err('WTO members cannot set tariffs above 10%');P.tariff=v;news(`Import tariff set to ${Math.round(v*100)}%.`,'info');return okr(`Tariff: ${Math.round(v*100)}%`);},
 wtoJoin(){if(P.wto)return err('Already a member');if(P.gov.pc<20)return err('Needs 20 political capital');P.gov.pc-=20;P.wto=true;P.tariff=Math.min(P.tariff,0.1);G.nations.forEach(n=>{if(!n.isPlayer&&n.wto)n.rel+=5;});news('You joined the World Trade Organization.','good');return okr('Joined the WTO');},
 wtoLeave(){if(!P.wto)return err('Not a member');if(P.gov.pc<10)return err('Needs 10 political capital');P.gov.pc-=10;P.wto=false;G.nations.forEach(n=>{if(!n.isPlayer&&n.wto)n.rel-=8;});news('You left the World Trade Organization.','bad');return okr('Left the WTO');},
 blocJoin(a){
  const b=blocById(Number(a.b));if(!b)return err('No such bloc');if(blocOf(P))return err('Leave your current bloc first');
  if(P.gov.pc<15)return err('Needs 15 political capital');
  const humans=b.members.map(id=>G.nations[id]).filter(n=>n.isPlayer).map(playerOf).filter(Boolean);
  if(humans.length){P.gov.pc-=15;addRequest(humans[0],{kind:'blocJoin',bloc:b.id});newsTo(humans[0],`${CUR.name} (${P.name}) asks to join ${b.name}. See the Trade tab.`,'gold');return okr(`Application sent to ${humans[0].name}`);}
  const avg=b.members.reduce((s,id)=>s+G.nations[id].rel,0)/Math.max(1,b.members.length);
  if(avg<15)return err(`Members vote no (average relations ${Math.round(avg)}, need 15)`);
  P.gov.pc-=15;b.members.push(P.id);b.members.forEach(id=>{const n=G.nations[id];if(!n.isPlayer)n.rel+=5;});news(`${P.name} joined ${b.name}!`,'good');
  G.players.forEach(o=>{if(o!==CUR)newsTo(o,`${P.name} joined ${b.name}.`,'info');});return okr(`Joined ${b.name}`);
 },
 blocLeave(){const b=blocOf(P);if(!b)return err('Not in a bloc');if(P.gov.pc<10)return err('Needs 10 political capital');P.gov.pc-=10;b.members=b.members.filter(id=>id!==P.id);b.members.forEach(id=>{const n=G.nations[id];if(!n.isPlayer)n.rel-=10;});
  if(!b.members.length)G.blocs=G.blocs.filter(x=>x!==b);news(`${P.name} left ${b.name}.`,'bad');return okr(`Left ${b.name}`);},
 blocFound(a){
  const name=String(a.name||'').replace(/[<>&"]/g,'').trim().slice(0,28);if(name.length<3)return err('Name your bloc (3+ letters)');
  if(blocOf(P))return err('Leave your current bloc first');if(P.gov.pc<30)return err('Needs 30 political capital');
  const cost=Math.round(P.pf*50);if(P.money<cost)return err('Not enough money');
  P.gov.pc-=30;P.money-=cost;G.ledgerCur.other-=cost;
  const short=name.split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,5);
  const b={id:G.blocSeq++,name,short,members:[P.id],founder:P.id};G.blocs.push(b);
  news(`You founded the ${name}. Invite countries from their country page.`,'gold');return okr(`${name} founded`);
 },
 blocInvite(a){
  const t=nationArg(a.n);if(!t)return err('Pick a country');const b=blocOf(P);if(!b)return err('You are not in a bloc');if(b.members.includes(t.id))return err('Already a member');
  if(blocOf(t))return err(`${t.name} is already in ${blocOf(t).name}`);
  if(t.isPlayer){const tp=playerOf(t);addRequest(tp,{kind:'blocInvite',bloc:b.id});newsTo(tp,`${CUR.name} (${P.name}) invites you to join ${b.name}. See the Trade tab.`,'gold');return okr(`Invitation sent to ${tp.name}`);}
  if(t.rel<30)return err(`${t.name} declines (relations ${Math.round(t.rel)}, need 30)`);
  b.members.push(t.id);t.rel+=5;news(`${t.name} joined ${b.name}!`,'good');return okr(`${t.name} joined`);
 },
 invest(a){
  const h=nationArg(a.n);if(!h)return err('Pick a country');const why=canInvest(h,a.res);if(why)return err(why);
  const cost=investCost(h,a.res);if(P.money<cost)return err('Not enough money');
  if(h.isPlayer){const hp=playerOf(h);addRequest(hp,{kind:'invest',res:a.res,cost});newsTo(hp,`${CUR.name} (${P.name}) wants to build ${R[a.res].name} plants in your country. See the Trade tab.`,'gold');return okr(`Investment proposal sent to ${hp.name}`);}
  if(h.rel<-10)return err(`${h.name} refuses foreign investment from you`);
  P.money-=cost;G.ledgerCur.construction-=cost;addBranch(P,h,a.res,1,cost);h.rel=Math.min(100,h.rel+6);
  news(`Your companies opened ${R[a.res].name} plants in ${h.name}. You earn ${Math.round(INVEST_SHARE*100)}% of their profits.`,'good');return okr(`Invested in ${h.name}`);
 },
 sellBranch(a){
  const b=G.invest.find(x=>x.id===Number(a.id)&&x.owner===P.id);if(!b)return err('No such investment');
  const h=G.nations[b.host];let v=b.cost*0.4;if(h.isPlayer)v=Math.min(v,Math.max(0,h.money));
  h.money-=v;P.money+=v;G.ledgerCur.other+=v;ledgerOf(h).other-=v;G.invest=G.invest.filter(x=>x!==b);
  news(`You sold your ${R[b.res].name} plants in ${h.name} for ${fmtMoney(v)}.`,'info');newsTo(playerOf(h),`${P.name} sold its ${R[b.res].name} plants in your country to you.`,'info');return okr(`Sold for ${fmtMoney(v)}`);
 },
 nationalize(a){
  const b=G.invest.find(x=>x.id===Number(a.id)&&x.host===P.id);if(!b)return err('No such company');
  const o=G.nations[b.owner];G.invest=G.invest.filter(x=>x!==b);
  if(o.isPlayer)newsTo(playerOf(o),`${P.name} nationalized your ${R[b.res].name} plants!`,'bad');else o.rel=Math.max(-100,o.rel-40);
  G.nations.forEach(n=>{if(!n.isPlayer&&n!==o)n.rel-=4;});P.gov.fac.business-=8;
  news(`You nationalized ${o.name}'s ${R[b.res].name} plants. Foreign investors are nervous.`,'bad');return okr('Nationalized');
 },
 invAccept(){const o=G.invOffer;if(!o)return err('No offer');const a=G.nations[o.owner];addBranch(a,P,o.res,o.levels,investCost(P,o.res)*o.levels);a.rel=Math.min(100,a.rel+4);G.invOffer=null;
  news(`${a.name}'s company built ${o.levels} ${R[o.res].name} level${o.levels>1?'s':''} in ${P.name}. They keep ${Math.round(INVEST_SHARE*100)}% of the profits.`,'good');return okr('Investment accepted');},
 invDecline(){if(!G.invOffer)return err('No offer');G.invOffer=null;return okr();},
 exchange(a){
  const t=nationArg(a.n);if(!t)return err('Pick a country');if(t.embargo||(G.war&&G.war.enemy===t.id))return err('Not possible right now');
  const key=Math.min(P.id,t.id)+'-'+Math.max(P.id,t.id);if(G.exchanges[key]!=null&&G.turn-G.exchanges[key]<12)return err('You already ran an exchange with them this year');
  if(P.money<EXCHANGE_COST)return err('Not enough money');
  P.money-=EXCHANGE_COST;G.ledgerCur.other-=EXCHANGE_COST;G.exchanges[key]=G.turn;
  P.soft=Math.min(100,P.soft+2);P.gov.rp+=3;
  if(t.isPlayer){t.soft=Math.min(100,t.soft+2);if(t.gov)t.gov.rp+=3;newsTo(playerOf(t),`${P.name} sponsored a cultural and student exchange with you (+3 research, +2 soft power).`,'good');}
  else t.rel=Math.min(100,t.rel+6);
  news(`Cultural and student exchange with ${t.name}: +3 research, +2 soft power${t.isPlayer?'':', relations +6'}.`,'good');return okr('Exchange launched');
 },
});
