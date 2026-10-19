const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core');
const NOW=1000000;
function rich(){const s=C.fresh(NOW);s.camp.stage=3;for(const k in s.resources)s.resources[k]=200;return s;}
function finish(s,id){const r=C.ROOMS.find(r=>r.id===id),t=s.lastTick;assert.ok(C.act(s,{type:'room',id},t).ok);C.advance(s,t+r.seconds*1000);}
test('room work orders charge once, preserve work across reload and finish once offline',()=>{
 const s=rich(),before={...s.resources};assert.ok(C.act(s,{type:'room',id:'roof'},NOW).ok);assert.equal(s.resources.wood,before.wood-8);assert.equal(C.act(s,{type:'room',id:'roof'},NOW).ok,false);assert.equal(C.act(s,{type:'room',id:'kitchen'},NOW).ok,false);
 C.advance(s,NOW+3000);const saved=C.deserialize(C.serialize(s),NOW+3000);assert.equal(saved.home.construction.endsAt,NOW+8000);C.advance(saved,NOW+900000);assert.deepEqual(saved.home.rooms,['roof']);assert.equal(saved.stats.roomsBuilt,1);C.advance(saved,NOW+900000);assert.equal(saved.stats.roomsBuilt,1);assert.ok(C.valid(saved));
});
test('project prerequisites, insufficient materials and stale completion clicks never charge',()=>{
 const s=C.fresh(NOW),before={...s.resources};assert.equal(C.act(s,{type:'room',id:'lights'},NOW).ok,false);assert.equal(C.act(s,{type:'recruit'},NOW).ok,false);assert.deepEqual(s.resources,before);finish(s,'roof');let paid={...s.resources};assert.equal(C.act(s,{type:'room',id:'roof'},s.lastTick).ok,false);assert.equal(C.act(s,{type:'room',id:'kitchen'},s.lastTick).ok,false);assert.deepEqual(s.resources,paid);s.camp.stage=1;s.resources.wood=0;paid={...s.resources};assert.equal(C.act(s,{type:'room',id:'kitchen'},s.lastTick).ok,false);assert.deepEqual(s.resources,paid);
});
test('guest and improvements change actual meal and salvage yields without duplicate recruiting',()=>{
 const s=rich();for(const id of ['roof','kitchen','bunk'])finish(s,id);assert.equal(C.mealReward(s).coins,12);const before={...s.resources};assert.ok(C.act(s,{type:'recruit'},s.lastTick).ok);assert.equal(s.resources.fish,before.fish-3);assert.equal(C.act(s,{type:'recruit'},s.lastTick).ok,false);assert.equal(s.stats.residentsJoined,1);assert.equal(C.mealReward(s).coins,16);for(const id of ['lights','lookout'])finish(s,id);
 const coins=s.resources.coins;assert.ok(C.act(s,{type:'meal',meals:0},s.lastTick).ok);assert.equal(s.resources.coins,coins+16);const wood=s.resources.wood,metal=s.resources.metal;assert.ok(C.act(s,{type:'salvage'},s.lastTick).ok);assert.equal(s.resources.wood,wood+6);assert.equal(s.resources.metal,metal+3);assert.ok(C.valid(s));
});
test('v0.5 migration retains old progression and rejects malformed new room state',()=>{
 const s=rich();delete s.home;delete s.resources.mortar;for(const k of ['roomsBuilt','mortarCollected','residentsJoined'])delete s.stats[k];const loaded=C.deserialize(C.serialize(s),NOW);assert.equal(loaded.camp.stage,3);assert.equal(loaded.resources.resin,200);assert.equal(loaded.resources.mortar,0);assert.deepEqual(loaded.home,{rooms:[],construction:null,resident:false});
 for(const home of [{rooms:['lights'],construction:null,resident:false},{rooms:['roof','roof'],construction:null,resident:false},{rooms:[],construction:null,resident:true},{rooms:[],resident:false,construction:{id:'roof',startedAt:NOW,endsAt:NOW+1}}]){loaded.home=home;assert.equal(C.deserialize(C.serialize(loaded),NOW),null);}
});
test('clock rollback preserves remaining construction time',()=>{const s=rich();C.act(s,{type:'room',id:'roof'},NOW);C.advance(s,NOW+3000);const v=C.deserialize(C.serialize(s),NOW+1000);assert.equal(v.home.construction.endsAt-(NOW+1000),5000);C.advance(v,NOW+5999);assert.ok(v.home.construction);C.advance(v,NOW+6000);assert.deepEqual(v.home.rooms,['roof']);});
test('shark consumes resin and metal once and offline only produces the queued batch',()=>{const s=rich();C.act(s,{type:'build',kind:'mixer',plot:5},NOW);const before={...s.resources};assert.ok(C.act(s,{type:'batch',id:1},NOW).ok);assert.equal(C.act(s,{type:'batch',id:1},NOW).ok,false);C.advance(s,NOW+1000000);C.act(s,{type:'collectAll'},s.lastTick);assert.equal(s.resources.resin,before.resin-1);assert.equal(s.resources.metal,before.metal-2);assert.equal(s.resources.mortar,before.mortar+2);assert.equal(s.stats.mortarCollected,2);assert.ok(C.valid(s));});
test('all 23 goals and five rooms are reachable with normal production, no injected inventory',()=>{
 const s=C.fresh(NOW);let i=0;
 for(;i<1200&&s.quest<C.QUESTS.length;i++){
  const t=NOW+i*20000;C.advance(s,t);C.act(s,{type:'salvage'},t);C.act(s,{type:'collectAll'},t);
  if(C.questDone(s))C.act(s,{type:'quest'},t);
  for(const [kind,plot] of [['filter',5],['fishery',6],['eel',9],['puffer',7],['manatee',10],['mixer',11]])if(!s.buildings.some(b=>b.type===kind))C.act(s,{type:'build',kind,plot},t);
  const f=s.buildings.find(b=>b.type==='filter'),e=s.buildings.find(b=>b.type==='eel');
  if(e&&!s.stats.fed)C.act(s,{type:'feed',id:e.id},t);if(e&&f&&!s.stats.powered)C.act(s,{type:'power',id:f.id},t);
  if(f&&f.level<2&&s.stats.orders)C.act(s,{type:'upgrade',id:f.id},t);
  C.act(s,{type:'camp',stage:s.camp.stage},t);
  const room=C.ROOMS[s.home.rooms.length];if(room)C.act(s,{type:'room',id:room.id},t);C.act(s,{type:'recruit'},t);
  for(const b of s.buildings)if(C.DEFINITIONS[b.type].recipe&&s.resources.water>=12&&s.resources[C.DEFINITIONS[b.type].output]<12&&(b.type!=='mixer'||s.resources.metal>=20))C.act(s,{type:'batch',id:b.id},t);
  if(!s.stats.contracts)C.act(s,{type:'contract',index:s.stats.contracts},t);
  if(s.resources.coins<160)C.act(s,{type:'order'},t);
 }
 assert.equal(s.quest,23,JSON.stringify({quest:s.quest,inventory:s.resources,home:s.home}));assert.equal(s.home.rooms.length,5);assert.ok(s.home.resident);assert.ok(C.valid(s));
});
