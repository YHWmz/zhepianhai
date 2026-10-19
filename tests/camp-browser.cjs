// Isolated QA fixtures; never writes to an existing user's browser profile.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const C=require('../src/core');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'tidehaven-camp-'));
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const now=Date.now(),s=C.fresh(now);s.introSeen=true;s.quest=10;for(const k in s.resources)s.resources[k]=300;
 for(const [kind,plot] of [['filter',5],['fishery',6],['eel',9]])C.act(s,{type:'build',kind,plot},now);
 C.act(s,{type:'feed',id:3},now);C.act(s,{type:'upgrade',id:1},now);
 await page.addInitScript(value=>{if(!sessionStorage.getItem('camp-fixture')){localStorage.setItem('tidehaven.save.v1',value);sessionStorage.setItem('camp-fixture','1')}},C.serialize(s));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.tidehaven?.uiSnapshot().artLoaded===15);
 async function click(label){const h=await page.evaluate(l=>tidehaven.hitTargets().filter(h=>h.label===l).pop(),label);assert.ok(h,label);const b=await page.locator('canvas').boundingBox(),scale=Math.min(b.width/390,b.height/844);await page.mouse.click(b.x+(b.width-390*scale)/2+(h.x+h.w/2)*scale,b.y+(b.height-844*scale)/2+(h.y+h.h/2)*scale);await page.waitForTimeout(90);}
 await page.screenshot({path:path.join(artifacts,'raft.png')});
 for(let stage=0;stage<3;stage++){
  await click('居民与营地升级');await page.screenshot({path:path.join(artifacts,'project-'+stage+'.png')});
  const before=await page.evaluate(()=>tidehaven.snapshot());await click('确认建设 · '+C.CAMP_PROJECTS[stage].result);
  const after=await page.evaluate(()=>tidehaven.snapshot());assert.equal(after.camp.stage,stage+1);
  for(const [k,n] of Object.entries(C.CAMP_PROJECTS[stage].cost))assert.equal(after.resources[k],before.resources[k]-n);
  await page.waitForTimeout(3400);await page.screenshot({path:path.join(artifacts,'stage-'+(stage+1)+'.png')});
 }
 await click('居民');await page.screenshot({path:path.join(artifacts,'residents.png')});
 const before=await page.evaluate(()=>tidehaven.snapshot());await click('给居民开饭');await click('给居民开饭');const after=await page.evaluate(()=>tidehaven.snapshot());assert.equal(after.camp.meals,1);assert.equal(after.resources.coins,before.resources.coins+8);assert.equal(after.resources.water,before.resources.water-2);
 await click('查看卷姨');await click('整一个表情');await page.screenshot({path:path.join(artifacts,'boss.png')});await click('回去开工');
 await page.reload();await page.waitForFunction(()=>window.tidehaven?.uiSnapshot().artLoaded===15);assert.equal((await page.evaluate(()=>tidehaven.snapshot())).camp.stage,3);assert.equal((await page.evaluate(()=>tidehaven.snapshot())).camp.meals,1);
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(150);await page.screenshot({path:path.join(artifacts,'small.png')});
 await click('居民与营地升级');await page.screenshot({path:path.join(artifacts,'completed-small.png')});await click('回去开工');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',artifacts,checks:['three camp upgrades and exact costs','meal double click','third resident portrait','reload persistence','320px camp layout','no errors']}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
