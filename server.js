const http=require('http');
const WebSocket=require('ws');
const rooms=new Map();
const makeCode=()=>{let c;do{c=String(Math.floor(10000+Math.random()*90000));}while(rooms.has(c));return c;};
const send=(ws,msg)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(msg));};
const broadcast=(room,msg,except)=>{for(const p of room.players){if(p.ws!==except)send(p.ws,msg);}};
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify({ok:true,rooms:rooms.size}));});
const wss=new WebSocket.Server({server});
wss.on('connection',ws=>{let player=null;
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw);}catch{return;}
  if(m.type==='create'){if(player)return;const code=makeCode();player={ws,id:Math.random().toString(36).slice(2),room:code};rooms.set(code,{players:[player],started:false});send(ws,{type:'created',code,id:player.id});return;}
  if(m.type==='join'){if(player)return;const code=String(m.code||'');const room=rooms.get(code);if(!room){send(ws,{type:'error',message:'Oda bulunamadı.'});return;}if(room.players.length>=2){send(ws,{type:'error',message:'Bu oda dolu.'});return;}player={ws,id:Math.random().toString(36).slice(2),room:code};room.players.push(player);room.started=true;send(ws,{type:'joined',code,id:player.id,slot:1});const host=room.players[0];send(host.ws,{type:'opponent_joined',id:player.id,slot:1});send(ws,{type:'opponent_joined',id:host.id,slot:0});broadcast(room,{type:'start'});return;}
  if(!player)return;const room=rooms.get(player.room);if(!room)return;
  if(m.type==='state')broadcast(room,{type:'state',id:player.id,state:m.state},ws);
  if(m.type==='attack')broadcast(room,{type:'attack',id:player.id,attack:m.attack},ws);
  if(m.type==='hit')broadcast(room,{type:'hit',id:player.id,target:m.target,damage:m.damage},ws);
 });
 ws.on('close',()=>{if(!player)return;const room=rooms.get(player.room);if(!room)return;room.players=room.players.filter(p=>p.ws!==ws);broadcast(room,{type:'opponent_left'});if(room.players.length===0)rooms.delete(player.room);});
});
const port=process.env.PORT||3000;server.listen(port,'0.0.0.0',()=>console.log('Melee Arena server listening on '+port));
