const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../src/core');
const View = require('../src/view');
const App = require('../src/app');
const Platform = require('../src/platform');

function harness(storage = new Map(), failWrite = false, gestures = false) {
  let now = 1700000000000;
  const callbacks = {};
  const context = new Proxy({}, { get(target, key) {
    if (key in target) return target[key];
    if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (key === 'measureText') return s => ({ width: s.length * 12 });
    return () => {};
  } });
  const platform = {
    kind: 'test', canvas: { getContext: () => context },
    size: () => ({ width: 390, height: 844, ratio: 1, top: 0, bottom: 0 }),
    read: k => storage.get(k), write: (k, v) => { if (failWrite) throw new Error('quota'); storage.set(k, v); },
    frame: fn => callbacks.frame = fn, onResize: fn => callbacks.resize = fn,
    onPointer: fn => callbacks.pointer = fn, onHide: fn => callbacks.hide = fn,
    onShow: fn => callbacks.show = fn, vibrate() {}, now: () => now
  };
  if(gestures)platform.onGesture=fn=>callbacks.gesture=fn;
  const app = App.start(Core, View, platform);
  const tick = ms => { now += ms; callbacks.frame(); };
  const click = label => {
    const h = app.hitTargets().filter(h => h.label === label).pop(); assert.ok(h, label);
    if(callbacks.gesture){callbacks.gesture({phase:'start',x:h.x+h.w/2,y:h.y+h.h/2});callbacks.gesture({phase:'end',x:h.x+h.w/2,y:h.y+h.h/2});}else callbacks.pointer(h.x + h.w / 2, h.y + h.h / 2); tick(100);
  };
  return { app, storage, callbacks, tick, click, context, getNow: () => now };
}
test('app recovers a corrupt primary from a valid backup and repairs both slots', () => {
  const s = Core.fresh(1700000000000); s.introSeen = true; s.resources.coins = 99;
  const storage = new Map([[App.SAVE_KEY, 'corrupted'], [App.BACKUP_KEY, Core.serialize(s)]]);
  const h = harness(storage);
  assert.equal(h.app.snapshot().resources.coins, 99);
  assert.match(h.app.uiSnapshot().toast, /备份/);
  assert.ok(Core.deserialize(storage.get(App.SAVE_KEY), h.getNow()));
});
test('storage quota failure is surfaced without crashing or removing the playable state', () => {
  const h = harness(new Map(), true);
  assert.equal(h.app.uiSnapshot().storageError, true);
  h.click('开始建设'); h.click('打捞材料');
  assert.equal(h.app.snapshot().stats.salvaged, 1);
  assert.equal(h.app.uiSnapshot().storageError, true);
});
test('welcome sheet blocks underlying resource actions; reset requires a separate confirmation', () => {
  const h = harness();
  h.callbacks.pointer(60, 515); h.tick(100); assert.equal(h.app.snapshot().stats.salvaged, 0);
  h.click('开始建设'); h.click('打捞材料'); h.click('设置'); h.click('重新开始这座家园');
  assert.equal(h.app.snapshot().stats.salvaged, 1);
  h.click('保留家园'); assert.equal(h.app.snapshot().stats.salvaged, 1);
  h.click('重新开始这座家园'); h.click('清空并重新开始');
  assert.equal(h.app.snapshot().stats.salvaged, 0); assert.equal(h.app.uiSnapshot().modal, 'welcome');
  assert.equal(Core.deserialize(h.storage.get(App.BACKUP_KEY), h.getNow()).stats.salvaged, 0);
});
test('hide/show persists, catches up once, and preserves pending production on repeat show', () => {
  const s = Core.fresh(1700000000000); s.introSeen = true;
  Core.act(s, { type: 'build', kind: 'filter', plot: 5 }, s.lastTick);
  const h = harness(new Map([[App.SAVE_KEY, Core.serialize(s)]]));
  h.callbacks.hide(); h.tick(60000); h.callbacks.show(); h.tick(100);
  assert.equal(h.app.snapshot().buildings[0].pending, 6);
  assert.equal(h.app.uiSnapshot().modal, 'offline');
  h.callbacks.show(); h.tick(100); assert.equal(h.app.snapshot().buildings[0].pending, 6);
});
test('WeChat adapter and native entry initialize with no document/window dependencies (mock API)', () => {
  const h = harness(); const callbacks = {}, storage = new Map();
  const oldWx = global.wx, oldFrame = global.requestAnimationFrame;
  global.wx = {
    createCanvas: () => ({ getContext: () => h.context }),
    getWindowInfo: () => ({ windowWidth: 390, windowHeight: 844, pixelRatio: 3, safeArea: { top: 44, bottom: 810 } }),
    getStorageSync: k => storage.get(k), setStorageSync: (k, v) => storage.set(k, v), removeStorageSync: k => storage.delete(k),
    onWindowResize: fn => callbacks.resize = fn, onTouchEnd: fn => callbacks.touch = fn,
    onHide: fn => callbacks.hide = fn, onShow: fn => callbacks.show = fn, vibrateShort() {}
  };
  global.requestAnimationFrame = () => 1;
  try {
    const p = Platform.wechat(); assert.equal(p.size().ratio, 2); assert.equal(p.size().top, 92); assert.equal(p.size().bottom, 34);
    global.wx.getMenuButtonBoundingClientRect = () => ({ bottom: 88 });
    assert.equal(p.size().top, 96);
    global.wx.getMenuButtonBoundingClientRect = () => ({ bottom: 0 });
    assert.equal(p.size().top, 92);
    global.wx.getMenuButtonBoundingClientRect = () => { throw new Error('unavailable'); };
    assert.equal(p.size().top, 92);
    require('../game.js');
    assert.ok(Core.deserialize(storage.get(App.SAVE_KEY), Date.now()));
    assert.equal(typeof callbacks.touch, 'function'); assert.equal(typeof callbacks.hide, 'function');
  } finally { global.wx = oldWx; global.requestAnimationFrame = oldFrame; }
});

test('rapid story clicks before redraw cannot advance or charge the next chapter',()=>{
  const s=Core.fresh(1700000000000);s.introSeen=true;s.home.rooms=['roof','kitchen'];s.camp.stage=1;s.life.author=true;s.stats.fed=1;s.resources.water=20;s.resources.fish=20;
  const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]));h.click('阿昊');h.click('他的故事 · 0/3');
  const target=h.app.hitTargets().find(t=>t.event&&t.event.kind==='storyDo');assert.ok(target);
  h.callbacks.pointer(target.x+target.w/2,target.y+target.h/2);h.callbacks.pointer(target.x+target.w/2,target.y+target.h/2);
  assert.equal(h.app.snapshot().life.stories.crewAuthor,1);assert.equal(h.app.snapshot().resources.water,18);assert.equal(h.app.snapshot().life.owned.includes('desk'),false);
});

test('v1.1 story interaction, replay, decor pagination and reload preserve progress',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;s.life.author=true;s.camp.meals=1;s.salvager.built=true;for(const k in s.resources)s.resources[k]=200;Core.act(s,{type:'build',kind:'puffer',plot:5},s.lastTick);
 const storage=new Map([[App.SAVE_KEY,Core.serialize(s)]]),h=harness(storage);
 h.click(h.app.hitTargets().find(x=>x.label.startsWith('海上怪事')).label);h.click('阿昊的怪味咖啡馆');h.click('海盐咖啡');assert.equal(h.app.snapshot().tales.choices[0].length,1);h.click('下一段小事');h.click('再来一点泡');h.click('下一段小事');h.click('阿昊自己尝');h.click('重看第1段');assert.match(h.app.uiSnapshot().taleResult,/海风味/);h.click('查看纪念装饰');h.click('怪事纪念');assert.ok(h.app.hitTargets().some(x=>x.label.includes('今日怪饮招牌')));const restored=harness(storage);assert.equal(restored.app.snapshot().tales.choices[0].length,3);
});
test('six-floor room viewer supports close, interactions, swapping and panorama without changing original rooms',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;s.life.author=true;s.tower.rooms=Core.SKY_ROOMS.map(r=>r.id);
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]));
 h.click('走进水母洗衣房');h.click('查看房间小事');h.click('启动水母甩干');assert.deepEqual(h.app.snapshot().tower.seen,['laundry']);h.click('关闭弹窗');
 h.click('5F');const before=h.app.hitTargets().find(x=>x.label==='走进海风玻璃温室').x;h.click('免费左右换位');const after=h.app.hitTargets().find(x=>x.label==='走进海风玻璃温室').x;assert.notEqual(before,after);assert.deepEqual(h.app.snapshot().tower.swapped,[5]);
 h.click('整栋看看');assert.equal(h.app.uiSnapshot().towerOverview,true);h.click('返回近景');h.click('3F');h.click('走进海景泡泡浴室');h.click('查看房间小事');h.click('打开海风花洒（房间内）');h.click('关闭弹窗');
 assert.deepEqual(h.app.snapshot().home.rooms,s.home.rooms);assert.ok(Core.valid(h.app.snapshot()));
});
test('tower swipe changes visible floor without triggering room actions; modal blocks swipe',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;s.tower.rooms=Core.SKY_ROOMS.map(r=>r.id);
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]),false,true);
 h.callbacks.gesture({phase:'start',x:120,y:350});h.callbacks.gesture({phase:'move',x:120,y:210});h.callbacks.gesture({phase:'end',x:120,y:210});h.tick(100);
 assert.equal(h.app.uiSnapshot().floor,5);assert.equal(h.app.snapshot().tower.seen.length,0);
 h.click('走进海风玻璃温室');h.click('查看房间小事');h.callbacks.gesture({phase:'start',x:120,y:350});h.callbacks.gesture({phase:'end',x:120,y:210});h.tick(100);assert.equal(h.app.uiSnapshot().floor,5);assert.equal(h.app.uiSnapshot().modal,'skyRoom');h.click('关闭弹窗');
});
test('building completion moves camera to new floor, saves and exposes story detail safely',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;for(const k in s.resources)s.resources[k]=200;
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]));h.click('扩建海景泡泡浴室');h.click('开工 · 海景泡泡浴室');assert.ok(h.app.snapshot().tower.construction);h.tick(13000);assert.deepEqual(h.app.snapshot().tower.rooms,['bath']);assert.equal(h.app.uiSnapshot().floor,3);h.click('查看房间小事');assert.equal(h.app.uiSnapshot().skyRoom,'bath');h.click('关闭弹窗');assert.ok(Core.deserialize(h.storage.get(App.SAVE_KEY),h.getNow()));
});
test('tower camera moves continuously before release, clamps both ends, and clips offscreen room hits',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;s.tower.rooms=Core.SKY_ROOMS.map(r=>r.id);
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]),false,true);h.click('6F');
 h.callbacks.gesture({phase:'start',x:120,y:350});h.callbacks.gesture({phase:'move',x:120,y:327});h.tick(100);assert.equal(h.app.uiSnapshot().towerScroll,23);
 h.callbacks.gesture({phase:'move',x:120,y:279});h.tick(100);assert.equal(h.app.uiSnapshot().towerScroll,71);assert.equal(h.app.snapshot().tower.seen.length,0);
 h.callbacks.gesture({phase:'end',x:120,y:279});h.tick(100);assert.equal(h.app.uiSnapshot().towerScroll,71);
 h.callbacks.gesture({phase:'start',x:120,y:350});h.callbacks.gesture({phase:'end',x:120,y:-2000});h.tick(100);const ui=h.app.uiSnapshot(),c=View.towerCamera(Core,h.app.snapshot(),ui);assert.equal(ui.towerScroll,c.maxScroll);
 const hits=h.app.hitTargets().filter(h=>h.event&&h.event.kind==='skyRoom');assert.ok(hits.every(h=>h.w>0&&h.h>0&&h.y>=184&&h.y+h.h<=553));assert.ok(!hits.some(h=>h.event.id==='rooftop'));
 h.callbacks.gesture({phase:'start',x:120,y:350});h.callbacks.gesture({phase:'end',x:120,y:2000});h.tick(100);assert.equal(h.app.uiSnapshot().towerScroll,0);
 assert.equal(h.app.snapshot().tower.seen.length,0);
});

test('island scene completes through world hotspots, departure and persistent choices',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]));h.tick(100);
 h.click('发现基博岛 · 靠岸');assert.equal(h.app.uiSnapshot().modal,null);assert.equal(h.app.uiSnapshot().islandTravel.kind,'arrive');
 assert.deepEqual(h.app.hitTargets().filter(x=>x.event).map(x=>x.label),['跳过航行动画']);
 h.tick(4300);assert.equal(h.app.uiSnapshot().islandTravel,null);
 h.click('岛务所 · 找岛主');assert.equal(h.app.uiSnapshot().chiefCheeky,true);
 h.click('先听岛民说说');h.click('收起小事 · 继续逛岛');h.click('公共澡堂 · 咔哒咔哒');
 h.click('请螃蟹搬个家');h.click('收起小事 · 继续逛岛');h.click('怪饮摊 · 嘬一口');h.click('尝一口海盐怪饮');
 assert.equal(h.app.snapshot().island.choices.length,3);h.click('岛务所 · 找岛主');h.click('回忆 1');assert.match(h.app.uiSnapshot().islandLine,/大婶/);
 h.click('告别岛主 · 继续航行');assert.equal(h.app.snapshot().island.docked,false);assert.equal(h.app.uiSnapshot().islandTravel.kind,'depart');
 h.click('跳过航行动画');assert.equal(h.app.uiSnapshot().islandScene,false);
 assert.equal(Core.deserialize(h.storage.get(App.SAVE_KEY),h.getNow()).island.choices.length,3);
});
test('island toys do not spend resources, tower swipes stay disabled, home returns keep docking',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]),false,true);h.tick(100);h.click('发现基博岛 · 靠岸');h.click('跳过航行动画');
 const before=h.app.snapshot().resources;h.click('点点螃蟹');h.click('岛民大婶');assert.deepEqual(h.app.snapshot().resources,before);
 h.callbacks.gesture({phase:'start',x:200,y:400});h.callbacks.gesture({phase:'move',x:200,y:250});h.callbacks.gesture({phase:'end',x:200,y:250});h.tick(100);
 assert.equal(h.app.uiSnapshot().towerScroll,null);assert.equal(h.app.uiSnapshot().islandScene,true);
 h.click('返回海楼');assert.equal(h.app.snapshot().island.docked,true);h.click('基博岛 · 已靠岸');assert.equal(h.app.uiSnapshot().islandTravel,null);assert.equal(h.app.snapshot().island.visits,1);
 const restored=harness(h.storage);restored.tick(100);assert.equal(restored.app.uiSnapshot().islandScene,true);assert.equal(restored.app.uiSnapshot().islandTravel,null);
});

test('four island landmarks cycle their own reactions without cost or story progress',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]));h.tick(100);h.click('发现基博岛 · 靠岸');h.click('跳过航行动画');
 const before=h.app.snapshot().resources;
 for(const [id,label] of [['post','贝壳邮局'],['garden','怪蔬菜小园'],['well','回声许愿井'],['drying','海风晾鱼架']]){
  h.click(label);assert.equal(h.app.uiSnapshot().islandEffect.spot,id);assert.equal(h.app.uiSnapshot().islandLine,Core.ISLAND_TOYS[id].lines[0]);
  h.click(label);assert.equal(h.app.uiSnapshot().islandLine,Core.ISLAND_TOYS[id].lines[1]);
 }
 assert.deepEqual(h.app.snapshot().resources,before);assert.deepEqual(h.app.snapshot().island.choices,[]);
 h.click('岛务所 · 找岛主');h.click('先听岛民说说');assert.deepEqual(h.app.snapshot().island.choices,[0]);
});

test('sea chart revisits a completed legacy island immediately with progress intact',()=>{
 const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;s.island={docked:false,choices:[0,1,0],visits:1,nextAt:s.lastTick+300000};
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]));h.tick(100);
 h.click('海上怪事');h.click('海图 · 基博岛');assert.equal(h.app.uiSnapshot().modal,'islandMap');h.click('立即回访基博岛');h.click('跳过航行动画');
 assert.deepEqual(h.app.snapshot().island.choices,[0,1,0]);assert.equal(h.app.snapshot().island.nextAt,0);
 h.click('告别岛主 · 继续航行');h.click('跳过航行动画');h.click('回访基博岛 · 随时');assert.equal(h.app.snapshot().island.docked,true);
});

function sneezeHome(){const s=Core.fresh(1700000000000);s.introSeen=true;s.camp.stage=3;s.home.rooms=Core.ROOMS.map(r=>r.id);s.home.resident=true;s.tower.rooms=Core.SKY_ROOMS.map(r=>r.id);return s;}
test('all three sneeze branches complete, replay and preserve tower camera and resources',()=>{
 const s=sneezeHome(),h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]));
 h.click('5F');const floor=h.app.uiSnapshot().floor,resources=h.app.snapshot().resources;
 h.click('鲨鱼趣闻');h.click('让鲨鱼再胡闹一次');
 for(const label of ['用床单帮它憋住','摇铃，让全楼准备','看看会怎样']){
  h.click(label);assert.equal(h.app.uiSnapshot().sneeze.phase,'play');h.tick(9100);assert.equal(h.app.uiSnapshot().sneeze.phase,'result');
  if(label!=='看看会怎样')h.click('再试另一种办法');
 }
 assert.deepEqual(h.app.snapshot().sneeze.seen,[0,1,2]);h.click('回到我的海楼');assert.equal(h.app.uiSnapshot().floor,floor);assert.deepEqual(h.app.snapshot().resources,resources);
});
test('automatic sneeze defers while a modal or pointer is active, then resumes saved branch',()=>{
 const s=sneezeHome();s.sneeze.activity=4;const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]),false,true);
 h.click('鲨鱼趣闻');h.tick(46000);assert.equal(h.app.uiSnapshot().sneeze,null);h.click('关闭弹窗');
 // Closing the modal permits the ready event on the next frame.
 assert.equal(h.app.uiSnapshot().sneeze.phase,'warn');h.click('摇铃，让全楼准备');
 const restored=harness(h.storage);assert.equal(restored.app.uiSnapshot().sneeze.choice,1);restored.tick(9200);assert.deepEqual(restored.app.snapshot().sneeze.seen,[1]);
});
test('bedsheet drag cancels outside nose and chooses branch zero at target',()=>{
 const h=harness(new Map([[App.SAVE_KEY,Core.serialize(sneezeHome())]]),false,true);h.click('鲨鱼趣闻');h.click('让鲨鱼再胡闹一次');
 for(const target of [[350,200],[142,520]]){h.callbacks.gesture({phase:'start',x:70,y:310});h.callbacks.gesture({phase:'move',x:target[0],y:target[1]});h.callbacks.gesture({phase:'end',x:target[0],y:target[1]});h.tick(100);if(target[0]===350)assert.equal(h.app.uiSnapshot().sneeze.phase,'warn');}
 assert.equal(h.app.uiSnapshot().sneeze.choice,0);
});
test('ready sneeze waits for a held pointer; hiding pauses the performance clock',()=>{
 const s=sneezeHome();s.sneeze.activity=4;const h=harness(new Map([[App.SAVE_KEY,Core.serialize(s)]]),false,true);
 h.callbacks.gesture({phase:'start',x:120,y:350});h.tick(46000);assert.equal(h.app.uiSnapshot().sneeze,null);
 h.callbacks.gesture({phase:'cancel'});h.tick(100);assert.equal(h.app.uiSnapshot().sneeze.phase,'warn');h.click('看看会怎样');
 h.callbacks.hide();h.tick(3000);h.callbacks.show();h.tick(100);assert.equal(h.app.uiSnapshot().sneeze.phase,'play');h.tick(9000);assert.equal(h.app.uiSnapshot().sneeze.phase,'result');
});
