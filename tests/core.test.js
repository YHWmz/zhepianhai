const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const START = 1000000;
function village() { const s = C.fresh(START); s.resources = { wood: 200, metal: 100, water: 0, fish: 20, coins: 200, oxygen: 0, resin: 0, mortar: 0 }; return s; }
function build(s, kind, plot) { assert.equal(C.act(s, { type: 'build', kind, plot }, s.lastTick).ok, true); return s.buildings[s.buildings.length - 1]; }

test('building purchase is atomic; occupied/locked/unknown plots cannot consume resources', () => {
  const s = C.fresh(START);
  const b = build(s, 'filter', 5);
  assert.deepEqual(s.resources, { wood: 6, metal: 4, water: 0, fish: 0, coins: 20, oxygen: 0, resin: 0, mortar: 0 });
  const before = JSON.stringify(s);
  for (const action of [{ type: 'build', kind: 'fishery', plot: 6 }, { type: 'build', kind: 'filter', plot: 5 }, { type: 'build', kind: 'filter', plot: 0 }, { type: 'build', kind: '__proto__', plot: 6 }]) {
    assert.equal(C.act(s, action, START).ok, false); assert.equal(JSON.stringify(s), before);
  }
  assert.equal(b.id, 1);
});
test('water and fish produce without power, respecting exact cycle and pending capacity', () => {
  const s = village(), f = build(s, 'filter', 5), fish = build(s, 'fishery', 6);
  C.advance(s, START + 11999); assert.equal(f.pending, 0);
  C.advance(s, START + 12000); assert.equal(f.pending, 2);
  C.advance(s, START + 18000); assert.equal(fish.pending, 1);
  C.advance(s, START + 100000); assert.equal(f.pending, 6); assert.equal(fish.pending, 4);
  assert.equal(f.progress, 0);
  C.act(s, { type: 'collect', id: f.id }, s.lastTick); assert.equal(s.resources.water, 6); assert.equal(f.pending, 0);
  C.advance(s, s.lastTick + 12000); assert.equal(f.pending, 2);
});
test('repeated collection cannot duplicate production, including a partial warehouse transfer', () => {
  const s = village(), f = build(s, 'filter', 5); C.advance(s, START + 36000);
  s.resources.water = 498;
  assert.equal(C.act(s, { type: 'collect', id: f.id }, s.lastTick).ok, true);
  assert.equal(s.resources.water, 500); assert.equal(f.pending, 4);
  assert.equal(C.act(s, { type: 'collect', id: f.id }, s.lastTick).ok, false);
  assert.equal(f.pending, 4); assert.equal(s.stats.waterCollected, 2);
});
test('feeding deducts fish once and power allocation cannot exceed capacity', () => {
  const s = village(), eel = build(s, 'eel', 5);
  const filters = [6, 7, 9, 10].map(p => build(s, 'filter', p));
  assert.equal(C.act(s, { type: 'power', id: filters[0].id }, START).ok, false);
  C.act(s, { type: 'feed', id: eel.id }, START); assert.equal(s.resources.fish, 18);
  for (let i = 0; i < 3; i++) assert.equal(C.act(s, { type: 'power', id: filters[i].id }, START).ok, true);
  assert.equal(C.act(s, { type: 'power', id: filters[3].id }, START).ok, false);
  assert.deepEqual(C.power(s, START), { total: 3, used: 3, active: filters.slice(0, 3).map(b => b.id) });
  C.advance(s, START + 6000); assert.equal(filters[0].pending, 2); assert.equal(filters[3].pending, 0);
});
test('offline catch-up crosses fuel expiry with correct fast/slow production', () => {
  const s = village(), eel = build(s, 'eel', 5), filter = build(s, 'filter', 6);
  eel.fuelUntil = START + 3000; filter.powered = true;
  C.advance(s, START + 6000); assert.equal(filter.pending, 0); assert.equal(filter.progress, 9);
  C.advance(s, START + 9000); assert.equal(filter.pending, 2);
  assert.equal(C.power(s, s.lastTick).total, 0);
});
test('one offline jump and many live ticks produce identical inventory and progress', () => {
  const s = village(), eel = build(s, 'eel', 5), filter = build(s, 'filter', 6); build(s, 'fishery', 7);
  eel.fuelUntil = START + 7000; filter.powered = true;
  const copy = JSON.parse(JSON.stringify(s));
  C.advance(s, START + 29000);
  for (let t = START + 100; t <= START + 29000; t += 100) C.advance(copy, t);
  assert.deepEqual(copy.resources, s.resources);
  for (let i = 0; i < s.buildings.length; i++) {
    assert.equal(copy.buildings[i].pending, s.buildings[i].pending);
    assert.ok(Math.abs(copy.buildings[i].progress - s.buildings[i].progress) < 1e-6);
  }
});
test('offline rewards are capped, and repeated same-time catch-up grants nothing', () => {
  const s = village(); build(s, 'filter', 5); s.salvage = 0;
  const result = C.advance(s, START + 86400000);
  assert.equal(result.elapsed, C.OFFLINE_MAX); assert.equal(s.buildings[0].pending, 6); assert.equal(s.salvage, 3);
  const before = JSON.stringify(s); C.advance(s, START + 86400000); assert.equal(JSON.stringify(s), before);
});
test('feeding cap rejects without charging; empty fish cannot fuel the generator', () => {
  const s = village(), eel = build(s, 'eel', 5);
  for (let i = 0; i < 5; i++) assert.equal(C.act(s, { type: 'feed', id: eel.id }, START).ok, true);
  const before = s.resources.fish;
  assert.equal(C.act(s, { type: 'feed', id: eel.id }, START).ok, false); assert.equal(s.resources.fish, before);
  s.resources.fish = 0; assert.equal(C.act(s, { type: 'feed', id: eel.id }, START + 180000).ok, false);
});
test('salvage replenishes only to its cap and failed actions do not consume it', () => {
  const s = C.fresh(START);
  for (let i = 0; i < 3; i++) C.act(s, { type: 'salvage' }, START);
  assert.equal(s.salvage, 0); assert.equal(s.resources.wood, 28);
  assert.equal(C.act(s, { type: 'salvage' }, START).ok, false);
  C.advance(s, START + 20000); assert.equal(s.salvage, 1);
  s.resources.wood = 500; s.resources.metal = 500; assert.equal(C.act(s, { type: 'salvage' }, s.lastTick).ok, false); assert.equal(s.salvage, 1);
});
test('orders require exact inventory and award once; overflow is rejected atomically', () => {
  const s = C.fresh(START); assert.equal(C.act(s, { type: 'order' }, START).ok, false);
  s.resources.water = 6;
  assert.equal(C.act(s, { type: 'order' }, START).ok, true); assert.equal(s.resources.water, 0); assert.equal(s.resources.coins, 40);
  assert.equal(C.act(s, { type: 'order' }, START).ok, false);
  s.resources.fish = 4; s.resources.coins = 500;
  assert.equal(C.act(s, { type: 'order' }, START).ok, false); assert.equal(s.resources.fish, 4);
});
test('upgrade and expansion spend correctly; moving preserves production and rejects collisions', () => {
  const s = village(), f = build(s, 'filter', 5);
  C.advance(s, START + 6000);
  assert.equal(C.act(s, { type: 'upgrade', id: f.id }, s.lastTick).ok, true); assert.equal(f.level, 2);
  assert.equal(C.amount(f), 3); assert.equal(C.capacity(f), 9);
  assert.equal(C.act(s, { type: 'move', id: f.id, plot: 6 }, s.lastTick).ok, true); assert.equal(f.progress, 6);
  assert.equal(C.act(s, { type: 'move', id: f.id, plot: 0 }, s.lastTick).ok, false);
  assert.equal(C.act(s, { type: 'expand', plot: 0 }, s.lastTick).ok, false);
  assert.equal(C.act(s, { type: 'expand', plot: 1 }, s.lastTick).ok, true);
  assert.equal(C.act(s, { type: 'expand', plot: 1 }, s.lastTick).ok, false);
});
test('validated saves reject corruption, impossible state and future schema', () => {
  const s = village(); build(s, 'filter', 5);
  assert.deepEqual(C.deserialize(C.serialize(s), START), s);
  assert.equal(C.deserialize(C.serialize(s).replace('200', '299'), START), null);
  for (const mutate of [x => x.resources.wood = -1, x => x.buildings[0].progress = null, x => x.version = 99, x => x.plots.push(5), x => x.resources.water = 501]) {
    const copy = JSON.parse(JSON.stringify(s)); mutate(copy); assert.equal(C.deserialize(C.serialize(copy), START), null);
  }
});
test('clock rollback preserves remaining fuel duration and allows production to resume', () => {
  const s = village(), e = build(s, 'eel', 5); C.act(s, { type: 'feed', id: e.id }, START);
  const loaded = C.deserialize(C.serialize(s), START - 10000);
  assert.equal(loaded.lastTick, START - 10000); assert.equal(loaded.buildings[0].fuelUntil - loaded.lastTick, 180000);
});
test('all ten onboarding goals are reachable from a fresh save without injected resources', () => {
  const s = C.fresh(START);
  const claim = () => { assert.equal(C.questDone(s), true, 'quest ' + s.quest); assert.equal(C.act(s, { type: 'quest' }, s.lastTick).ok, true); };
  C.act(s, { type: 'salvage' }, s.lastTick); claim();
  const filter = build(s, 'filter', 5); claim();
  C.advance(s, s.lastTick + 12000); C.act(s, { type: 'collect', id: filter.id }, s.lastTick); claim();
  const fish = build(s, 'fishery', 6); claim();
  C.advance(s, s.lastTick + 36000); C.act(s, { type: 'collect', id: fish.id }, s.lastTick); claim();
  const eel = build(s, 'eel', 9); claim();
  C.act(s, { type: 'feed', id: eel.id }, s.lastTick); claim();
  C.act(s, { type: 'power', id: filter.id }, s.lastTick); claim();
  C.act(s, { type: 'collect', id: filter.id }, s.lastTick); C.act(s, { type: 'order' }, s.lastTick); claim();
  C.act(s, { type: 'upgrade', id: filter.id }, s.lastTick); claim();
  assert.equal(s.quest, 10); assert.equal(C.valid(s), true);
});

test('legacy saves gain camp progress without changing resources or buildings', () => {
  const s = village(); build(s, 'filter', 5); delete s.camp;
  const loaded = C.deserialize(C.serialize(s), START);
  assert.deepEqual(loaded.resources, s.resources); assert.deepEqual(loaded.buildings, s.buildings);
  assert.deepEqual(loaded.camp, { stage: 0, meals: 0, nextMealAt: 0 });
  loaded.camp.stage = 4; assert.equal(C.deserialize(C.serialize(loaded), START), null);
});
test('camp projects enforce conditions, exact costs and stale-click rejection', () => {
  const s = village(), before = {...s.resources};
  assert.equal(C.act(s,{type:'camp',stage:0},START).ok,false); assert.deepEqual(s.resources,before);
  build(s,'filter',5); build(s,'fishery',6); s.resources.water=10;
  const cost=C.CAMP_PROJECTS[0].cost, paid={...s.resources};
  assert.equal(C.act(s,{type:'camp',stage:0},START).ok,true);
  for(const k in cost) assert.equal(s.resources[k],paid[k]-cost[k]);
  const after={...s.resources}; assert.equal(C.act(s,{type:'camp',stage:0},START).ok,false); assert.deepEqual(s.resources,after);
  assert.equal(C.act(s,{type:'camp',stage:1},START).ok,false);
});
test('resident meals preserve economy on duplicate, cooldown and full-wallet failures', () => {
  const s=village();s.camp.stage=1;s.resources.water=10;
  assert.equal(C.act(s,{type:'meal',meals:0},START).ok,true);
  const paid={...s.resources};assert.equal(C.act(s,{type:'meal',meals:0},START).ok,false);assert.deepEqual(s.resources,paid);
  assert.equal(C.act(s,{type:'meal',meals:1},START+59000).ok,false);
  const loaded=C.deserialize(C.serialize(s),START-5000);assert.equal(loaded.camp.nextMealAt-(START-5000),1000);
  s.resources.coins=500;assert.equal(C.act(s,{type:'meal',meals:1},START+60000).ok,false);assert.equal(s.camp.meals,1);
});
test('all camp projects are reachable through normal production and trade', () => {
  const s=C.fresh(START);
  for(let i=0;i<180&&s.camp.stage<3;i++) {
    const now=START+i*20000;C.advance(s,now);
    C.act(s,{type:'salvage'},now);C.act(s,{type:'collectAll'},now);
    if(C.questDone(s))C.act(s,{type:'quest'},now);
    for(const [kind,plot] of [['filter',5],['fishery',6],['eel',9]])if(!s.buildings.some(b=>b.type===kind))C.act(s,{type:'build',kind,plot},now);
    const eel=s.buildings.find(b=>b.type==='eel'),filter=s.buildings.find(b=>b.type==='filter');
    if(eel&&!s.stats.fed)C.act(s,{type:'feed',id:eel.id},now);
    if(filter&&eel&&!s.stats.powered)C.act(s,{type:'power',id:filter.id},now);
    if(filter&&filter.level<2&&s.stats.orders)C.act(s,{type:'upgrade',id:filter.id},now);
    C.act(s,{type:'camp',stage:s.camp.stage},now);
    if(s.resources.coins<130)C.act(s,{type:'order'},now);
  }
  assert.equal(s.camp.stage,3);assert.ok(C.valid(s));
  assert.equal(C.deserialize(C.serialize(s),s.lastTick).camp.stage,3);
});

test('sneeze migration, gating, three endings and repeat completion are safe',()=>{
 const s=village();delete s.sneeze;const old=C.deserialize(C.serialize(s),START);assert.deepEqual(old.sneeze,C.sneezeFresh());
 assert.equal(C.act(old,{type:'sneezeBegin',manual:true},START).ok,false);
 old.camp.stage=3;old.home.rooms=C.ROOMS.map(r=>r.id);old.home.resident=true;const resources={...old.resources};
 assert.equal(C.sneezeReady(old,START),false);old.sneeze.activity=4;assert.equal(C.sneezeReady(old,START),true);
 for(const choice of [0,1,2,0]){
  assert.equal(C.act(old,{type:'sneezeBegin',manual:true},START).ok,true);
  assert.equal(C.act(old,{type:'sneezeFinish'},START).ok,false);
  assert.equal(C.act(old,{type:'sneezeChoose',choice:99},START).ok,false);
  assert.equal(C.act(old,{type:'sneezeChoose',choice},START).ok,true);
  assert.ok(C.deserialize(C.serialize(old),START));
  assert.equal(C.act(old,{type:'sneezeChoose',choice:1},START).ok,false);
  assert.equal(C.act(old,{type:'sneezeFinish'},START).ok,true);
  assert.equal(C.act(old,{type:'sneezeFinish'},START).ok,false);
 }
 assert.deepEqual(old.sneeze.seen,[0,1,2]);assert.deepEqual(old.resources,resources);
 old.sneeze.activity=4;assert.equal(C.sneezeReady(old,START+179999),false);assert.equal(C.sneezeReady(old,START+180000),true);
 old.sneeze.seen=[0,0];assert.equal(C.deserialize(C.serialize(old),START),null);
});
