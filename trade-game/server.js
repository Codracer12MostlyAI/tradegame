// Trade Game multiplayer server: Express serves the client, WebSockets run the rooms.
// Each room gets its own isolated copy of the shared game logic (public/game.js) in a vm context.
const express=require('express');
const http=require('http');
const path=require('path');
const fs=require('fs');
const vm=require('vm');
const crypto=require('crypto');
const {WebSocketServer}=require('ws');

const PORT=process.env.PORT||3000;
const GAME_SRC=fs.readFileSync(path.join(__dirname,'public','game.js'),'utf8');
const MAX_PLAYERS=8;
const ROOM_IDLE_MS=Number(process.env.ROOM_IDLE_HOURS||72)*60*60*1000; // drop rooms nobody has touched for this long
// Optional persistence: set DATA_DIR (e.g. a Render persistent disk at /var/data) and games survive restarts.
const DATA_DIR=process.env.DATA_DIR?path.join(process.env.DATA_DIR,'rooms'):null;
if(DATA_DIR)fs.mkdirSync(DATA_DIR,{recursive:true});

const app=express();
app.use(express.static(path.join(__dirname,'public'),{maxAge:'1h'}));
app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size}));
const server=http.createServer(app);
const wss=new WebSocketServer({server,perMessageDeflate:{threshold:1024}});

const rooms=new Map();
const id=()=>crypto.randomBytes(9).toString('base64url');
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';let c;do{c=Array.from({length:4},()=>A[Math.floor(Math.random()*A.length)]).join('');}while(rooms.has(c));return c;}
function makeCtx(){const c=vm.createContext({console,Math,JSON});vm.runInContext(GAME_SRC,c,{filename:'game.js'});return c;}
const clean=(s,n)=>String(s||'').replace(/[<>&"]/g,'').trim().slice(0,n)||null;

function createRoom(){
 const room={code:newCode(),ctx:makeCtx(),status:'lobby',players:[],hostId:null,timer:0,deadline:0,timerHandle:null,lastActive:Date.now(),bcastHandle:null};
 rooms.set(room.code,room);return room;
}
function roomMeta(room){
 return{code:room.code,status:room.status,hostId:room.hostId,timer:room.timer,deadline:room.deadline,
  players:room.players.map(p=>({id:p.id,name:p.name,connected:p.connected,ready:p.ready,
   pick:room.status==='lobby'&&p.pick?{flag:p.pick.nation.flag,name:p.pick.nation.name,pop:p.pick.nation.pop,money:p.pick.nation.money,trait:p.pick.trait,ind:p.pick.nation.ind,dep:p.pick.nation.dep,gov:{edu:p.pick.nation.gov.edu,health:p.pick.nation.gov.health,infra:p.pick.nation.gov.infra,corr:p.pick.nation.gov.corr}}:null}))};
}
function persist(room){
 if(!DATA_DIR||room.status!=='playing')return;
 clearTimeout(room.saveHandle);
 room.saveHandle=setTimeout(()=>{
  const snap={code:room.code,status:room.status,hostId:room.hostId,timer:room.timer,lastActive:room.lastActive,
   players:room.players.map(p=>({id:p.id,token:p.token,name:p.name})),state:room.ctx.stateJSON()};
  const f=path.join(DATA_DIR,room.code+'.json');
  fs.writeFile(f+'.tmp',JSON.stringify(snap),e=>{if(!e)fs.rename(f+'.tmp',f,()=>{});});
 },1500);
}
function restoreRooms(){
 if(!DATA_DIR)return;
 for(const file of fs.readdirSync(DATA_DIR).filter(f=>f.endsWith('.json'))){
  try{
   const snap=JSON.parse(fs.readFileSync(path.join(DATA_DIR,file),'utf8'));
   if(Date.now()-snap.lastActive>ROOM_IDLE_MS){fs.unlinkSync(path.join(DATA_DIR,file));continue;}
   const room={code:snap.code,ctx:makeCtx(),status:'playing',hostId:snap.hostId,timer:snap.timer||0,deadline:0,timerHandle:null,lastActive:snap.lastActive,bcastHandle:null,
    players:snap.players.map(p=>({...p,ws:null,connected:false,ready:false,pick:null}))};
   room.ctx.loadJSON(snap.state);rooms.set(room.code,room);
  }catch(e){console.error('Could not restore',file,e.message);}
 }
 console.log(`Restored ${rooms.size} saved game(s)`);
}
function send(ws,msg){if(ws&&ws.readyState===1)ws.send(JSON.stringify(msg));}
function broadcast(room,now){
 if(room.bcastHandle&&!now)return;
 const go=()=>{room.bcastHandle=null;
  const meta=roomMeta(room);
  const state=room.status==='playing'?room.ctx.stateJSON():null;
  const msg=state?`{"t":"state","room":${JSON.stringify(meta)},"g":${state}}`:JSON.stringify({t:'lobby',room:meta});
  room.players.forEach(p=>{if(p.ws&&p.ws.readyState===1)p.ws.send(msg);});
 };
 if(now){clearTimeout(room.bcastHandle);go();}else room.bcastHandle=setTimeout(go,60);
}
function takenIdx(room,except){return room.players.filter(p=>p!==except&&p.pick).map(p=>p.pick.idx);}
function addPlayer(room,name,ws){
 const p={id:id(),token:id()+id(),name:clean(name,18)||'Leader '+(room.players.length+1),ws,connected:true,ready:false,pick:null};
 p.pick=room.ctx.rollNation(takenIdx(room));
 room.players.push(p);if(!room.hostId)room.hostId=p.id;
 return p;
}
function activeHumans(room){
 const alive=new Set(Array.from(room.ctx.activeIds()));
 return room.players.filter(p=>alive.has(p.id));
}
function maybeAdvance(room,force){
 if(room.status!=='playing')return;
 const act=activeHumans(room),waiting=act.filter(p=>p.connected&&!p.ready);
 if(!act.some(p=>p.connected))return;
 if(waiting.length===0||force){
  room.ctx.step();
  room.players.forEach(p=>p.ready=false);
  armTimer(room);
  broadcast(room,true);persist(room);
 }
}
function armTimer(room){
 clearTimeout(room.timerHandle);room.deadline=0;
 if(room.status==='playing'&&room.timer>0){room.deadline=Date.now()+room.timer*1000;room.timerHandle=setTimeout(()=>maybeAdvance(room,true),room.timer*1000);}
}

wss.on('connection',ws=>{
 let room=null,me=null;
 ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);
 ws.on('message',raw=>{
  let m;try{m=JSON.parse(raw);}catch(e){return;}
  if(!m||typeof m.t!=='string')return;
  if(room)room.lastActive=Date.now();
  switch(m.t){
   case'create':{
    room=createRoom();me=addPlayer(room,m.name,ws);
    send(ws,{t:'joined',code:room.code,token:me.token,you:me.id});broadcast(room,true);break;}
   case'join':{
    const r=rooms.get(String(m.code||'').toUpperCase());
    if(!r)return send(ws,{t:'error',msg:'No game with that code.'});
    if(r.status!=='lobby')return send(ws,{t:'error',msg:'That game has already started.'});
    if(r.players.length>=MAX_PLAYERS)return send(ws,{t:'error',msg:'That game is full.'});
    room=r;me=addPlayer(room,m.name,ws);room.lastActive=Date.now();
    send(ws,{t:'joined',code:room.code,token:me.token,you:me.id});broadcast(room,true);break;}
   case'rejoin':{
    const r=rooms.get(String(m.code||'').toUpperCase());const p=r&&r.players.find(x=>x.token===m.token);
    if(!p)return send(ws,{t:'error',msg:'That game is no longer available.',expired:true});
    if(p.ws&&p.ws!==ws){try{p.ws.close();}catch(e){}}
    room=r;me=p;p.ws=ws;p.connected=true;room.lastActive=Date.now();
    send(ws,{t:'joined',code:room.code,token:me.token,you:me.id});broadcast(room,true);break;}
   case'leave':{if(room&&me){leave(room,me);room=null;me=null;}break;}
   default:{
    if(!room||!me)return send(ws,{t:'error',msg:'Join a game first.'});
    handle(room,me,m);
   }
  }
 });
 ws.on('close',()=>{if(room&&me&&me.ws===ws){me.connected=false;me.ws=null;if(room.status==='lobby'){leave(room,me);}else{broadcast(room);maybeAdvance(room);}}});
});
function leave(room,p){
 room.players=room.players.filter(x=>x!==p);
 if(room.hostId===p.id)room.hostId=room.players[0]?room.players[0].id:null;
 if(room.players.length===0&&room.status==='lobby'){rooms.delete(room.code);return;}
 broadcast(room,true);
}
function handle(room,me,m){
 const isHost=room.hostId===me.id;
 switch(m.t){
  case'name':me.name=clean(m.name,18)||me.name;broadcast(room);break;
  case'reroll':if(room.status==='lobby'){me.pick=room.ctx.rollNation(takenIdx(room,me));broadcast(room,true);}break;
  case'timer':if(isHost){const v=Number(m.s);room.timer=[0,30,60,120,300].includes(v)?v:0;if(room.status==='playing')armTimer(room);broadcast(room,true);}break;
  case'start':{
   if(!isHost||room.status!=='lobby')return;
   const specs=room.players.map(p=>({id:p.id,name:p.name,pick:p.pick}));
   room.ctx.newGame(specs);room.status='playing';room.players.forEach(p=>{p.ready=false;p.pick=null;});
   armTimer(room);broadcast(room,true);persist(room);break;}
  case'ready':if(room.status==='playing'){me.ready=!!m.v;broadcast(room);maybeAdvance(room);}break;
  case'act':{
   if(room.status!=='playing')return;
   const r=room.ctx.act(me.id,m.a||{});
   send(me.ws,{t:'res',rid:m.rid,...r});
   broadcast(room);persist(room);break;}
 }
}
// keepalive + idle cleanup
setInterval(()=>{
 wss.clients.forEach(ws=>{if(!ws.isAlive)return ws.terminate();ws.isAlive=false;try{ws.ping();}catch(e){}});
 const now=Date.now();
 rooms.forEach((r,code)=>{if(now-r.lastActive>ROOM_IDLE_MS&&!r.players.some(p=>p.connected)){clearTimeout(r.timerHandle);rooms.delete(code);if(DATA_DIR)fs.unlink(path.join(DATA_DIR,code+'.json'),()=>{});}});
},30000);

restoreRooms();
server.listen(PORT,()=>console.log(`Trade Game server on http://localhost:${PORT}`));
