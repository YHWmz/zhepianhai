const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const C=require('../src/core');const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'tidehaven-workshop-')),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const now=Date.now(),s=C.fresh(now);s.introSeen=true;s.quest=10;s.camp.stage=2;for(const k of ['wood','metal','water','fish','coins'])s.resources[k]=300;
 for(const [kind,plot]of [['filter',5],['fishery',6],['eel',9]])C.act(s,{type:'build',kind,plot},now);C.act(s,{type:'feed',id:3},now);
 // Start with an actual v0.4-shaped save in a fresh isolated context.
 delete s.resources.oxygen;delete s.resources.resin;for(const k of ['oxygenCollected','resinCollected','contracts'])delete s.stats[k];
 await page.addInitScript(value=>{if(!sessionStorage.getItem('workshop-fixture')){localStorage.setItem('tidehaven.save.v1',value);sessionStorage.setItem('workshop-fixture','1')}},C.serialize(s));
 await page.clock.install({time:new Date(now)});await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.tidehaven?.uiSnapshot().artLoaded===15,null,{polling:100});await page.clock.runFor(100);
 async function click(label,kind){const h=await page.evaluate(({label,kind})=>tidehaven.hitTargets().filter(h=>kind?h.event?.kind==='build'&&h.event.value===kind:h.label===label).pop(),{label,kind});assert.ok(h,label||kind);const b=await page.locator('canvas').boundingBox(),z=Math.min(b.width/390,b.height/844);await page.mouse.click(b.x+(b.width-390*z)/2+(h.x+h.w/2)*z,b.y+(b.height-844*z)/2+(h.y+h.h/2)*z);await page.clock.runFor(100);}
 const snap=()=>page.evaluate(()=>tidehaven.snapshot());const advance=async ms=>{await page.clock.fastForward(ms);await page.clock.runFor(100)};
 await click('工坊');assert.equal((await snap()).resources.oxygen,0);await page.screenshot({path:path.join(artifacts,'unbuilt.png')});
 await click('建造增氧机');await click(null,'puffer');await click('建造化工厂');await click(null,'manatee');
 await click('管理增氧机 · 特写 / 供电 / 升级');await click('开启电力加速 · 占用 1 电力');await click('设备特写');await page.screenshot({path:path.join(artifacts,'puffer.png')});await click('关闭弹窗');await click('工坊');
 for(let i=0;i<3;i++){const before=(await snap()).resources.water;await click('投料增氧机');await click('投料增氧机');assert.equal((await snap()).resources.water,before-2);await advance(11000);await click('收取氧气瓶');}
 assert.equal((await snap()).resources.oxygen,9);
 const water=(await snap()).resources.water;await click('投料化工厂');await advance(5000);await page.evaluate(()=>tidehaven.save());await page.reload();await page.clock.runFor(100);await page.waitForFunction(()=>tidehaven.uiSnapshot().artLoaded===15,null,{polling:100});
 assert.equal((await snap()).buildings.find(b=>b.type==='manatee').batch,true);assert.equal((await snap()).resources.water,water-3);
 await click('工坊');await advance(26000);await click('收取海工树脂');await click('投料化工厂');await advance(31000);await click('收取海工树脂');assert.equal((await snap()).resources.resin,2);
 await advance(3400);await page.screenshot({path:path.join(artifacts,'workshop.png')});const coins=(await snap()).resources.coins;await click('交付工坊订单');assert.equal((await snap()).stats.contracts,1);assert.equal((await snap()).resources.coins,coins+60);
 await click('管理化工厂 · 特写 / 供电 / 升级');await click('设备特写');await advance(3400);await page.screenshot({path:path.join(artifacts,'manatee.png')});const portraitWater=(await snap()).resources.water;await click('投料开工');assert.equal((await snap()).resources.water,portraitWater-3);assert.equal((await snap()).buildings.find(b=>b.type==='manatee').batch,true);await click('关闭弹窗');await click('工坊');
 await page.setViewportSize({width:320,height:568});await page.clock.runFor(150);await page.screenshot({path:path.join(artifacts,'small.png')});assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',artifacts,checks:['v0.4 migration','build two machines','power speed','duplicate input protection','partial batch reload','recipe collection','contract exact payment','portrait and 320px UI','no errors']}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
