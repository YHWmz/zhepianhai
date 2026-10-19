(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TideApp = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SAVE_KEY = 'tidehaven.save.v1';
  const BACKUP_KEY = 'tidehaven.backup.v1';
  function start(Core, View, platform) {
    const now = platform.now();
    let state = null, recovered = false, storageError = false, damaged = false;
    try {
      const primary = platform.read(SAVE_KEY);
      state = Core.deserialize(primary, now);
      if (!state) {
        state = Core.deserialize(platform.read(BACKUP_KEY), now); recovered = !!state;
        damaged = !!primary && !state;
      }
    } catch (_) { storageError = true; }
    state = state || Core.fresh(now);
    const elapsed = now - state.lastTick;
    const catchup = Core.advance(state, now, true);
    const ui = {
      tower: state.home.rooms.includes('lookout'), floor: Math.max(3,Core.towerTop(state)), towerOverview: false, towerScroll: null, roomEffect: null,
      tab: 'home', modal: !state.introSeen ? 'welcome' : null, selected: null, buildPlot: null, moveId: null, layoutMode: false,
      toast: null, toastUntil: 0, savedAt: 0, storageError, offline: null, resetConfirm: false, lastFrame: 0, paused: false,
      effects: [], artLoaded: 0, artFailed: [], reducedMotion: platform.reducedMotion,
      buildPage: 0, workshopPage: 0, roomIndex: 0, crew: 'crewTank', crewReaction: null, crewPoseUntil: 0, storyWho: 'crewAuthor', decorPage: 0, gesture: null, photo: false, photoPose: 0, photoClean: false, sceneReply: null, nextVignette: now+18000
    };
    if (elapsed > 30000 && state.introSeen) {
      ui.offline = { elapsed: catchup.elapsed, produced: catchup.produced }; ui.modal = 'offline';
    }
    let hits = [], lastSave = now, viewSize = null, transform = { scale: 1, x: 0, y: 0 };
    const context = platform.canvas.getContext('2d');
    function loadArt(src){
      if(platform.kind==='browser')return platform.loadImage(src.replace('assets/','assets/webp/').replace('.png','.webp')).catch(()=>platform.loadImage(src));
      return platform.loadImage(src);
    }
    // Local image assets are optional: the procedural renderer remains a working fallback.
    if (platform.loadImage && View.setAssets) {
      ['filter', 'fishery', 'eel', 'ocean', 'dock', 'raft', 'tower', 'shark', 'cast', 'puffer', 'manatee', 'rooms', 'mixer', 'diver', 'octopus'].forEach(kind => {
        loadArt('assets/' + kind + (kind==='octopus' ? '-v9.png' : ['rooms','mixer','diver'].includes(kind) ? '-v8.png' : ['puffer','manatee'].includes(kind) ? '-v5.png' : ['raft', 'tower', 'shark', 'cast'].includes(kind) ? '-v4.png' : '-v2.png')).then(img => {
          View.setAssets({ [kind]: img }); ui.artLoaded++;
        }).catch(() => { ui.artFailed.push(kind); });
      });
    }
    if(platform.loadImage)for(const kind of ['author','decor'])loadArt('assets/'+kind+'-v10.png').then(img=>{View.setAssets({[kind]:img});ui.artLoaded++;}).catch(()=>ui.artFailed.push(kind));
    if(platform.loadImage)loadArt('assets/skyrooms-v12.png').then(img=>{View.setAssets({skyrooms:img});ui.artLoaded++;}).catch(()=>ui.artFailed.push('skyrooms'));
    function toast(message) { ui.toast = message; ui.toastUntil = platform.now() + 3300; }
    function save() {
      try {
        const serialized = Core.serialize(state);
        // Both slots contain the latest successful snapshot; the backup can recover a damaged primary.
        platform.write(SAVE_KEY, serialized);
        platform.write(BACKUP_KEY, serialized);
        ui.storageError = false; ui.savedAt = platform.now(); lastSave = ui.savedAt;
      } catch (_) { ui.storageError = true; lastSave = platform.now(); }
    }
    function resize() {
      viewSize = platform.size();
      const r = viewSize.ratio;
      platform.canvas.width = Math.round(viewSize.width * r);
      platform.canvas.height = Math.round(viewSize.height * r);
      const available = viewSize.height - viewSize.top - viewSize.bottom;
      transform.scale = Math.min(viewSize.width / 390, available / 844);
      transform.x = (viewSize.width - 390 * transform.scale) / 2;
      transform.y = viewSize.top + (available - 844 * transform.scale) / 2;
    }
    function dispatch(action) {
      const n = platform.now();
      const result = Core.act(state, action, n);
      toast(result.message);
      save();
      if (result.ok) {
        platform.vibrate();
        if(state.life.sound&&platform.sound)platform.sound(action.type);
        if(result.line){ui.storyResult=result;ui.crewReaction={who:result.who,line:result.line,until:n+7000,action:'story'};}
        const b = action.id ? Core.getBuilding(state, action.id) : action.type === 'build' ? state.buildings[state.buildings.length - 1] : null;
        const labels = { batch: '开工！', contract: '接大单！', build: '开工大吉！', collect: '出货啦！', collectAll: '一网打尽！', feed: '来电了！', upgrade: '进化！', salvage: '捡到宝了！', expand: '地盘 +1', order: '老板大气！', power: b && b.powered ? '火力全开！' : '摸鱼模式' };
        if (labels[action.type]) ui.effects.push({ time: n, type: action.type, id: b ? b.id : null, plot: b ? b.plot : action.plot, label: labels[action.type] });
        ui.effects = ui.effects.filter(e => n - e.time < 2200).slice(-5);
        if (['camp','build','upgrade'].includes(action.type)) ui.buildAnimationUntil = n + 5000;
        const reactions = {
          room: ['crewTank', '锅先戴头上，屋顶马上就好！'],
          recruit: ['crewDiver', '我自带扳手，床位能打折吗？'],
          batch: ['crewWire', '河豚憋口气，海牛慢慢搅！'],
          contract: ['crewBoss', '这批树脂的钱，够买新锅了！'],
          camp: ['crewBoss', '房子变了！房租……先不涨。'],
          meal: ['crewBoss', '饭管够，锅别拿去改发电机！'],
          salvage: ['crewTank', '捡到了！这锅盖比我的还新！'],
          feed: ['crewWire', '鱼刚下肚，我的头发先来电了！'],
          order: ['crewTank', '钱到账了！今晚泳圈加个鸭腿！'],
          build: ['crewWire', '原理我不懂，但气势必须有！'],
          collect: ['crewTank', '有产出了！我的操作果然很科学！'],
          collectAll: ['crewTank', '全部收走！老板看见没？'],
          upgrade: ['crewWire', '升级成功！多出来的螺丝先藏起来。']
        };
        if (reactions[action.type]) {
          const [who, line] = reactions[action.type];
          ui.crewReaction = { who, line, until: n + 5500, action: action.type };
        }
      }
      return result;
    }
    function handle(event) {
      const n=platform.now();
      switch (event.kind) {
        case 'tales': ui.taleResult=null;ui.modal='tales';break;
        case 'episodeOpen': ui.episode=event.index;ui.taleReplay=null;ui.taleResult=null;ui.modal='episode';break;
        case 'episodeChoose': {const result=dispatch({type:'episode',episode:ui.episode,step:state.tales.choices[ui.episode].length,choice:event.choice});if(result.ok){ui.taleResult=result.taleLine;ui.taleActedAt=n;ui.sceneReply={line:result.taleLine,until:n+6000};}break;}
        case 'episodeNext':ui.taleResult=null;break;
        case 'episodeReplay':ui.taleReplay=event.step;ui.taleResult=Core.EPISODES[ui.episode].steps[event.step][3][state.tales.choices[ui.episode][event.step]];ui.taleActedAt=n;break;
        case 'anticOpen':ui.antic=event.index;ui.taleResult=null;ui.modal='antic';break;
        case 'anticDo':{const result=dispatch({type:'antic',index:ui.antic});if(result.ok){ui.taleResult=result.taleLine;ui.taleActedAt=n;ui.sceneReply={line:result.taleLine,until:n+6000};}break;}

        case 'story': ui.storyWho=event.who||ui.crew;ui.storyResult=null;ui.modal='story';break;
        case 'storyRecall': ui.recallIndex=event.index;ui.storyResult={who:event.who,line:Core.STORIES[event.who][event.index][5]};break;
        case 'storyDo': dispatch({type:'story',who:event.who,index:event.index});break;
        case 'author': ui.crew='crewAuthor';ui.modal=state.life.author?'crew':'author';break;
        case 'authorJoin': if(dispatch({type:'authorJoin'}).ok){ui.crew='crewAuthor';ui.modal='crew';}break;
        case 'decor': ui.modal='decor';break;
        case 'decorPage': ui.decorPage=event.value;break;
        case 'decorTap': {
          const d=Core.DECOR.find(d=>d.id===event.id);ui.sceneReply={line:d.reply,until:n+4000};ui.decorEffect={id:d.id,until:n+4000};
          if(state.life.sound&&platform.sound)platform.sound('decor');break;
        }
        case 'visitor': ui.modal='visitor';break;
        case 'interact': ui.interact=event.value;ui.interactId=event.id||null;ui.gesture=null;ui.modal='interact';break;
        case 'interactDo': finishInteraction();break;
        case 'photo': ui.photo=true;ui.modal=null;ui.selected=null;ui.layoutMode=false;break;
        case 'photoExit': ui.photo=false;break;
        case 'photoPose': ui.photoPose=(ui.photoPose+1)%4;break;
        case 'photoSave': {
          if(!platform.exportPhoto){toast('当前平台暂不支持导出');break;}
          ui.photoClean=true;render(platform.now());
          platform.exportPhoto().then(()=>toast('照片已导出')).catch(e=>toast(e.message||'照片导出失败')).finally(()=>{ui.photoClean=false;});break;
        }

        case 'tab': ui.tab = event.value; ui.selected = null; ui.moveId = null; ui.modal = null; ui.layoutMode = false; break;
        case 'layout': ui.layoutMode = !ui.layoutMode; ui.selected = null; ui.moveId = null; break;
        case 'close': ui.gesture=null;ui.modal = null; ui.resetConfirm = false; break;
        case 'welcome': dispatch({ type: 'intro' }); ui.modal = null; if(state.life.opening===0)toast('阿桶的锅快接满了！点屋顶，帮大家补好第一间房。'); break;
        case 'settings': ui.modal = 'settings'; ui.resetConfirm = false; break;
        case 'upgradeModal': ui.modal = 'upgrade'; break;
        case 'buildPage': ui.buildPage=event.value; break;
        case 'workBuild': {
          ui.buildPlot=state.plots.find(p=>!state.buildings.some(b=>b.plot===p));
          if(ui.buildPlot===undefined){ui.tab='home';ui.layoutMode=true;toast('甲板已满，请先扩建');}
          else {ui.buildPage=1;ui.modal='build';} break;
        }
        case 'workManage': ui.selected=event.id;ui.tab='home';ui.layoutMode=false;break;
        case 'salvager': ui.modal='salvager';break;
        case 'source': ui.sourceReturn=ui.modal;ui.sourceKey=event.key;ui.sourceNeed=event.need||Math.min(Core.CAP,state.resources[event.key]+1);ui.modal='source';break;
        case 'sourceBack': ui.modal=ui.sourceReturn||null;break;
        case 'sourceGo':
          ui.modal=null;ui.tab='home';ui.selected=null;ui.layoutMode=false;
          if(event.value==='salvager')ui.modal='salvager';
          else if(event.value==='orders')ui.tab='orders';
          else if(event.value==='salvage')toast('点击下方打捞材料，漂流物每 20 秒补充一份');
          else handle({kind:'facility',value:event.value});
          break;
        case 'workshopPage': ui.workshopPage=event.value; break;
        case 'towerEnter': ui.tower=true;ui.floor=Math.max(3,Core.towerTop(state));ui.towerScroll=null;ui.selected=null;ui.modal=null;break;
        case 'towerExit': ui.tower=false;ui.selected=null;break;
        case 'towerOverview': ui.towerOverview=!ui.towerOverview;break;
        case 'floor': if(event.value<=Core.towerReach(state)){ui.floor=event.value;ui.towerScroll=null;ui.towerOverview=false;}else toast('建好当前楼层后，就能向上扩建');break;
        case 'skyRoom': ui.skyRoom=event.id;if(state.tower.rooms.includes(event.id)){if(dispatch({type:'towerPlay',id:event.id}).ok)ui.roomEffect={id:event.id,until:n+6000};}else ui.modal='skyRoom';break;
        case 'skyRoomDetail': ui.skyRoom=event.id||ui.skyRoom;ui.modal='skyRoom';break;
        case 'towerBuild': if(dispatch({type:'towerBuild',id:event.id}).ok){ui.modal=null;ui.tower=true;ui.towerOverview=false;ui.floor=Core.SKY_ROOMS.find(r=>r.id===event.id).floor;ui.towerScroll=null;}break;
        case 'towerPlay': if(dispatch({type:'towerPlay',id:event.id}).ok){ui.roomEffect={id:event.id,until:n+6000};}break;
        case 'towerSwap': dispatch({type:'towerSwap',floor:event.floor});break;
        case 'rooms': ui.roomIndex=Math.min(state.home.rooms.length,Core.ROOMS.length-1);ui.modal='rooms'; break;
        case 'roomPage': ui.roomIndex=event.value;break;
        case 'roomStart': if(dispatch({type:'room',id:event.id}).ok){ui.modal=null;ui.tab='home';ui.selected=null;ui.layoutMode=false;}break;
        case 'camp': ui.modal = 'camp'; break;
        case 'confirmCamp': if (dispatch({ type: 'camp', stage: event.stage }).ok) { ui.modal = null; ui.layoutMode = false; ui.selected = null; ui.tab = 'home'; } break;
        case 'facility': {
          const b = state.buildings.find(b => b.type === event.value);
          if (b) { ui.selected = b.id; ui.layoutMode = false; }
          else { ui.buildPlot = state.plots.find(p => !state.buildings.some(b => b.plot === p)); if (ui.buildPlot === undefined) { toast('甲板已满，先扩建吧'); ui.layoutMode = true; } else {ui.buildPage=Core.DEFINITIONS[event.value].recipe?1:0;ui.modal = 'build';} }
          break;
        }
        case 'portrait': ui.modal = 'portrait'; break;
        case 'crew': ui.crew = event.value || 'crewTank'; ui.crewPoseUntil = 0; ui.modal = 'crew'; break;
        case 'crewReact': ui.authorPose=((ui.authorPose||0)+1)%4;ui.crewPoseUntil = platform.now() + 4500; break;
        case 'confirmUpgrade': if (dispatch({ type: 'upgrade', id: ui.selected }).ok) ui.modal = null; break;
        case 'resetAsk': ui.resetConfirm = true; break;
        case 'resetCancel': ui.resetConfirm = false; break;
        case 'reset': ui.tower=false;ui.floor=3;ui.towerScroll=null;ui.towerOverview=false;ui.roomEffect=null;ui.photo=false;ui.gesture=null;ui.storyResult=null;ui.sceneReply=null;ui.buildAnimationUntil=0;ui.crewReaction=null;state = Core.fresh(numericNow()); ui.selected = null; ui.moveId = null; ui.tab = 'home'; ui.modal = 'welcome'; ui.resetConfirm = false; save(); break;
        case 'plot': {
          const b = state.buildings.find(x => x.plot === event.plot);
          if (ui.moveId) {
            const result = dispatch({ type: 'move', id: ui.moveId, plot: event.plot });
            if (result.ok) { ui.selected = ui.moveId; ui.moveId = null; }
          } else if (b) {
            if (ui.selected === b.id && b.pending > 0) dispatch({ type: 'collect', id: b.id });
            ui.selected = b.id; ui.layoutMode = false;
          } else if (state.plots.includes(event.plot)) {
            ui.buildPlot = event.plot; ui.buildPage=0; ui.modal = 'build';
          } else if (Core.expandable(state, event.plot)) { ui.buildPlot = event.plot; ui.modal = 'expand'; }
          break;
        }
        case 'build': {
          const result = dispatch({ type: 'build', kind: event.value, plot: ui.buildPlot });
          if (result.ok) { ui.selected = state.buildings[state.buildings.length - 1].id; ui.modal = null; ui.layoutMode = false; }
          break;
        }
        case 'expand': if (dispatch({ type: 'expand', plot: ui.buildPlot }).ok) ui.modal = null; break;
        case 'move': ui.moveId = ui.selected; toast('点击一块空甲板放置设备'); break;
        case 'cancelMove': ui.moveId = null; break;
        case 'deselect': ui.selected = null; ui.moveId = null; break;
        case 'quest':
          if (Core.questDone(state)) dispatch({ type: 'quest' });
          else { ui.modal = 'quest'; }
          break;
        case 'jumpQuest': {
          ui.modal = null; ui.tab = 'home';
          const q = Core.QUESTS[state.quest];
          if(q && (q.room||q.stat==='residentsJoined')){ui.tab='residents';}
          else if(q && q.camp) ui.tab='residents';
          else if(q && (['puffer','manatee','mixer'].includes(q.building)||['oxygenCollected','resinCollected','contracts'].includes(q.stat)))ui.tab='workshop';
          else if (q && q.stat === 'orders') ui.tab = 'orders';
          else if (q && q.stat === 'fed') { const b = state.buildings.find(b => b.type === 'eel'); if (b) ui.selected = b.id; }
          else if (q && q.stat === 'powered') { const b = state.buildings.find(b => b.type === 'filter'); if (b) ui.selected = b.id; }
          else if (q) toast(q.tip);
          break;
        }
        case 'action': dispatch(event.action); break;
      }
    }
    function render(n) {
      context.setTransform(viewSize.ratio,0,0,viewSize.ratio,0,0);context.fillStyle='#168c9b';context.fillRect(0,0,viewSize.width,viewSize.height);
      context.translate(transform.x,transform.y);context.scale(transform.scale,transform.scale);
      hits=View.draw(context,Core,state,ui,platform.reducedMotion?0:n/1000,n);
    }
    function finishInteraction() {
      const k=ui.interact,action=k==='roof'?{type:'room',id:'roof'}:k==='wood'?{type:'salvage'}:{type:k==='eel'?'feed':'batch',id:ui.interactId};
      const r=dispatch(action);ui.gesture=null;
      if(r.ok){if(k==='roof')state.life.opening=1;ui.interactionSuccess={kind:k,until:platform.now()+3200};ui.modal=null;save();}
    }
    function numericNow() { return platform.now(); }
    function draw() {
      if (!ui.paused) {
        const n = platform.now();
        // Cap visual work to 30 fps; the simulation is based on elapsed time, not frame count.
        if (n - ui.lastFrame >= 30) {
          const building=state.tower.construction&&state.tower.construction.id;
          Core.advance(state, n);
          if(building&&!state.tower.construction){const room=Core.SKY_ROOMS.find(r=>r.id===building);ui.tower=true;ui.floor=room.floor;ui.towerScroll=null;ui.towerOverview=false;ui.roomEffect={id:building,until:n+6000};toast(room.name+'落成！点房间看看邻居');save();}
          if (n - lastSave > 5000) save();
          if(n>ui.nextVignette&&!ui.modal&&!ui.photo){const i=Core.nextAntic(state);ui.sceneReply={line:Core.ANTICS[i][3],until:n+5000};ui.nextVignette=n+18000;}
          render(n);
          ui.lastFrame = n;
        }
      }
      platform.frame(draw);
    }
    resize();
    platform.onResize(resize);
    function targetAt(px,py) {
      for(let i=hits.length-1;i>=0;i--){const h=hits[i];if(px>=h.x&&px<=h.x+h.w&&py>=h.y&&py<=h.y+h.h&&(!h.diamond||Math.abs(px-h.x-h.w/2)/(h.w/2)+Math.abs(py-h.y-h.h/2)/(h.h/2)<=1))return h;}
      return null;
    }
    const point=(x,y)=>({x:(x-transform.x)/transform.scale,y:(y-transform.y)/transform.scale});
    function scrollTower(value){
      ui.towerOverview=false;const c=View.towerCamera(Core,state,ui);
      ui.towerScroll=Math.max(0,Math.min(c.maxScroll,value));
      ui.floor=Math.max(1,Math.min(c.levels,Math.round(c.levels-ui.towerScroll/126)));
    }
    if(platform.onWheel)platform.onWheel(e=>{
      const p=point(e.x,e.y);
      if(ui.tab!=='home'||!ui.tower||ui.modal||ui.photo||ui.layoutMode||p.x<12||p.x>342||p.y<184||p.y>553)return false;
      scrollTower(View.towerCamera(Core,state,ui).scroll+e.delta/transform.scale);return true;
    });
    if(platform.onGesture){
      let down=null;
      function panTower(p){
        down.dragged=true;scrollTower(down.scroll+down.y-p.y);
      }

      platform.onGesture(e=>{
        const p=point(e.x,e.y);
        if(e.phase==='start'){
          const h=targetAt(p.x,p.y);const towerSwipe=ui.tab==='home'&&ui.tower&&!ui.modal&&!ui.photo&&!ui.layoutMode&&p.x<342&&p.y>=184&&p.y<=553;down=h||towerSwipe?{h,x:p.x,y:p.y,towerSwipe,scroll:towerSwipe?View.towerCamera(Core,state,ui).scroll:0,dragged:false}:null;
          if(h&&h.event&&h.event.kind==='gestureStart')ui.gesture={x:p.x,y:p.y,started:platform.now()};
        }else if(e.phase==='move'&&down&&down.towerSwipe&&!ui.gesture){
          if(Math.abs(p.y-down.y)>8||down.dragged){panTower(p);}
        }else if(e.phase==='move'&&ui.gesture){ui.gesture.x=p.x;ui.gesture.y=p.y;}
        else if(e.phase==='cancel'){down=null;ui.gesture=null;}
        else if(e.phase==='end'){
          if(ui.gesture){const g=ui.gesture;ui.gesture=null;if(ui.modal==='interact'&&(ui.interact==='puffer'?platform.now()-g.started>=1200&&p.x>=75&&p.x<=315&&p.y>=335&&p.y<=625:Math.hypot(p.x-260,p.y-440)<90))finishInteraction();else toast(ui.interact==='puffer'?'按住 1.2 秒再松开，也可以点下方按钮':'把材料拖到右侧虚线圈里');}
          else if(down&&down.towerSwipe&&(down.dragged||Math.abs(p.y-down.y)>8)){panTower(p);}
          else if(down&&down.h){const h=targetAt(p.x,p.y);if(h&&h.event&&JSON.stringify(h.event)===JSON.stringify(down.h.event)&&Math.hypot(p.x-down.x,p.y-down.y)<24)handle(h.event);}
          down=null;
        }
      });
    }else platform.onPointer((x,y)=>{const p=point(x,y),h=targetAt(p.x,p.y);if(h&&h.event)handle(h.event);});
    platform.onHide(() => { Core.advance(state, platform.now()); save();ui.gesture=null; ui.paused = true; });
    platform.onShow(() => {
      const n = platform.now(), gap = n - state.lastTick;
      const result = Core.advance(state, n, true);
      if (gap > 30000 && state.introSeen) { ui.offline = { elapsed: result.elapsed, produced: result.produced }; ui.modal = 'offline'; }
      ui.paused = false; resize(); save();
    });
    if (recovered) toast('已从备份恢复本地进度');
    if (damaged) toast('存档损坏且备份不可用，已创建新家园');
    if (storageError) toast('本地存储不可用，进度可能无法保存');
    save(); draw();
    // Read-only snapshots are useful for manual QA. No debug resource mutations are exposed.
    return { snapshot: () => JSON.parse(JSON.stringify(state)), uiSnapshot: () => JSON.parse(JSON.stringify(ui)), hitTargets: () => hits.map(h => Object.assign({}, h)), save };
  }
  return { start, SAVE_KEY, BACKUP_KEY };
});
