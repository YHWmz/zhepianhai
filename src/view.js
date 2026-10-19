(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TideView = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const C = { ink: '#153956', mute: '#6b8394', cream: '#fff8e8', paper: '#f2e6c9', teal: '#087c94', dark: '#123755', gold: '#ffc34d', line: '#dce3de' };
  let ctx, hits, frameUi = {}, frameNow = 0;
  const assets = {};
  function setAssets(images) { Object.assign(assets, images); }
  function rr(x, y, w, h, r, fill, stroke) {
    r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function text(s, x, y, size = 14, color = C.ink, weight = '400', align = 'left') {
    ctx.font = weight + ' ' + size + 'px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(s), x, y);
  }
  function wrap(s, x, y, max, size = 13, color = C.mute, line = 21) {
    ctx.font = '400 ' + size + 'px -apple-system, "PingFang SC", sans-serif'; let row = '', dy = 0;
    for (const ch of s) { if (ctx.measureText(row + ch).width > max) { text(row, x, y + dy, size, color); row = ch; dy += line; } else row += ch; }
    if (row) text(row, x, y + dy, size, color); return dy + line;
  }
  function ellipse(x, y, rx, ry, fill, stroke) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } }
  function poly(points, fill, stroke) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } }
  function line(points, color, width = 2) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  function hit(x, y, w, h, event, label) { hits.push({ x, y, w, h, event, label }); }
  function button(x, y, w, h, label, event, style = 'primary', available = true) {
    const fill = style === 'primary' ? (available ? '#ffc34d' : '#d7e0df') : style === 'gold' ? C.gold : '#e5f1f1';
    rr(x, y + 3, w, h, 12, available ? (style === 'primary' ? '#bb7937' : '#a9c1c7') : '#b9c7c7');
    rr(x, y, w, h, 12, fill, available ? '#fff8d780' : null);
    if (h > 32) line([[x + 15, y + 3], [x + w - 15, y + 3]], '#ffffff55', 1.5);
    text(label, x + w / 2, y + h / 2, 13, available ? C.ink : '#72878f', '700', 'center');
    hit(x, y, w, h, event, label);
  }
  function icon(kind, x, y, size = 22, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
    if (kind === 'water') { ctx.beginPath(); ctx.moveTo(0, -10); ctx.bezierCurveTo(-4, -4, -9, 0, -7, 5); ctx.bezierCurveTo(-5, 12, 7, 11, 8, 4); ctx.bezierCurveTo(8, 0, 3, -6, 0, -10); ctx.fillStyle = color || '#56bcd1'; ctx.fill(); line([[-4, 2], [-4, 5], [-2, 6]], '#cff4ed', 2); }
    else if(kind==='oxygen'){rr(-6,-8,12,18,4,'#79c8bf');rr(-3,-12,6,5,1,'#b9a779');text('O',0,1,10,'#fff9e8','700','center');}
    else if(kind==='resin'){rr(-8,-7,16,17,3,'#d89843');rr(-9,-10,18,4,1,'#647e7b');line([[-4,-1],[4,-1]],'#fff0c2',2);}
    else if (kind === 'fish') { ellipse(0, 0, 8, 5, color || '#eeab64'); poly([[-6, 0], [-13, -5], [-12, 5]], color || '#eeab64'); ellipse(4, -1, 1, 1, C.ink); line([[-1, -4], [1, -6], [3, -4]], '#d98a51', 1); }
    else if (kind === 'wood') { ctx.rotate(-0.4); rr(-10, -5, 20, 10, 3, color || '#c18a55'); ellipse(8, 0, 3, 5, '#e9ba7d'); ellipse(8, 0, 1.4, 2.6, null, '#b9824c'); line([[-7, -2], [3, -2]], '#e1ae76', 1); }
    else if (kind === 'metal') { poly([[-9, -4], [4, -7], [10, -2], [8, 6], [-5, 8], [-11, 3]], color || '#8aafb7'); poly([[-9, -4], [4, -7], [10, -2], [-3, 1]], '#b8d2d2'); line([[-3, 1], [-5, 8]], '#6e929d', 1); }
    else if (kind === 'coins') { ellipse(0, 0, 9, 9, color || '#e7b55d'); ellipse(0, 0, 6, 6, null, '#b58233'); text('＋', 0, 1, 12, '#fff0b4', '700', 'center'); }
    else if (kind === 'power') { poly([[2, -12], [-8, 2], [-1, 2], [-3, 12], [9, -3], [2, -3]], color || '#d8b449'); }
    else if (kind === 'home') { poly([[-10, -1], [0, -10], [10, -1]], color || C.teal); rr(-7, -1, 14, 11, 2, color || C.teal); rr(-2, 3, 4, 7, 1, '#f4f1df'); }
    else if (kind === 'orders') { rr(-8, -10, 16, 21, 3, color || C.teal); for (let i = 0; i < 3; i++) line([[-4, -4 + i * 5], [4, -4 + i * 5]], '#f3f3df', 1.5); }
    else if (kind === 'book') { poly([[-10, -9], [-1, -7], [-1, 10], [-10, 8]], color || C.teal); poly([[1, -7], [10, -9], [10, 8], [1, 10]], color || C.teal); }
    else if (kind === 'crate') { rr(-9, -8, 18, 17, 2, '#c1935b', '#8c663c'); line([[-7, -6], [7, 7]], '#eed0a0', 3); line([[7, -6], [-7, 7]], '#e2b786', 2); }
    else if (kind === 'check') line([[-7, 0], [-2, 6], [8, -6]], color || C.teal, 3);
    else if (kind === 'gear') { ellipse(0, 0, 7, 7, null, color || C.teal); ellipse(0, 0, 2, 2, color || C.teal); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line([[Math.cos(a) * 7, Math.sin(a) * 7], [Math.cos(a) * 10, Math.sin(a) * 10]], color || C.teal, 2); } }
    ctx.restore();
  }
  function tile(x, y, selected, blank) {
    if (assets.dock) {
      ctx.drawImage(assets.dock, x - 42, y - 29, 84, 60);
      if (selected) poly([[x - 38, y], [x, y - 20], [x + 38, y], [x, y + 20]], '#ffde6533', '#ffe69a');
      if (blank) { ellipse(x, y, 12, 7, '#fff1c75c'); line([[x - 5, y], [x + 5, y]], '#8a5b36', 2); line([[x, y - 4], [x, y + 4]], '#8a5b36', 2); }
      return;
    }
    poly([[x - 38, y], [x, y + 20], [x + 38, y], [x + 38, y + 16], [x, y + 36], [x - 38, y + 16]], '#765236', '#473f35');
    poly([[x, y + 21], [x + 38, y + 1], [x + 38, y + 16], [x, y + 36]], '#aa7548');
    const g = ctx.createLinearGradient(x - 30, y - 20, x + 30, y + 20); g.addColorStop(0, selected ? '#ffe7a3' : '#edc18a'); g.addColorStop(1, selected ? '#edb950' : '#c88a50');
    poly([[x - 38, y], [x, y - 20], [x + 38, y], [x, y + 20]], g, selected ? '#fff1a2' : '#ffe0a2');
    for (let i = -2; i <= 2; i++) { const xx = i * 11; const h = 20 - Math.abs(xx) / 1.9; line([[x + xx - 4, y - h + 3], [x + xx + 4, y + h - 3]], '#8c603984', 1.5); line([[x + xx - 2, y - h + 4], [x + xx + 3, y + h - 4]], '#ffdc9b66', 1); }
    ellipse(x - 26, y, 1.5, 1, '#53666a'); ellipse(x + 26, y, 1.5, 1, '#53666a');
    rr(x - 27, y + 9, 9, 10, 2, '#56696a'); ellipse(x - 22, y + 12, 1, 1, '#b3c9c3');
    if (blank) { ellipse(x, y, 12, 7, '#fff1c75c'); line([[x - 5, y], [x + 5, y]], '#8a5b36', 2); line([[x, y - 4], [x, y + 4]], '#8a5b36', 2); }
  }
  function machine(type, x, y, scale = 1, t = 0, powered = false, level = 1, id = null) {
    if (assets[type]) { spriteMachine(type, x, y, scale, t, powered, level, id); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ellipse(0, 6, 27, 10, '#704c3e24');
    if(type==='puffer'||type==='manatee'||type==='mixer'){rr(-28,-22,56,32,8,'#6eaaa8');ellipse(0,-41,27,26,type==='puffer'?'#edc665':'#9cb9b2');ellipse(-9,-47,6,7,'#fff5d7');ellipse(10,-47,6,7,'#fff5d7');ellipse(-8,-46,2,3,C.ink);ellipse(10,-46,2,3,C.ink);text(type==='puffer'?'O':type==='mixer'?'齿':'⌣',0,-30,15,C.ink,'700','center');}
    else if (type === 'filter') {
      rr(-22, -11, 43, 20, 4, '#387e86'); poly([[-22, -11], [-10, -18], [31, -18], [21, -11]], '#b5ded9'); poly([[21, -11], [31, -18], [31, 2], [21, 9]], '#266671');
      rr(-19, -53, 30, 44, 8, '#cbe6dc', '#3b7d83'); rr(-15, -44, 22, 29, 5, '#4db3c2');
      ctx.save(); ctx.beginPath(); ctx.rect(-15, -44, 22, 29); ctx.clip();
      for (let i = 0; i < 4; i++) ellipse(-10 + (i % 2) * 11, -17 - ((t * 7 + i * 9) % 27), 1.5, 1.5, '#c2f0e2'); ctx.restore();
      ellipse(-4, -53, 15, 5, '#e1f1dc', '#488990'); ellipse(-4, -56, 11, 4, '#62a2a3'); rr(-7, -63, 6, 6, 2, '#e9c281');
      line([[12, -35], [23, -35], [23, -17]], '#c7d9c0', 6); line([[12, -35], [23, -35]], '#eef3d8', 2);
      const dropY = -16 + (t * 16 % 12); ellipse(23, dropY, 1.8, 3, '#8ee4e5');
      rr(13, -7, 17, 15, 3, '#d7b27a'); ellipse(21, -7, 9, 3, '#90d3d5');
      line([[-13, -43], [-13, -22]], '#d7fbeb', 2); rr(-17, -4, 18, 6, 2, '#f4e7bc');
    } else if (type === 'fishery') {
      poly([[-28, -5], [-5, -18], [30, -2], [8, 14]], '#588e91', '#d5bd8b');
      poly([[-22, -5], [-4, -13], [23, -1], [7, 9]], '#358a9b');
      for (let i = 0; i < 5; i++) { line([[-21 + i * 8, -5 + i * 1.6], [-6 + i * 7, -12 + i * 3]], '#9fd1c25a', 1); }
      [[-26, -8], [28, -4], [7, 13]].forEach(p => { rr(p[0] - 2, p[1] - 27, 5, 30, 1, '#b28a56'); ellipse(p[0] + 0.5, p[1] - 27, 3, 2, '#e6c998'); });
      line([[-25, -32], [2, -23], [29, -28]], '#eee0aa', 2);
      for (let i = 0; i < 5; i++) line([[-24 + i * 13, -31 + Math.sin(i) * 5], [-20 + i * 11, -7 + i * 2]], '#f0e9c470', 1);
      icon('fish', Math.sin(t) * 7, -4, 20); icon('fish', 12 + Math.sin(t + 2) * 3, 3, 12);
      line([[-25, -34], [-25, -52]], '#8b6f49', 2); poly([[-24, -52], [-7, -47], [-24, -42]], '#eb8f68');
      rr(-24, -10, 12, 10, 2, '#d9b879');
    } else {
      rr(-25, -8, 51, 18, 4, '#677d56'); poly([[-25, -8], [-15, -15], [34, -15], [26, -8]], '#cad69d'); poly([[26, -8], [34, -15], [34, 2], [26, 10]], '#45635b');
      rr(-22, -52, 43, 44, 12, '#afd4aa', '#567d70'); rr(-18, -47, 35, 32, 9, powered ? '#d2e9a3' : '#b6d7c4');
      line([[-16, -41], [-16, -26]], '#edf7d5', 2);
      ctx.beginPath(); ctx.moveTo(-11, -24); ctx.bezierCurveTo(5, -15, 15, -24, 5, -30 + Math.sin(t * 2) * 2); ctx.bezierCurveTo(-6, -38, -6, -23, 9, -38); ctx.strokeStyle = '#526e5d'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
      ellipse(9, -38, 5, 4, '#6b8462'); ellipse(11, -39, 1, 1, '#f9edbe');
      line([[22, -34], [30, -34], [30, -48]], '#8f8158', 4); ellipse(30, -50, 5, 5, powered ? '#ffe8a0' : '#a3b69b');
      if (powered) { icon('power', -4, -62 + Math.sin(t * 3), 14, '#ffe49a'); ellipse(30, -50, 9, 9, '#ffdf6b25'); }
      rr(-15, -4, 26, 7, 2, '#dce0ab'); for (let i = 0; i < 3; i++) rr(-11 + i * 7, -2, 4, 3, 1, powered ? '#f3cf67' : '#8ba47d');
    }
    if (level > 1) { icon('gear', 21, 4, 15, '#e9c777'); if (level > 2) icon('gear', -19, 4, 11, '#e9c777'); }
    ctx.restore();
  }
  function spriteMachine(type, x, y, scale, t, powered, level, id) {
    const effect = (frameUi.effects || []).filter(e => e.id === id && frameNow - e.time < 1400).pop();
    const age = effect ? (frameNow - effect.time) / 1000 : 2;
    const punch = effect && !frameUi.reducedMotion ? Math.sin(age * 13) * Math.exp(-age * 3) * .13 : 0;
    const breathing = frameUi.reducedMotion ? 0 : Math.sin(t * (type === 'eel' ? 2.1 : 1.3) + (id || 0)) * (type === 'eel' ? .014 : .006);
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ellipse(0, 5, 38, 12, '#09334f3b');
    if (frameUi.selected === id && id !== null) { ellipse(0, 7, 43, 16, '#ffcf4d40', '#ffdd79'); }
    ctx.rotate(type === 'fishery' && !frameUi.reducedMotion ? Math.sin(t * 1.3) * .014 : 0);
    ctx.scale(1 - punch * .5 - breathing * .3, 1 + punch + breathing);
    ctx.drawImage(assets[type], -56, -104, 112, 112);
    if (['puffer','manatee','mixer'].includes(type) && powered) {
      ctx.save();ctx.translate(8,-48);ctx.rotate(t*2.8);for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);line([[4,0],[15,0]],'#f7e9b6aa',2);}ctx.restore();
      for(let i=0;i<3;i++)ellipse(-17+i*14,-82-(t*12+i*7)%17,2,2,'#d5f4ec99');
    }
    if (type === 'filter') {
      for (let i = 0; i < 4; i++) {
        const phase = (t * (powered ? 14 : 7) + i * 11) % 44;
        ellipse(-12 + Math.sin(i * 4) * 10, -26 - phase, 1 + i % 2, 1 + i % 2, '#bdffff7a');
      }
    }
    if (type === 'eel') {
      if (powered) {
        ctx.save(); ctx.shadowColor = '#ffe564'; ctx.shadowBlur = 9;
        const sway = Math.sin(t * 3) * 3;
        line([[-38, -67], [-45, -74 + sway], [-40, -79], [-47, -87]], '#fff3a5', 2);
        line([[39, -52], [46, -59 - sway], [41, -64], [47, -71]], '#fff3a5', 2);
        ellipse(-29, -84, 10 + Math.sin(t * 2) * 1.5, 12, '#ffe66822'); ctx.restore();
      } else {
        ellipse(-29, -84, 9, 12, '#35566c85');
        text('z', 30, -93 + Math.sin(t) * 2, 11, '#d5ebf5', '700');
      }
    }
    if (level > 1) { badge('★'.repeat(level - 1), -13, 2, 26, '#244059', '#ffcf64'); }
    ctx.restore();
  }
  const CREW = {
    crewAuthor: {name:'阿昊',role:'作者 · 背着咖啡馆去旅行',idle:'先存档，再出发。咖啡我带上了。',react:'这个味道……我得再确认一口。'},
    crewDiver: { name: '阿潜', role: '潜水维修工 · 自带扳手与大脚蹼', idle: '房租能打折吗？我给灯塔拧螺丝。', react: '别拿我当鱼钩，我是正式住户！' },
    crewTank: { name: '阿桶', role: '移动空调工 · 人走风也走', idle: '我一转身，全屋人都追着冷风跑。', react: '别催了！空调比我还重！' },
    crewBoss: { name: '卷姨', role: '营地大厨 · 锅铲就是话语权', idle: '先吃饭，再谈你那个鲨鱼房车。', react: '谁又把我的锅接到发电机上了！' },
    crewWire: { name: '阿线', role: '发明家 · 先通电，再讲原理', idle: '喂？鱼吗？你们老板在不在？', react: '头发竖起来了，说明电路通了！' }
  };
  function crewSprite(who, x, feet, height, reacting, t) {
    if(who==='crewAuthor'&&assets.author){const img=assets.author,pose=Number.isInteger(frameUi.renderAuthorPose)?frameUi.renderAuthorPose:reacting?2:0,sw=img.width/2,sh=img.height/2;ctx.drawImage(img,(pose%2)*sw,Math.floor(pose/2)*sh,sw,sh,x-height/2,feet-height,height,height);return;}
    const atlas = who !== 'crewAuthor' && who !== 'crewDiver' && assets.cast;
    const img = who === 'crewAuthor' ? null : who === 'crewDiver' ? assets.diver : assets.cast || assets[who], w = img && atlas ? height * (img.width / 2) / (img.height / 3) : height * .75;
    const bob = frameUi.reducedMotion ? 0 : Math.sin(t * (reacting ? 9 : 2)) * (reacting ? 2 : .7);
    ellipse(x, feet - 5, w * .27, 5, '#153e4833');
    if (img) {
      const sw = img.width / 2, row = atlas ? ['crewTank', 'crewWire', 'crewBoss'].indexOf(who) : 0, starts = [0,400/1254,829/1254], ends = [399/1254,836/1254,1], sy = atlas ? starts[row] * img.height : 0, sh = atlas ? (ends[row]-starts[row])*img.height : img.height;
      const drawWidth=height*sw/sh;
      ctx.drawImage(img, reacting ? sw : 0, sy, sw, sh, x - drawWidth / 2, feet - height + bob, drawWidth, height);
    } else {
      rr(x - w * .2, feet - height * .52, w * .4, height * .45, 8, who === 'crewTank' ? '#9475b0' : '#e88659');
      ellipse(x, feet - height * .66, w * .22, height * .18, '#edc29c');
      text(reacting ? 'O' : '⌣', x, feet - height * .6, height * .14, C.ink, '700', 'center');
      text(CREW[who].name, x, feet - height * .85, 11, '#fff3cb', '700', 'center');
    }
  }
  function octopus(x,y,scale,t,working) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    if(assets.octopus)ctx.drawImage(assets.octopus,-56,-102,112,112);
    else {ellipse(0,-42,25,26,'#9c7cba');for(let i=0;i<5;i++)line([[0,-30],[-38+i*18,-9+Math.sin(t+i)*4]],'#aa8bc4',7);ellipse(-8,-46,5,6,'#fff5d4');ellipse(8,-46,5,6,'#fff5d4');icon('wood',0,-4,27);}
    if(working){const offset=frameUi.reducedMotion?0:Math.sin(t*2)*8;line([[15,-40],[43,-15+offset]],'#d8bc80',2);icon('wood',43,-10+offset,24);}
    ctx.restore();
  }
  function materialChips(Core,state,cost,y) {
    Object.entries(cost).forEach(([key,need],i)=>{
      const x=35+(i%2)*163,yy=y+Math.floor(i/2)*29;
      rr(x,yy,157,25,7,state.resources[key]>=need?'#deeddf':'#f5dfbb');
      text(Core.RESOURCE_NAMES[key]+' '+state.resources[key]+'/'+need+' ›',x+8,yy+12,10,C.ink,'600');
      hit(x,yy,157,25,{kind:'source',key,need},'来源：'+Core.RESOURCE_NAMES[key]);
    });
  }
  function crewStrip(ui, now) {
    const reaction = ui.crewReaction && ui.crewReaction.until > now ? ui.crewReaction : null;
    const who = reaction ? reaction.who : 'crewTank';
    rr(88, 483, 218, 38, 11, '#103e58ef', '#6cabb5');
    text(CREW[who].name + (reaction ? '！' : ' · 点击人物看特写'), 99, 493, 10, '#ffd96f', '700');
    text(reaction ? reaction.line : '这厂缺的不是设备，是正常人。', 99, 509, 10, '#fff5df');
    hit(88, 483, 218, 38, { kind: 'crew', value: who }, '查看工人特写');
  }
  function speech(s, x, y, color = '#fff5d5', size = 12) {
    ctx.font = '700 ' + size + 'px -apple-system, "PingFang SC", sans-serif';
    const w = Math.min(220, ctx.measureText(s).width + 24), xx = Math.max(20, Math.min(370 - w, x - w / 2));
    rr(xx, y, w, 28, 10, '#173f5c'); rr(xx, y - 2, w, 28, 10, color, '#294e61');
    poly([[x - 4, y + 24], [x + 4, y + 24], [x, y + 31]], color);
    text(s, xx + w / 2, y + 12, size, C.ink, '700', 'center');
  }
  function effects(ui, now, xy) {
    if (ui.reducedMotion) return;
    for (const e of ui.effects || []) {
      const age = (now - e.time) / 1000; if (age < 0 || age > 1.8) continue;
      const p = Number.isInteger(e.plot) ? xy(e.plot) : { x: 195, y: 446 };
      const opacity = Math.min(1, (1.8 - age) * 2);
      ctx.save(); ctx.globalAlpha = opacity;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4; const distance = 20 + age * 28;
        const xx = p.x + Math.cos(a) * distance, yy = p.y - 45 + Math.sin(a) * distance - age * 22;
        if (e.type === 'feed' || e.type === 'power') icon('power', xx, yy, 9, '#ffdf69');
        else { ctx.save(); ctx.translate(xx, yy); ctx.rotate(age * 2 + i); rr(-2, -4, 4, 8, 1, ['#ffca54', '#a8efdf', '#ff9561'][i % 3]); ctx.restore(); }
      }
      speech(e.label, p.x, Math.max(250, p.y - 135 - age * 8), '#ffe8a2', 13); ctx.restore();
    }
  }
  function gull(x, y, s, t) { line([[x - s, y], [x - s / 2, y - 3 - Math.sin(t) * 2], [x, y], [x + s / 2, y - 3 - Math.sin(t) * 2], [x + s, y]], '#d4f0e7', 1.5); }
  function boat(x, y, t) {
    ctx.save(); ctx.translate(x, y + Math.sin(t) * 2); ellipse(0, 12, 29, 8, '#9fddd74a'); poly([[-25, 0], [25, 0], [15, 12], [-15, 12]], '#b97f50'); poly([[-25, 0], [-9, -8], [24, -3], [25, 0]], '#e3bd86'); line([[-3, 0], [-3, -45]], '#c7b487', 2); poly([[-1, -43], [19, -11], [-1, -11]], '#fff1d3'); poly([[-6, -37], [-22, -11], [-6, -11]], '#e5d9bd'); ctx.restore();
  }
  function resourcePill(kind, value, x, y, w) { rr(x, y + 3, w, 47, 12, '#062b46a8'); rr(x, y, w, 47, 12, '#113f5ef0', '#71bcd360'); icon(kind, x + 17, y + 17, 19); text(value, x + 33, y + 17, 16, '#fff7db', '700'); text({ wood: '木材', metal: '金属', water: '淡水', fish: '鱼类' }[kind], x + w / 2, y + 35, 10, '#b3d6e0', '400', 'center'); }
  function panel(x, y, w, h) { ctx.save(); ctx.shadowColor = '#052d4b50'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 5; rr(x, y + 3, w, h, 18, '#ad8c5b'); rr(x, y, w, h, 18, C.cream, '#fff4ce'); ctx.restore(); }
  function badge(label, x, y, width, color = '#e5eddb', ink = C.teal) { rr(x, y, width, 22, 8, color); text(label, x + width / 2, y + 11, 10, ink, '600', 'center'); }
  function drawSea(t) {
    if (assets.ocean) {
      const img = assets.ocean, cover = Math.max(390 / img.width, 844 / img.height);
      ctx.drawImage(img, (390 - img.width * cover) / 2, (844 - img.height * cover) / 2, img.width * cover, img.height * cover);
    } else { const g = ctx.createLinearGradient(0, 0, 390, 844); g.addColorStop(0, '#3dbdd1'); g.addColorStop(.45, '#178fae'); g.addColorStop(1, '#10456c'); ctx.fillStyle = g; ctx.fillRect(0, 0, 390, 844); }
    const shade = ctx.createLinearGradient(0, 0, 0, 844); shade.addColorStop(0, '#063654e6'); shade.addColorStop(.25, '#073b5520'); shade.addColorStop(.65, '#053d6455'); shade.addColorStop(1, '#062e50bf'); ctx.fillStyle = shade; ctx.fillRect(0, 0, 390, 844);
    for (let i = 0; i < 36; i++) { const x = ((i * 83 + Math.sin(t * .24 + i) * 7) % 430) - 20, y = 247 + ((i * 61) % 520); ctx.globalAlpha = .12 + (i % 3) * .03; line([[x, y], [x + 5, y + 2], [x + 16, y + 2], [x + 21, y]], '#e5fff0', 1.1); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const phase = (t * .14 + i / 3) % 1; ctx.globalAlpha = (1 - phase) * .15; ellipse(202, 408, 120 + phase * 65, 40 + phase * 28, null, '#d7ffff'); } ctx.globalAlpha = 1;
    // Fish far below the base make the water feel transparent and inhabited.
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = .15; icon('fish', 60 + ((i * 57 + t * 5) % 290), 467 + Math.sin(t * .6 + i) * 12 + i * 7, 12, '#062f60'); } ctx.globalAlpha = 1;
    gull(45 + Math.sin(t * .2) * 8, 265, 8, t); gull(317, 252, 6, t + 2); gull(337, 264, 5, t + 1);
  }
  function header(Core, state, ui, now) {
    const stage = state.camp.stage;
    text('这片海我包了', 18, 28, 20, '#fff2ca', '800');
    rr(282, 12, 53, 28, 9, '#17465b'); text('金币', 308, 19, 8, '#ffdb78', '600', 'center'); text(state.resources.coins, 308, 31, 12, '#ffdb78', '700', 'center');
    icon('gear', 357, 26, 22, '#fff1ce'); hit(337, 5, 42, 42, { kind: 'settings' }, '设置');
    ['wood','metal','water','fish'].forEach((k,i)=>{resourcePill(k,state.resources[k],18+i*91,51,81);hit(18+i*91,51,81,47,{kind:'source',key:k},'来源：'+Core.RESOURCE_NAMES[k]);});
    const power = Core.power(state,now);
    text('电力 '+power.used+'/'+power.total+'  ·  居民 '+Core.residents(state).length+' 人', 19, 116, 11, '#fff3c9', '600');
    text(['破筏合租','清凉小屋','轮胎合租楼','机械鲨鱼营地'][stage], 369, 116, 11, '#fff3c9', '600','right');
    if(ui.tab==='home'&&!ui.layoutMode)return;
    const q=Core.QUESTS[state.quest],done=Core.questDone(state);
    rr(18,132,354,39,12,'#fff4d9','#c79952');
    text(q ? q.title : '生产 → 居民需求 → 升级海上营地',31,151,12,C.ink,'700');
    text(done?'领奖':'›',350,151,12,C.teal,'700','center');
    hit(18,132,354,39,{kind:'quest'},done?'领取目标奖励':'查看家园目标');
  }
  // Each room is a separate sprite, so completed projects physically change the house.
  function roomSprite(index,x,y,w,h) {
    if(assets.rooms){const sw=assets.rooms.width/2,sh=assets.rooms.height/3,scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;ctx.drawImage(assets.rooms,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,x+(w-dw)/2,y+h-dh,dw,dh);}
    else {rr(x+8,y+8,w-16,h-16,5,'#577779','#193d50');rr(x+14,y+20,w-28,h-35,3,'#e1b77f');line([[x+12,y+h-14],[x+w-8,y+h-14]],'#79522f',7);text(['漏雨卧室','干燥卧室','厨房','客房','暖灯客厅','灯塔吊机'][index],x+w/2,y+h/2,12,C.ink,'700','center');}
  }
  function harbor(Core, state, ui, t, now) {
    const stage=state.camp.stage,rooms=state.home.rooms,construction=state.home.construction;
    const busy=!!construction || ui.buildAnimationUntil>now;
    const floor2=stage>=2||rooms.includes('bunk'),floor3=stage>=3;
    const base=487,bob=ui.reducedMotion?0:Math.sin(t*.7)*1.5;
    ctx.save();ctx.translate(0,bob);
    ellipse(208,500,161,24,'#062b4680');
    // Floating foundation and the shark hull stay separate from the rooms above.
    if(stage>=3&&assets.shark){ctx.save();ctx.beginPath();ctx.rect(53,462,305,53);ctx.clip();ctx.drawImage(assets.shark,40,217,330,315);ctx.restore();}
    for(let i=0;i<8;i++){ellipse(70+i*36,491,16,12,'#223e48','#86a8a5');ellipse(70+i*36,491,8,7,'#142c38');}
    poly([[42,474],[322,474],[354,486],[75,486]],'#ca975f','#f6d498');
    poly([[75,486],[354,486],[354,494],[75,494]],'#6b503c');
    for(let i=0;i<14;i++)line([[48+i*20,475],[79+i*20,484]],'#92683f',1);
    const slots=[{x:53,y:382,art:rooms.includes('roof')?1:0,name:'卧室'}, {x:202,y:382,art:2,name:'厨房'}, {x:53,y:285,art:3,name:'客房'}, {x:202,y:285,art:4,name:'客厅'}, {x:129,y:186,art:5,name:'灯塔'}];
    const early=!rooms.includes('kitchen')&&stage<2;
    if(early){slots[0]={x:69,y:290,art:rooms.includes('roof')?1:0,name:'卧室'};}
    if(!floor2&&!ui.photo){text('从一张漏雨的床，开始建家',202,226,16,'#fff0ce','700','center');text('修屋顶  →  添厨房  →  接邻居',202,252,11,'#d7f2ea','500','center');}
    if(floor2){for(const x of [65,192,335])line([[x,292],[x,480]],'#695442',7);line([[61,385],[340,385]],'#a88154',8);}
    if(rooms.includes('lookout')){for(const x of [145,270])line([[x,270],[x,300]],'#896944',7);line([[141,288],[277,288]],'#bb925f',7);}
    slots.forEach((q,i)=>{
      const exists=i===0||i===1&&rooms.includes('kitchen')||i===2&&rooms.includes('bunk')||i===3&&rooms.includes('lights')||i===4&&rooms.includes('lookout');
      const planned=i<2||i<4&&floor2||i===4&&floor3;
      if(!planned||early&&i===1)return;
      const rw=early&&i===0?246:151,rh=early&&i===0?197:106;
      if(exists)roomSprite(q.art,q.x,q.y,rw,rh);
      else{line([[q.x+12,q.y+100],[q.x+12,q.y+31],[q.x+132,q.y+31],[q.x+132,q.y+100]],'#b4c8bd99',3);line([[q.x+5,q.y+100],[q.x+142,q.y+100]],'#c4a16f',6);text('＋ '+q.name,q.x+76,q.y+62,12,'#f9e4af','700','center');}
      if(construction && Core.ROOMS.findIndex(r=>r.id===construction.id)===i){
        const fraction=Math.max(0,Math.min(1,(now-construction.startedAt)/(construction.endsAt-construction.startedAt)));
        ctx.save();ctx.beginPath();ctx.rect(q.x,q.y+rh*(1-fraction),rw,rh*fraction);ctx.clip();roomSprite(i+1,q.x,q.y,rw,rh);ctx.restore();
        line([[q.x+5,q.y+rh],[q.x+5,q.y+12],[q.x+rw-5,q.y+12],[q.x+rw-5,q.y+rh]],'#e1b262',3);
        for(let yy=q.y+25;yy<q.y+rh;yy+=23)line([[q.x+5,yy],[q.x+rw-5,yy]],'#e1b26288',1);
        badge('施工 '+Math.round(fraction*100)+'%',q.x+rw/2-42,q.y+12,84,'#efbf5d','#24445a');
      }
      hit(q.x+12,q.y+20,rw-24,rh-25,{kind:'rooms'},'改造'+q.name);
    });
    if(!rooms.includes('roof')){for(let i=0;i<7;i++){let yy=(early?330:403)+(t*25+i*11)%(early?110:53);line([[92+i*7,yy],[90+i*7,yy+6]],'#a5dcff',1);}ellipse(132,471,9,4,'#95cde0');}
    const theme=['#69b9b4','#ddaa73','#9b9ac8'][state.life.palette];
    line([[63,474],[333,474]],theme,4);
    line([[48,459],[48,480],[347,480],[347,459]],'#9d754e',3);
    line([[38,304],[48,304],[48,465]],'#75b4b8',4);
    line([[342,304],[332,304],[332,465]],'#d6b662',2);
    if(rooms.includes('lights')){ctx.save();ctx.shadowColor='#ffd580';ctx.shadowBlur=18;for(const x of [237,280,324]){ellipse(x,310,5,6,'#ffdc8a');}ctx.restore();}
    if(rooms.includes('lookout')){ctx.save();ctx.globalAlpha=.08;poly([[210,208],[55,178],[365,178]],'#fff4b0');ctx.restore();}
    if(floor2){line([[194,390],[194,480]],'#d7b779',3);line([[205,390],[205,480]],'#d7b779',3);for(let yy=396;yy<480;yy+=10)line([[194,yy],[205,yy]],'#d7b779',2);}
    sceneDecor(Core,state,ui,t);
    const people=Core.residents(state);
    people.forEach((who,i)=>{
      if(!ui.photo&&state.salvager.built&&state.salvager.worker===who&&!busy&&state.camp.nextMealAt-now<=45000)return;
      const phase=(t*.045+i*.21)%1,walk=phase<.72&&!busy&&!ui.photo;
      const upstairs=floor2&&i===1||floor2&&i===3;
      const start=[85,116,243,238,166][i],end=[148,170,303,294,220][i];
      const route=phase/.72;
      let x=walk?start+(end-start)*(route<.5?route*2:2-route*2):start,feet=upstairs?384:478;
      if(busy){x=80+i*51;feet=478;}
      if(ui.photo){x=72+i*59;feet=478;}
      const behavior=ui.photo?[0,3,2,1][ui.photoPose]:Math.floor(t/7+i)%4;ui.renderAuthorPose=behavior;
      if(who==='crewAuthor'&&!walk&&!busy&&!ui.photo) {x=185;feet=478;}
      const eat=state.camp.nextMealAt-now>45000,cook=who==='crewBoss'&&rooms.includes('kitchen')&&!walk&&!busy,rest=!ui.photo&&!busy&&!walk&&!eat&&!cook;
      ctx.save();ctx.translate(x,feet);if(walk)ctx.rotate(Math.sin(t*8+i)*.035);if(rest)ctx.scale(1,.86);crewSprite(who,0,0,who==='crewAuthor'&&behavior===1?70:60,ui.photo?ui.photoPose%2===1:busy||eat||behavior===2,t);ctx.restore();
      if(ui.photo){}
      else if(busy){const swing=ui.reducedMotion?0:Math.sin(t*10+i)*7;line([[x+14,feet-29],[x+26+swing,feet-43]],'#dbbe80',3);rr(x+19+swing,feet-48,13,6,2,'#a7c2c6');if((t*5+i)%1<.35)icon('power',x+25,feet-32,9,'#ffdd76');}
      else if(cook){ellipse(x+10,feet-23,11,4,'#4b5657');line([[x+11,feet-24],[x+16+Math.sin(t*3)*4,feet-37]],'#dbc392',2);}
      else if(eat){ellipse(x+8,feet-20,8,3,'#f5e2b1');}
      else if(walk&&i%2===0)icon('crate',x+12,feet-21,19);
      if(rest&&who!=='crewAuthor')text('z',x+18,feet-52,11,'#e2f5ef','700');
      if(who==='crewTank'&&!rooms.includes('roof')){rr(x-10,feet-66,20,8,3,'#a1b7b4');ellipse(x,feet-66,11,3,'#ccd7c7');}
      hit(x-19,feet-61,38,61,{kind:'crew',value:who},'查看'+CREW[who].name);
    });
    ctx.restore();
    // All installed devices are directly accessible on a scene-side service dock.
    const types=['filter','fishery','eel','puffer','manatee','mixer'];
    types.forEach((kind,i)=>{
      const x=i<3?18:350,y=210+(i%3)*94,b=state.buildings.find(b=>b.type===kind),open=Core.unlocked(state,kind);
      if(!open&&!b)return;
      if(b){poly([[x-12,y+30],[x+31,y+30],[x+39,y+37],[x-4,y+37]],'#b88c58','#ebc895');line([[i<3?x+32:x-10,y+35],[i<3?53:336,y+35]],'#92734f',4);}
      if(!ui.photo)rr(x-13,y-18,48,86,9,'#10374bcc','#8aa99b70');
      if(b){machine(kind,x+11,y+32,.48,t,b.type==='eel'?b.fuelUntil>now:!!b.batch||Core.power(state,now).active.includes(b.id),b.level,b.id);}
      else text('+',x+11,y+8,23,'#ffe0a0','700','center');
      if(!ui.photo){text(Core.DEFINITIONS[kind].short,x+11,y+43,9,'#fff1ce','700','center');
      text(b?(kind==='eel'?(b.fuelUntil>now?'供电':'待投喂'):b.pending?'可收 '+b.pending:b.batch?'加工中':Core.DEFINITIONS[kind].recipe?'缺料':'生产中'):'建造',x+11,y+57,9,'#bce4d8','500','center');
      hit(x-13,y-18,48,86,{kind:'facility',value:kind},Core.DEFINITIONS[kind].name);
      if(b&&b.pending>0)hit(x-13,y+44,48,24,{kind:'action',action:{type:'collect',id:b.id}},'收取'+Core.DEFINITIONS[kind].short);}
    });
    if(state.salvager.built){
      const q=state.salvager,working=q.pending<Core.SALVAGER.capacity;
      poly([[8,494],[105,494],[125,509],[25,509]],'#b7834f','#e7c88d');
      octopus(40,505,.52,t,working);
      if(q.worker&&!busy&&!ui.photo&&state.camp.nextMealAt-now<=45000){
        const phase=ui.reducedMotion?0:(t*.12)%1,x=phase<.5?76+phase*36:112-phase*36;
        crewSprite(q.worker,x,505,44,working,t);
        if(working){if(phase<.5)line([[x-9,484],[51,488+Math.sin(t*3)*2]],'#ead29b',2);else icon('wood',x-8,489,16);}
        hit(x-15,460,30,45,{kind:'crew',value:q.worker},'查看'+CREW[q.worker].name);
      }
      for(let i=0;i<Math.ceil(q.pending/6);i++)icon('wood',118+i*11,502-i%2*5,15);
      hit(8,460,61,49,{kind:'salvager'},'章鱼打捞站');
      if(!working&&!ui.photo)badge('木料已满',11,456,68,'#ffc34d',C.ink);
    }
    if(ui.photo)return;
    const reaction=ui.crewReaction&&ui.crewReaction.until>now?ui.crewReaction:null;
    const next=Core.ROOMS[rooms.length];
    const message=ui.sceneReply&&ui.sceneReply.until>now?ui.sceneReply.line:construction?'施工中 · '+Core.ROOMS.find(r=>r.id===construction.id).name+' · '+Math.max(0,Math.ceil((construction.endsAt-now)/1000))+' 秒':reaction?CREW[reaction.who].name+'：'+reaction.line:next?next.event:'灯塔亮了，怪人们终于有了自己的家。';
    rr(18,513,354,29,9,'#12384ef2');text(message.length>29?message.slice(0,28)+'…':message,195,528,10,'#fff1c5','600','center');
    hit(18,513,354,29,{kind:'rooms'},'查看居住事件');
    button(18,580,354,32,'海上怪事 · '+(Core.nextEpisode(state)>=0?Core.EPISODES[Core.nextEpisode(state)].name:'今天又有什么新鲜事'),{kind:'tales'},'primary');
    button(18,546,112,26,'居民与营地升级',{kind:'camp'},'primary');
    button(138,546,113,26,rooms.includes('lookout')?'楼层扩建':'居住改造 '+rooms.length+'/5',rooms.includes('lookout')?{kind:'towerEnter'}:{kind:'rooms'},'primary');
    button(259,546,113,26,'装饰与配色',{kind:'decor'},'secondary');
  }
  function residents(Core,state,ui,now) {
    const stage=state.camp.stage,project=Core.CAMP_PROJECTS[stage];
    panel(18,187,354,580);text('怪人合租公约',35,215,22,C.ink,'800');
    const people=Core.residents(state),n=people.length;
    people.forEach((who,i)=>{const x=55+(i+.5)*280/n;crewSprite(who,x,342,94,false,0);hit(x-31,246,62,110,{kind:'crew',value:who},'查看'+CREW[who].name);text(CREW[who].name,x,357,12,C.ink,'700','center');});
    button(35,378,154,34,'营地项目',{kind:'camp'},'primary');
    button(201,378,154,34,'居住改造 '+state.home.rooms.length+'/5',{kind:'rooms'},'secondary');
    button(35,429,320,36,state.life.author?'查看阿昊 · 旅行与奇味':'阿昊靠岸了 · 邀请入住',{kind:'author'},'primary');
    text('咖啡、电脑、徒步地图，还有一本奇怪菜单。',35,483,12,C.mute);
    button(35,511,320,34,state.home.resident?'查看阿潜':'邀请阿潜入住',state.home.resident?{kind:'crew',value:'crewDiver'}:{kind:'action',action:{type:'recruit'}},'secondary');
    const wait=Math.max(0,Math.ceil((state.camp.nextMealAt-now)/1000));
    text('淡水 2 ＋ 鱼 1 → 生活费 '+Core.mealReward(state).coins+' 金币',35,581,12,C.mute);
    text(!stage?'完成清凉小屋后开放供餐':wait?'大家正在吃饭 · '+wait+' 秒':'锅里有饭，家里有人。',35,609,12,C.teal);
    button(35,634,320,38,'给居民开饭',{kind:'action',action:{type:'meal',meals:state.camp.meals}},'primary',stage>0&&!wait);
    button(35,690,153,37,'居民故事手记',{kind:'tab',value:'journal'},'secondary');
    button(201,690,154,37,'合租全家福',{kind:'photo'},'secondary');
  }

  function island(Core, state, ui, t, now) {
    const power = Core.power(state, now);
    const xy = p => ({ x: 195 + (p % 4 - Math.floor(p / 4)) * 39, y: 303 + (p % 4 + Math.floor(p / 4)) * 22 });
    // Submerged pipework and flotation barrels visually anchor the machinery to the sea.
    ctx.save(); ctx.globalAlpha = .42;
    line([[174, 405], [174, 476], [223, 495], [248, 482], [248, 423]], '#0b4669', 13);
    line([[174, 405], [174, 476], [223, 495]], '#5bb4c2', 4);
    for (let j = 0; j < 3; j++) { ellipse(174, 441 + j * 12, 8, 3, null, '#6cd4db'); }
    ctx.restore();
    for (const p of state.plots.filter(p => !state.plots.includes(p + 4) || p >= 12)) {
      const pos = xy(p); const x = pos.x - 12, y = pos.y + 18;
      const g = ctx.createLinearGradient(x - 10, y, x + 10, y); g.addColorStop(0, '#984f28'); g.addColorStop(.35, '#ed9c48'); g.addColorStop(1, '#a45629');
      rr(x - 10, y, 20, 31, 7, g, '#4d5850'); ellipse(x, y + 2, 10, 4, '#efb363', '#74613e'); line([[x - 9, y + 12], [x + 9, y + 12]], '#4d6869', 3); line([[x - 8, y + 24], [x + 8, y + 24]], '#4d6869', 3);
      ellipse(x, y + 32, 16, 5, '#97e7e329');
    }
    const sorted = Array.from({ length: 16 }, (_, p) => p).sort((a, b) => (a % 4 + Math.floor(a / 4)) - (b % 4 + Math.floor(b / 4)));
    for (const plot of sorted) {
      const { x, y } = xy(plot); const built = state.buildings.find(b => b.plot === plot);
      if (state.plots.includes(plot)) {
        tile(x, y, built && built.id === ui.selected, !built);
        hits.push({ x: x - 36, y: y - 18, w: 72, h: 36, diamond: true, event: { kind: 'plot', plot }, label: built ? Core.DEFINITIONS[built.type].name : '空甲板 ' + plot });
        if (ui.moveId && !built) { ellipse(x, y, 15, 8, '#67c4a790'); text('↓', x, y - 5, 17, '#fff8d8', '700', 'center'); }
      } else if (Core.expandable(state, plot)) {
        ctx.save(); ctx.setLineDash([3, 5]); poly([[x - 32, y], [x, y - 16], [x + 32, y], [x, y + 16]], '#c4f2dc0b', '#b5e5d25c'); ctx.restore();
        text('+', x, y, 17, '#d3e8cd9c', '400', 'center');
        hits.push({ x: x - 30, y: y - 16, w: 60, h: 32, diamond: true, event: { kind: 'plot', plot }, label: '扩建甲板 ' + plot });
      }
    }
    const buildings = state.buildings.slice().sort((a, b) => xy(a.plot).y - xy(b.plot).y);
    for (const b of buildings) {
      const pos = xy(b.plot); const live = b.type === 'eel' ? b.fuelUntil > now : power.active.includes(b.id);
      ctx.globalAlpha = ui.layoutMode ? .3 : 1;
      machine(b.type, pos.x, pos.y - 2, .88, t, live, b.level, b.id);
      ctx.globalAlpha = 1;
      if (!ui.layoutMode) hit(pos.x - 26, pos.y - 58, 53, 66, { kind: 'plot', plot: b.plot }, Core.DEFINITIONS[b.type].name);
      if (b.level > 1 && !assets[b.type]) badge('Lv.' + b.level, pos.x - 15, pos.y + 18, 34, '#fff0c9', '#8c663f');
    }
    for (const b of buildings) {
      const pos = xy(b.plot);
      if (b.pending > 0 && !ui.layoutMode) {
        const bob = Math.sin(t * 2 + b.id) * 2;
        rr(pos.x - 22, pos.y - 82 + bob, 44, 24, 10, '#fffbe9', '#d5e5c6'); icon(Core.DEFINITIONS[b.type].output, pos.x - 9, pos.y - 70 + bob, 15); text(b.pending, pos.x + 9, pos.y - 70 + bob, 12, C.teal, '700', 'center');
        hit(pos.x - 25, pos.y - 86, 50, 34, { kind: 'action', action: { type: 'collect', id: b.id } }, '收取' + Core.DEFINITIONS[b.type].short);
      }
    }
    // The crew occupies a separate front landing so plot placement remains available.
    ctx.save(); ctx.translate(190, 457); ctx.scale(1.65, 1.05); tile(0, 0, false, false); ctx.restore();
    ['crewTank', 'crewWire'].forEach((who, i) => {
      const x = 165 + i * 49, feet = 478;
      const reaction = ui.crewReaction && ui.crewReaction.who === who && ui.crewReaction.until > now;
      ctx.globalAlpha = ui.layoutMode ? .25 : 1;
      crewSprite(who, x, feet, 86, reaction, t);
      ctx.globalAlpha = 1;
      if (!ui.layoutMode) hit(x - 22, feet - 70, 44, 70, { kind: 'crew', value: who }, '查看' + CREW[who].name);
    });
    boat(61, 426, t * .6);
    const crates = [{ x: 69, y: 516 }, { x: 329, y: 334 }, { x: 327, y: 481 }];
    for (let i = 0; i < state.salvage; i++) {
      const p = crates[i]; const bob = Math.sin(t * 1.5 + i) * 3;
      ellipse(p.x, p.y + 13, 23, 6, '#d0f6df25'); icon('crate', p.x, p.y + bob, 33);
      ellipse(p.x + 16, p.y - 16 + bob, 7, 7, '#fce4a3'); text('+', p.x + 16, p.y - 16 + bob, 12, '#a77439', '600', 'center');
      hit(p.x - 25, p.y - 30, 54, 58, { kind: 'action', action: { type: 'salvage' } }, '打捞漂流物');
    }
    if (!ui.layoutMode) crewStrip(ui, now);
    if (!ui.layoutMode) effects(ui, now, xy);
    if (ui.moveId) { badge('移动中 · 点击空甲板', 110, 532, 170, '#fff3cb'); hit(110, 525, 170, 36, { kind: 'cancelMove' }, '取消移动'); }
    else { text(ui.layoutMode ? '布置模式 · 点击甲板建造或扩建' : '点击设备管理 · 虚线位置可扩建', 18, 543, 10, '#d2e9df'); button(298, 527, 74, 30, ui.layoutMode ? '完成布置' : '布置甲板', { kind: 'layout' }, 'secondary'); }
  }
  function homePanel(Core, state, ui, now) {
    const b=Core.getBuilding(state,ui.selected);
    if(!b&&!ui.layoutMode&&!ui.moveId){
      const pending=state.buildings.reduce((n,b)=>n+b.pending,state.salvager.pending)+Object.values(state.life.offline).reduce((a,b)=>a+b,0);
      button(18,681,111,36,'打捞材料',{kind:'action',action:{type:'salvage'}},'secondary',state.salvage>0);
      button(139,681,111,36,'自动打捞',{kind:'salvager'},'secondary');
      button(260,681,112,36,pending?'收取产物 · '+pending:'一键收取',{kind:'action',action:{type:'collectAll'}},'primary',pending>0);
      button(18,733,82,32,'家园目标',{kind:'quest'},'secondary');if(Core.questDone(state))ellipse(94,736,4,4,'#f5a64c');
      button(108,733,82,32,state.life.author?'阿昊':'阿昊来访',{kind:'author'},'primary');
      button(198,733,82,32,'拍照',{kind:'photo'},'secondary');
      button(288,733,84,32,'布置甲板',{kind:'layout'},'secondary');
      return;
    }
    panel(18,572,354,195);hit(18,572,354,195,null,'设备面板遮罩');
    if(!b){text('调整设备位置',35,602,18,C.ink,'700');wrap('点击设备管理，或选择空甲板建造。',35,643,310,14);button(35,701,320,42,'返回住宅',{kind:'layout'},'primary');return;}
    const d = Core.DEFINITIONS[b.type]; const p = Core.power(state, now); const active = p.active.includes(b.id);
    text(d.name, 35, 598, 17, C.ink, '600'); badge('Lv.' + b.level, 171, 587, 39);
    button(231, 585, 82, 27, '设备特写', { kind: 'portrait' }, 'secondary');
    text('×', 345, 599, 22, C.mute, '400', 'center'); hit(325, 578, 38, 38, { kind: 'deselect' }, '关闭设备面板');
    if (b.type === 'eel') {
      const remaining = Math.max(0, Math.ceil((b.fuelUntil - now) / 1000));
      text(remaining ? '发电中 · 提供 ' + (b.level + 2) + ' 点电力' : '电鳗饿了，投喂后开始发电', 35, 624, 12, remaining ? C.teal : C.mute);
      text('剩余 ' + Math.floor(remaining / 60) + '分' + String(remaining % 60).padStart(2, '0') + '秒', 35, 650, 12, C.ink);
      text('2 条鱼 = 3 分钟', 351, 650, 11, C.mute, '400', 'right');
      button(34, 675, 155, 38, '投喂电鳗 · 鱼 ×2', { kind: 'action', action: { type: 'feed', id: b.id } }, 'primary', state.resources.fish >= 2);
    } else {
      text((d.recipe?'投料后每批 ':'每 ') + (d.seconds / (active ? 2 : 1)) + ' 秒产出 ' + Core.amount(b) + ' ' + Core.RESOURCE_NAMES[d.output], 35, 624, 12, C.mute);
      text(d.recipe&&!b.batch?'等待投料 · 点击下方投料':b.pending >= Core.capacity(b) ? '暂存已满，收取后继续生产' : '暂存 ' + b.pending + '/' + Core.capacity(b), 35, 649, 11, C.ink);
      rr(209, 645, 143, 7, 4, '#e3eadd'); const progress = b.pending >= Core.capacity(b) ? 1 : b.progress / d.seconds; if (progress > 0) rr(209, 645, Math.max(7, 143 * progress), 7, 4, '#65b2a0');
      button(34,675,155,38,d.recipe&&!b.pending?(b.batch?'本批加工中':'投料开工'):'收取'+Core.RESOURCE_NAMES[d.output]+' · '+b.pending,{kind:'action',action:{type:d.recipe&&!b.pending?'batch':'collect',id:b.id}},'primary',b.pending>0||d.recipe&&!b.batch&&Core.afford(state,d.recipe));
    }
    button(201, 675, 155, 38, b.level >= 3 ? '已达最高等级' : '升级设备', b.level >= 3 ? { kind: 'action', action: { type: 'upgrade', id: b.id } } : { kind: 'upgradeModal' }, 'secondary', b.level < 3 && !b.batch && Core.afford(state, Core.upgradeCost(b)));
    // Upgrade opens a review panel instead of spending from an unexplained button.
    if (b.level < 3) hits[hits.length - 1].event = { kind: 'upgradeModal' };
    if (b.type !== 'eel') {
      button(34, 723, 219, 29, b.powered ? (active ? '电力加速 ×2 · 点击关闭' : '等待电力 · 点击关闭') : '开启电力加速 · 占用 1 电力', { kind: 'action', action: { type: 'power', id: b.id } }, 'secondary');
    } else text('电鳗吃饱，阿线的头发先来电', 35, 738, 11, C.mute);
    button(264, 723, 92, 29, '移动', { kind: 'move' }, 'secondary');
  }
  function ordersPanel(Core, state) {
    boat(195, 327, 0);
    const cheering = frameUi.crewReaction && frameUi.crewReaction.action === 'order' && frameUi.crewReaction.until > frameNow;
    crewSprite('crewTank', 301, 357, 105, cheering, frameUi.reducedMotion ? 0 : frameNow / 1000);
    hit(269, 265, 64, 93, { kind: 'crew', value: 'crewTank' }, '查看阿桶');
    text('商船靠岸了', 195, 371, 22, '#f8f8e4', '600', 'center');
    if (cheering) speech(frameUi.crewReaction.line, 195, 387, '#fff0c3', 11);
    else text('阿桶负责交货，也负责当场庆祝。', 195, 399, 12, '#d8eeDF', '400', 'center');
    panel(18, 431, 354, 336);
    const o = Core.ORDER_LIST[state.order % Core.ORDER_LIST.length];
    badge('订单 ' + String(state.order + 1).padStart(2, '0'), 35, 449, 65);
    text(o.from, 352, 461, 11, C.mute, '400', 'right'); text(o.title, 35, 494, 21, C.ink, '600'); wrap(o.line, 35, 525, 316, 12);
    let y = 564;
    for (const [key, n] of Object.entries(o.need)) {
      icon(key, 47, y, 23); text(Core.RESOURCE_NAMES[key], 70, y, 13); text(state.resources[key] + ' / ' + n, 349, y, 14, state.resources[key] >= n ? C.teal : '#bf8155', '600', 'right'); y += 31;
    }
    line([[35, 625], [354, 625]], C.line, 1); text('交付奖励', 35, 646, 11, C.mute); text(Core.costText(o.reward), 35, 670, 12, C.teal, '600');
    button(34, 702, 322, 45, '交付订单', { kind: 'action', action: { type: 'order' } }, 'primary', Core.afford(state, o.need));
  }
  function workshop(Core,state,ui,now) {
    panel(18,185,354,580);text('生物工坊',35,211,22,C.ink,'800');
    text('氧气 '+state.resources.oxygen+' · 树脂 '+state.resources.resin+' · 建材 '+state.resources.mortar,35,240,12,C.teal,'700');button(235,195,111,28,ui.workshopPage?'河豚 / 海牛':'鲨鱼搅拌机',{kind:'workshopPage',value:ui.workshopPage?0:1},'secondary');
    (ui.workshopPage?['mixer']:['puffer','manatee']).forEach((kind,i)=>{
      const y=260+i*164,d=Core.DEFINITIONS[kind],b=state.buildings.find(b=>b.type===kind),open=Core.unlocked(state,kind);
      rr(29,y,332,154,14,'#e7eee1');machine(kind,70,y+103,.78,ui.reducedMotion?0:now/1000);
      text(d.name,111,y+20,16,C.ink,'700');
      text(Core.costText(d.recipe)+' → '+Core.RESOURCE_NAMES[d.output]+' '+(b?Core.amount(b):d.amount),111,y+44,10,C.mute);
      if(!b){
        text(open?'建造：'+Core.costText(d.cost):'解锁：'+(d.unlock===1?'清凉小屋':'轮胎合租楼'),111,y+69,10,C.mute);
        button(111,y+96,233,36,open?'建造'+d.short:'先升级营地',open?{kind:'workBuild'}:{kind:'camp'},'primary');
      }else{
        const active=Core.power(state,now).active.includes(b.id),seconds=Math.ceil((d.seconds-b.progress)/(active?2:1));
        text((b.batch?'加工中 · 约 '+seconds+' 秒': '等待投料')+'  |  暂存 '+b.pending+'/'+Core.capacity(b),111,y+68,11,C.teal);
        button(111,y+87,108,27,'投料'+d.short,{kind:'action',action:{type:'batch',id:b.id}},'primary',!b.batch&&Core.afford(state,d.recipe)&&Core.capacity(b)-b.pending>=Core.amount(b));
        button(230,y+87,114,27,'收取'+Core.RESOURCE_NAMES[d.output],{kind:'action',action:{type:'collect',id:b.id}},'secondary',b.pending>0);
        button(111,y+122,233,24,'管理'+d.short+' · 特写 / 供电 / 升级',{kind:'workManage',id:b.id},'secondary');
      }
    });
    const o=Core.CONTRACTS[state.stats.contracts%Core.CONTRACTS.length];
    text('工坊订单 · '+o.title,35,615,16,C.ink,'700');
    text('交付：'+Core.costText(o.need),35,642,12,C.mute);
    text('奖励：'+Core.costText(o.reward),35,665,11,C.teal);
    button(35,688,320,39,'交付工坊订单',{kind:'action',action:{type:'contract',index:state.stats.contracts}},'primary',state.camp.stage>=2&&Core.afford(state,o.need));
    text('只加工已投料的一批 · 不会离线自动扣原料',195,746,10,C.mute,'400','center');
  }
  function journalPanel(Core,state,now) {
    panel(18,185,354,580);text('合租生活手记',35,215,23,C.ink,'800');
    const total=Object.values(state.life.stories).reduce((a,b)=>a+b,0);
    text('已经记下 '+total+'/15 段故事 · 收藏 '+state.life.owned.length+'/'+Core.DECOR.length+' 件装饰',35,245,11,C.teal);
    Object.keys(Core.STORIES).forEach((who,i)=>{
      const y=269+i*76,joined=Core.residents(state).includes(who),r=Core.story(state,who);
      rr(30,y,330,68,12,'#e4ece0');uiAuthorPose(0);crewSprite(who,63,y+65,63,false,0);
      text(CREW[who].name+' · '+state.life.stories[who]+'/3',104,y+18,14,C.ink,'700');
      text(!joined?'等他入住，一起写下故事':r?r[0]:'故事已收藏 · 点击回顾',104,y+43,11,C.mute);
      hit(30,y,330,68,{kind:who==='crewAuthor'&&!joined?'author':'story',who},CREW[who].name+'的故事');
    });
    button(35,676,153,34,'装饰收藏',{kind:'decor'},'secondary');button(201,676,154,34,'旧物商人',{kind:'visitor'},'secondary');
    text('故事随经营进度解锁，错过时间也不会消失。',195,741,11,C.mute,'400','center');
  }
  function uiAuthorPose(p){frameUi.renderAuthorPose=p;}
  function navigation(ui) {
    rr(18, 780, 354, 53, 20, '#fbf6e8');
    [{ k: 'home', label: '家园', icon: 'home' }, { k: 'residents', label: '居民', icon: 'home' }, { k: 'workshop', label: '工坊', icon: 'gear' }, { k: 'orders', label: '商船', icon: 'orders' }, { k: 'journal', label: '手记', icon: 'book' }].forEach((tab, i) => {
      const x = 23 + i * 70; const active = ui.tab === tab.k; if (active) rr(x, 787, 65, 39, 13, '#e2eddd'); icon(tab.icon, x + 14, 806, 17, active ? C.teal : '#8ca399'); text(tab.label, x + 28, 806, 12, active ? C.teal : '#7b9089', active ? '600' : '400'); hit(x, 782, 68, 48, { kind: 'tab', value: tab.k }, tab.label);
    });
  }
  function modal(Core, state, ui, now) {
    // Block every underlying control, including navigation, while a sheet is open.
    ctx.fillStyle = '#082f42a6'; ctx.fillRect(0, 0, 390, 844); hit(0, 0, 390, 844, null, '弹窗遮罩');
    const type = ui.modal;
    let y = (type === 'portrait' || type === 'crew' || type === 'camp' || type === 'rooms' || type === 'salvager' || type === 'source') ? 230 : type === 'build' ? 308 : type === 'welcome' ? 246 : type === 'settings' ? 340 : 398;
    if(['story','author','decor','visitor','interact'].includes(type))y=215;
    if(type==='skyRoom')y=215;
    if(['tales','episode','antic'].includes(type))y=185;
    const h = 814 - y; panel(14, y, 362, h); rr(173, y + 10, 44, 4, 2, '#d3dfd0');
    if (type !== 'welcome') { text('×', 348, y + 34, 24, C.mute, '400', 'center'); hit(326, y + 15, 44, 44, { kind: 'close' }, '关闭弹窗'); }
    if(type==='skyRoom'){skyRoomModal(Core,state,ui,now);return;}
    if(['tales','episode','antic'].includes(type)){talesModal(Core,state,ui,now);return;}
    if(['story','author','decor','visitor','interact'].includes(type)){lifeModal(Core,state,ui,now);return;}
    if (type === 'welcome') {
      text('这片海我包了', 195, y + 47, 25, C.ink, '700', 'center'); text('锅快接满了，先给怪人们一个不漏雨的家。', 195, y + 81, 13, C.mute, '400', 'center');
      tile(195, y + 226, false, false); machine('filter', 195, y + 221, .8, frameUi.reducedMotion ? 0 : now / 1000);
      crewSprite('crewTank', 113, y + 232, 132, false, 0);
      crewSprite('crewWire', 277, y + 232, 132, true, 0);
      const rows = [['01', '先补好漏雨屋顶', '阿桶把锅戴头上，卷姨还等着做饭。'], ['02', '请生物伙伴来帮忙', '章鱼捞木头，电鳗发电，河豚鼓气。'], ['03', '和怪人一起生活', '遇见阿昊，收藏故事，布置和拍照。']];
      rows.forEach((r, i) => { const yy = y + 258 + i * 66; badge(r[0], 37, yy - 10, 33); text(r[1], 85, yy, 15, C.ink, '600'); text(r[2], 85, yy + 23, 12, C.mute); });
      button(36, 738, 318, 48, '开始建设', { kind: 'welcome' }, 'primary');
    } else if(type==='salvager') {
      const q=state.salvager,active=Core.power(state,now).active.includes('salvager'),amount=Core.salvagerAmount(state);
      text('章鱼打捞站',35,273,24,C.ink,'800');text('独立泊位 · 不占甲板 · 不消耗漂流物',35,307,12,C.mute);
      rr(29,329,332,162,15,'#cee2db');octopus(160,483,1.35,ui.reducedMotion?0:now/1000,q.built&&q.pending<24);
      if(q.worker)crewSprite(q.worker,282,479,94,false,0);
      if(!q.built){
        wrap('章鱼负责捞，居民负责搬。每 20 秒自动获得 2 木材；指派居民后每批 3 木材。',35,522,314,14,C.ink,24);
        text('木材暂存 24 · 满后暂停 · 离线照常结算',35,591,12,C.mute);
        materialChips(Core,state,Core.SALVAGER.cost,619);
        text(state.home.rooms.includes('roof')?'屋顶已修好，可以开工':'解锁条件：先完成「补好漏雨屋顶」',35,674,12,C.teal);
        button(35,699,320,34,'去修屋顶',{kind:'rooms'},'secondary');
        button(35,746,320,44,'建造章鱼打捞站',{kind:'action',action:{type:'salvagerBuild'}},'primary',state.home.rooms.includes('roof')&&Core.afford(state,Core.SALVAGER.cost));
      }else{
        text('木材 '+q.pending+'/24 · '+(q.pending===24?'暂存已满，收取后继续':Math.ceil((20-q.progress)/(active?2:1))+'秒后 +'+amount),35,516,14,C.teal,'700');
        rr(35,537,320,6,3,'#dee5d9');rr(35,537,Math.max(6,320*(q.pending===24?1:q.progress/20)),6,3,'#63ac9f');
        text('居民协助（免费换班，每批 +1 木材）',35,569,12,C.mute);
        Core.residents(state).forEach((who,i)=>button(35+i*65,590,60,32,CREW[who].name,{kind:'action',action:{type:'salvagerAssign',worker:who}},q.worker===who?'primary':'secondary'));
        button(35,637,153,31,'让居民休息',{kind:'action',action:{type:'salvagerAssign',worker:null}},'secondary',!!q.worker);
        button(201,637,153,31,q.powered?'关闭电力加速':'开启电力加速',{kind:'action',action:{type:'salvagerPower'}},q.powered?'primary':'secondary');
        text((active?'通电每 10 秒':q.powered?'等待电力，每 20 秒':'自然每 20 秒')+'产 '+amount+' 木材 · 占用 1 电力加速',35,691,12,C.mute);
        button(35,710,320,26,'和章鱼一起捞木头',{kind:'interact',value:'wood'},'secondary');
        button(35,746,320,44,'收取木材 · '+q.pending,{kind:'action',action:{type:'salvagerCollect'}},'primary',q.pending>0&&state.resources.wood<Core.CAP);
      }
    } else if(type==='source') {
      const key=ui.sourceKey||'wood',need=ui.sourceNeed||1;
      text(Core.RESOURCE_NAMES[key]+'从哪里来？',35,273,23,C.ink,'800');
      text('已有 '+state.resources[key]+' / 需要 '+need,35,315,17,C.teal,'700');
      const info={wood:['章鱼自动打捞、手动漂流物和商船订单。','salvager','去章鱼打捞站'],metal:['手动漂流物每份给 2 金属，灯塔建成后给 3。商船订单也可换金属。','salvage','去打捞材料'],water:['过滤器自然产水，通电速度翻倍。点击设备收取暂存。','filter','去过滤器'],fish:['基础渔场自然捕鱼，不用饲料。通电可加速。','fishery','去渔场'],coins:['交付商船订单赚金币。厨房与新住户也能提高供餐收入。','orders','去商船'],oxygen:['给河豚投料淡水，每批产出氧气瓶。','puffer','去河豚增氧机'],resin:['给海牛投料氧气瓶和淡水，每批产出海工树脂。','manatee','去海牛化工厂'],mortar:['给鲨鱼投料树脂和金属，每批产出防水建材。','mixer','去鲨鱼搅拌机']}[key];
      wrap(info[0],35,365,313,15,C.ink,26);
      wrap(key==='wood'?Core.woodEstimate(state,need,now):'手动投料、收取与交易会改变库存；不估算未开始的生产。',35,452,313,12,C.mute,22);
      button(35,518,320,42,info[2],{kind:'sourceGo',value:info[1]},'primary');
      if(key==='wood'){button(35,576,320,38,'去手动打捞',{kind:'sourceGo',value:'salvage'},'secondary');button(35,630,320,38,'去商船换木材',{kind:'sourceGo',value:'orders'},'secondary');}
      button(35,746,320,44,'返回上一页',{kind:'sourceBack'},'secondary');
    } else if (type === 'rooms') {
      const index=Math.min(ui.roomIndex||0,Core.ROOMS.length-1),r=Core.ROOMS[index],done=state.home.rooms.includes(r.id),job=state.home.construction;
      text('居住改造 · '+(index+1)+'/5',34,y+43,22,C.ink,'800');
      text(r.name,35,y+77,17,C.teal,'700');
      rr(29,y+100,332,185,15,'#294d5b');roomSprite(index+1,68,y+99,255,182);
      wrap(r.event,35,y+311,313,13,C.ink,22);
      wrap(r.result,35,y+353,313,12,C.mute,21);
      materialChips(Core,state,r.cost,616);
      const why=done?'已经完成 · 永久保留':job?'正在施工：'+Core.ROOMS.find(r=>r.id===job.id).name+' · '+Math.ceil((job.endsAt-now)/1000)+' 秒':state.camp.stage<r.stage?'需要营地阶段 '+r.stage: index>0&&!state.home.rooms.includes(Core.ROOMS[index-1].id)?'先完成：'+Core.ROOMS[index-1].name:r.id==='lookout'&&!state.home.resident?'先邀请阿潜入住':'施工 '+r.seconds+' 秒 · 离线可完成';
      text(why,35,682,11,C.teal);
      button(35,698,153,30,'上一项',{kind:'roomPage',value:Math.max(0,index-1)},'secondary',index>0);
      button(201,698,153,30,'下一项',{kind:'roomPage',value:Math.min(4,index+1)},'secondary',index<4);
      button(35,746,320,44,done?'已完成':job?'施工进行中':'开始改造 · '+r.name,r.id==='roof'&&!done&&!job?{kind:'interact',value:'roof'}:{kind:'roomStart',id:r.id},'primary',Core.roomReady(state,r.id)&&Core.afford(state,r.cost));
    } else if (type === 'camp') {
      const stage=state.camp.stage,p=Core.CAMP_PROJECTS[stage],who=p?p.who:'crewBoss';
      text(p?'营地项目 '+(stage+1)+'/3':'机械鲨鱼营地落成',34,y+43,22,C.ink,'800');
      text(p?p.title:'人和房子，一起出海！',35,y+76,14,C.teal,'700');
      const art=assets[stage>=2?'shark':stage>=1?'tower':'raft'];
      rr(29,y+100,332,217,15,'#d2e5dd');if(art)ctx.drawImage(art,97,y+101,216,216);
      crewSprite(who,91,y+309,104,true,0);
      wrap(p?p.line:'三个居民项目已完成。营地外观永久保留，仍可继续经营与供餐。',35,y+344,316,13,C.mute,23);
      if(p){ text('条件：'+p.need,35,y+416,12,Core.campReady(state)?C.teal:'#a36e44');wrap('消耗：'+Core.costText(p.cost),35,y+445,316,12,C.ink,20); }
      button(35,746,320,44,p?'确认建设 · '+p.result:'回去开工',p?{kind:'confirmCamp',stage}:{kind:'close'},'primary',!p||(Core.campReady(state)&&Core.afford(state,p.cost)));
    } else if (type === 'crew') {
      const who = ui.crew || 'crewTank', person = CREW[who];
      const reacting = ui.crewPoseUntil > now || !!(ui.crewReaction && ui.crewReaction.who === who && ui.crewReaction.until > now);
      text(person.name + (who==='crewAuthor'?' · 旅居作者':' · 海上打工人'), 34, y + 45, 23, C.ink, '700');
      text(person.role, 35, y + 78, 12, C.mute);
      rr(29, y + 101, 332, 291, 18, '#d4e7db');
      ui.renderAuthorPose=ui.authorPose||0;
      crewSprite(who, 195, y + 394, 294, reacting, frameUi.reducedMotion ? 0 : now / 1000);
      speech(reacting ? person.react : person.idle, 195, y + 412, '#fff0c3', 12);
      text(who==='crewAuthor'?'旅行 / 工作 / 试吃 / 咖啡 · 点击切换动作':'打捞、投喂、交货时，他们会在甲板上吐槽。', 195, y + 454, 11, C.mute, '400', 'center');
      button(35, 704, 153, 31, who === 'crewTank' ? '看看阿线' : who === 'crewWire' ? '看看卷姨' : '看看阿桶', { kind: 'crew', value: who === 'crewTank' ? 'crewWire' : who === 'crewWire' ? 'crewBoss' : 'crewTank' }, 'secondary');
      button(200, 704, 155, 31, '整一个表情', { kind: 'crewReact' }, 'secondary');
      button(35,749,320,41,'他的故事 · '+state.life.stories[who]+'/3',{kind:'story',who},'primary');
    } else if (type === 'portrait') {
      const b = Core.getBuilding(state, ui.selected); if (!b) return;
      const d = Core.DEFINITIONS[b.type], active = b.type === 'eel' ? b.fuelUntil > now : Core.power(state, now).active.includes(b.id);
      text(d.name, 34, y + 45, 22, C.ink, '700');
      const quotes = { mixer: '我不是吃金属，我是在拌房子。', puffer: '这口气，憋出了生产力。', manatee: '别催，树脂得慢慢搅。', filter: '小黄鸭：我只是来洗澡的。', fishery: '鱼：不是，说好的自由泳呢？', eel: active ? '给两条鱼，我能电一整条街。' : '电可以没有，饭不能不吃。' };
      text(quotes[b.type], 35, y + 77, 13, C.mute);
      const g = ctx.createLinearGradient(30, y + 100, 360, y + 355); g.addColorStop(0, '#d4ecde'); g.addColorStop(1, '#a9d6d5'); rr(29, y + 100, 332, 261, 18, g);
      for (let i = 0; i < 9; i++) { const a = i * .7; line([[195 + Math.cos(a) * 95, y + 230 + Math.sin(a) * 70], [195 + Math.cos(a) * 132, y + 230 + Math.sin(a) * 102]], '#fff7d050', 5); }
      machine(b.type, 195, y + 341, 2.15, frameUi.reducedMotion ? 0 : now / 1000, active || !!b.batch, b.level, b.id);
      badge(b.type === 'eel' ? (active ? '电力营业中' : '等鱼下锅…不，进碗') : active ? '通电加速 ×2' : (d.recipe?(b.batch?'正在加工':'等待投料'):'自然生产中'), 115, y + 378, 160, '#f8dfa1', '#6e512c');
      wrap(d.description, 36, y + 425, 314, 14, C.mute, 23);
      if(b.type==='eel'||b.type==='puffer')button(35,700,320,30,b.type==='eel'?'拖动鲜鱼 · 喂给电鳗':'按住河豚 · 鼓一口气',{kind:'interact',value:b.type,id:b.id},'secondary');
      const startBatch=d.recipe&&b.pending===0;
      const action = b.type === 'eel' ? { type: 'feed', id: b.id } : { type: startBatch?'batch':'collect', id: b.id };
      const label = b.type === 'eel' ? '给它加餐 · 鱼 ×2' : startBatch?(b.batch?'本批加工中':'投料开工'):'收取' + Core.RESOURCE_NAMES[d.output] + ' · ' + b.pending;
      button(35, 746, 320, 44, label, { kind: 'action', action }, 'primary', b.type === 'eel' ? state.resources.fish >= 2 : startBatch?(!b.batch&&Core.afford(state,d.recipe)):b.pending > 0);
    } else if (type === 'build') {
      text('给家园添一台设备', 34, y + 38, 21, C.ink, '600'); button(34,y+62,153,27,'基础设备',{kind:'buildPage',value:0},ui.buildPage?'secondary':'primary');button(201,y+62,153,27,'生物工坊',{kind:'buildPage',value:1},ui.buildPage?'primary':'secondary');
      (ui.buildPage?['puffer','manatee','mixer']:['filter', 'fishery', 'eel']).forEach((kind, i) => {
        const d = Core.DEFINITIONS[kind], yy = y + 101 + i * 121; rr(29, yy, 332, 109, 16, '#edf1e3'); machine(kind, 70, yy + 73, .65, 0);
        text(d.name, 109, yy + 23, 15, C.ink, '600'); text(d.recipe?(Core.unlocked(state,kind)?'手动投料 · 通电加速':'需要营地阶段 '+d.unlock):kind === 'filter' ? '自然产水 · 通电加速' : kind === 'fishery' ? '无需供电也能捕捞' : '投喂鲜鱼，持续发电', 109, yy + 46, 11, C.mute);
        text(Core.costText(d.cost), 109, yy + 68, 10, C.mute);
        button(246, yy + 78, 100, 25, '建造', { kind: 'build', value: kind }, 'primary', Core.unlocked(state,kind)&&Core.afford(state, d.cost));
      });
      text('材料不够？先收集海面的漂流物。', 195, 791, 11, C.mute, '400', 'center');
    } else if (type === 'expand') {
      text('铺一块新的甲板', 34, y + 44, 21, C.ink, '600'); tile(195, y + 123, true, false);
      wrap('给未来的设备留一点空间。甲板扩建后永久保留，最多可铺设 16 块。', 35, y + 188, 315, 14);
      text('建造消耗', 35, y + 255, 12, C.mute); text(Core.costText(Core.expansionCost(state)), 35, y + 282, 16, C.ink, '600');
      button(35, 746, 320, 44, '确认扩建', { kind: 'expand' }, 'primary', Core.afford(state, Core.expansionCost(state)));
    } else if (type === 'upgrade') {
      const b = Core.getBuilding(state, ui.selected); if (!b) return;
      text('升级' + Core.DEFINITIONS[b.type].short, 34, y + 44, 21, C.ink, '600'); machine(b.type, 195, y + 141, 1.2, 0, b.type === 'eel', b.level + 1);
      text('Lv.' + b.level + '  →  Lv.' + (b.level + 1), 195, y + 173, 17, C.teal, '700', 'center');
      text(b.type === 'eel' ? '供电容量 ' + (b.level + 2) + ' → ' + (b.level + 3) : '每次产量 ' + Core.amount(b) + ' → ' + (Core.amount(b) + 1) + '，暂存容量 +3', 195, y + 209, 14, C.ink, '500', 'center');
      text('升级消耗', 35, y + 264, 12, C.mute); text(Core.costText(Core.upgradeCost(b)), 35, y + 290, 14, C.ink, '600');
      button(35, 746, 320, 44, '确认升级', { kind: 'confirmUpgrade' }, 'primary', Core.afford(state, Core.upgradeCost(b)));
    } else if (type === 'quest') {
      const q = Core.QUESTS[state.quest]; text(q ? '下一步，做这件小事' : '家园已经运转起来了', 34, y + 44, 20, C.ink, '600');
      icon(q ? 'book' : 'check', 195, y + 111, 48); text(q ? q.title : '全部经营目标完成', 195, y + 169, 19, C.ink, '600', 'center');
      wrap(q ? q.tip : '你可以继续扩建甲板、升级设备、交付商船订单。还可以在居民页推进营地项目，让木筏成长为机械鲨鱼住宅。', 36, y + 213, 314, 14, C.mute, 25);
      if (q) { text('完成奖励', 35, y + 290, 12, C.mute); text(Core.costText(q.reward), 35, y + 315, 14, C.teal, '600'); }
      button(35, 746, 320, 44, '回家园继续', { kind: 'jumpQuest' }, 'primary');
    } else if (type === 'offline') {
      text('欢迎回家', 34, y + 44, 24, C.ink, '600'); icon('home', 195, y + 112, 48);
      text('海风替你照看了小岛', 195, y + 167, 19, C.ink, '600', 'center');
      const o = ui.offline || { elapsed: 0, produced: {} };
      text('本次结算 ' + Math.max(1, Math.floor(o.elapsed / 60000)) + ' 分钟 · 上限 4 小时', 195, y + 201, 12, C.mute, '400', 'center');
      wrap('新生产：'+(Core.costText(o.produced)||'暂无新增产物'),35,y+237,315,14,C.teal,22);
      wrap('设备暂存之外，还有独立的离线补给箱。满仓未领取的补给会保留；手动加工只完成已投料的一批。', 35, y + 286, 315, 12, C.mute, 22);
      button(35,690,320,34,'统一收取补给',{kind:'action',action:{type:'collectAll'}},'primary');button(35,746,320,44,'看看我的家园',{kind:'close'},'secondary');
    } else if (type === 'settings') {
      text('这片海我包了', 34, y + 43, 21, C.ink, '600'); badge('怪人营地 · v1.3.1', 35, y + 74, 127);
      wrap('这是一个本地经营原型。设备自然生产、供电加速、商船订单、扩建和升级均可游玩。', 35, y + 121, 314, 14, C.mute, 25);
      wrap('进度只保存在当前设备的本地存储。尚未接入账号、云存档、广告或支付。仓库每种资源上限 500。', 35, y + 213, 314, 13, C.mute, 23);
      button(35,643,320,28,state.life.sound?'音效：开启':'音效：关闭',{kind:'action',action:{type:'sound'}},'secondary');
      if (ui.resetConfirm) {
        text('确定清空家园？此操作无法撤销。', 35, 688, 14, '#b36d4a', '600');
        button(35, 731, 153, 44, '保留家园', { kind: 'resetCancel' }, 'primary'); button(201, 731, 153, 44, '清空并重新开始', { kind: 'reset' }, 'secondary');
      } else {
        text(ui.storageError ? '当前保存失败，请勿退出' : '当前进度已自动保存', 35, 684, 12, ui.storageError ? '#b36d4a' : C.teal);
        button(35, 731, 319, 44, '重新开始这座家园', { kind: 'resetAsk' }, 'secondary');
      }
    }
  }
  function skyRoomSprite(r,x,y,w,h,t,active){
    const im=assets.skyrooms;
    if(im){const rects=[[20,0,605,336],[640,15,595,321],[20,337,590,306],[640,337,595,306],[20,644,590,293],[640,644,595,293],[20,940,610,300]],q=rects[r.art],sx=im.width/1254,sy=im.height/1254,k=Math.min(w/q[2],h/q[3]),dw=q[2]*k,dh=q[3]*k;ctx.drawImage(im,q[0]*sx,q[1]*sy,q[2]*sx,q[3]*sy,x+(w-dw)/2,y+h-dh,dw,dh);}
    else{rr(x+5,y+12,w-10,h-12,5,'#315c60','#d2a96d');rr(x+12,y+h-16,w-24,16,2,'#bb8955');text(r.name,x+w/2,y+h/2,12,'#ffe4ad','700','center');}
    const cx=x+w*(r.id==='laundry' ? .38 : r.id==='bath' ? .43 : .55),cy=y+h*.61,p=frameUi.reducedMotion?0:Math.sin(t*3),s=w/150;
    ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
    if(r.id==='coffee'||r.id==='bath'){for(let j=0;j<(active?10:3);j++)ellipse(-20+j%4*10,-8-Math.floor(j/4)*12+p*3,active?6:3,active?6:3,'#fff8dcbb');}
    if(r.id==='laundry'){for(let j=0;j<3;j++){const a=t*(active?5:1)+j*2;ellipse(Math.cos(a)*15,Math.sin(a)*13,4,6,'#8ce6ef99');}if(active){rr(-5,-17,9,24,2,'#f7e6b5');rr(-5,1,16,7,2,'#f7e6b5');}}
    if(r.id==='diner'){for(let j=0;j<3;j++){ellipse(-20+j*15,-10+p*3,3,5,'#aae7adbb');}if(active)text('？！',0,-30,22,'#fff1ae','800','center');}
    if(r.id==='greenhouse'){line([[0,20],[6+p*4,0],[active?36:10,-20]],'#91bb69',4);ellipse(active?31:12,-16,12,5,'#a9c979');}
    if(r.id==='hammock'&&active){ellipse(p*25,25+Math.abs(p)*15,5,10,'#e7b774');line([[p*25-4,23+Math.abs(p)*15],[p*25,28+Math.abs(p)*15],[p*25+4,23+Math.abs(p)*15]],'#81a6a2',2);text('呼～',0,-20,14,'#fff1d4');}
    if(r.id==='rooftop'){for(let j=0;j<5;j++)ellipse(-50+j*24,-35,2.5,3.5,'#ffe5a0');if(active){text('♪',20+p*5,-12,20,'#ffe8a7');ellipse(0,7,8,4,'#eff1e888');}}
    ctx.restore();
  }
  function towerCamera(Core,state,ui){
    const levels=Math.max(Core.towerTop(state),Core.towerReach(state)),height=80+levels*126+155;
    const full=ui.towerOverview||ui.photo,scale=full?Math.min(1,365/height):1;
    const target=80+(levels-Math.max(1,Math.min(levels,ui.floor||levels)))*126-80;
    const maxScroll=Math.max(0,height-369),scroll=Math.max(0,Math.min(maxScroll,Number.isFinite(ui.towerScroll)?ui.towerScroll:target));
    return {levels,height,maxScroll,scroll,scale,ox:12+(330-330*scale)/2,oy:full?186:184-scroll};
  }
  function towerScene(Core,state,ui,t,now){
    const top=Core.towerTop(state),reach=Core.towerReach(state),focus=Math.min(reach,Math.max(1,ui.floor||top)),full=ui.towerOverview||ui.photo,camera=towerCamera(Core,state,ui);
    const active=ui.roomEffect&&ui.roomEffect.until>now?ui.roomEffect.id:null;
    if(!ui.photo){text('这栋海楼我盖了',20,148,18,'#fff1ce','800');text(full?'整栋全景 · 等比例展示':'拖动画面看整栋 · 点房间直接互动',20,172,11,'#cbece6');}
    const first=hits.length;ctx.save();ctx.beginPath();ctx.rect(12,184,330,369);ctx.clip();
    const {scale,ox,oy,levels}=camera;
    ctx.translate(ox,oy);ctx.scale(scale,scale);
    const floorY=f=>80+(levels-f)*126,base=80+levels*126;
    // The hull, structural wall and roof share one world-space camera.
    if(assets.shark){ctx.save();ctx.beginPath();ctx.rect(-15,base-8,350,158);ctx.clip();ctx.drawImage(assets.shark,-15,base-195,350,350);ctx.restore();}
    else{ellipse(154,base+55,170,65,'#658e90','#e4b875');poly([[0,base+45],[20,base+98],[90,base+100]],'#d9d0aa');ellipse(64,base+42,10,10,'#ffdb80');}
    rr(-5,base-9,322,18,2,'#a97742','#f0c77f');
    for(let j=0;j<8;j++)line([[8+j*41,base-8],[8+j*41,base+6]],'#5e4836',2);
    rr(5,80,300,levels*126,1,'#294c4d');
    for(let x=12;x<305;x+=18)line([[x,80],[x,base]],x%3?'#45615a':'#56716a',1);
    for(const x of [4,153,306]){rr(x-4,72,9,base-72,1,'#634632','#c39b62');}
    const show=Array.from({length:levels},(_,i)=>levels-i);
    for(const f of show){
      const y=floorY(f),newRooms=Core.SKY_ROOMS.filter(r=>r.floor===f),swap=state.tower.swapped.includes(f);
      rr(8,y+6,294,117,1,'#355450');
      for(let j=0;j<6;j++)line([[9,y+18+j*18],[301,y+18+j*18]],'#45645b',1);
      line([[7,y+12],[7,y+126],[306,y+126],[306,y+12]],'#896546',6);line([[5,y+126],[310,y+126]],'#dbb17b',7);line([[7,y+26],[306,y+26]],'#8d6b4a',3);text(f+'F',16,y+17,10,'#ffe7aa','700');
      line([[152,y+22],[152,y+126]],'#b78b59',4);for(let j=0;j<6;j++)line([[150,y+30+j*12],[161,y+30+j*12]],'#e5c188',2);
      line([[313,y+25],[313,y+124]],'#76b3ac',3);
      if(f<=2){[0,1].forEach((j)=>{roomSprite(f===1?j+1:j+3,j*155,y,151,126);crewSprite((f===1?['crewTank','crewBoss']:['crewWire','crewDiver'])[j],j*155+54,y+123,40,false,t);if(!full)hit(j*155,y,151,126,{kind:'rooms'},f===1?(j?'改造厨房':'改造卧室'):(j?'改造客厅':'改造客房'));});}
      newRooms.forEach((r,j)=>{
        const x=r.floor===6?0:(swap?1-j:j)*155,w=r.floor===6?310:151,done=state.tower.rooms.includes(r.id),job=state.tower.construction&&state.tower.construction.id===r.id?state.tower.construction:null;
        if(done){skyRoomSprite(r,x,y,w,126,t,active===r.id);const who=r.who==='crewAuthor'&&!state.life.author?'crewWire':r.who;if(r.id==='rooftop'&&(active===r.id||ui.photo)){Core.residents(state).forEach((person,i)=>crewSprite(person,x+57+i*44,y+123,36,true,t));}else crewSprite(who,x+w*.3,y+123,active===r.id?53:45,active===r.id,t);}
        else if(job){const progress=Math.min(1,(now-job.startedAt)/(job.endsAt-job.startedAt));ctx.save();ctx.globalAlpha=.25;skyRoomSprite(r,x,y,w,126,t,false);ctx.restore();ctx.save();ctx.beginPath();ctx.rect(x,y+126*(1-progress),w,126*progress);ctx.clip();skyRoomSprite(r,x,y,w,126,t,false);ctx.restore();line([[x+w*.5,y-10],[x+w*.5,y+35]],'#e4c18b',2);icon('crate',x+w*.5,y+40+(frameUi.reducedMotion?0:Math.sin(t*2)*5),28);text((progress<.3?'吊框架':progress<.8?'搬家具':'住户上楼')+' '+Math.round(progress*100)+'%',x+w*.5,y+87,11,'#fff5ce','800','center');}
        else {rr(x+7,y+15,w-14,104,8,'#173c4880','#b4c7b480');text('＋',x+w/2,y+49,25,'#ffe2a3','700','center');text(r.name,x+w/2,y+79,11,'#fff2cf','700','center');text('点此查看扩建',x+w/2,y+99,9,'#b8dbd4','400','center');}
        if(!full)hit(x,y,w,126,{kind:'skyRoom',id:r.id},(done?'走进':'扩建')+r.name);
      });

      // Shared projecting eave/slab: upper floor loads sit on the lower room walls.
      poly([[-3,y+2],[304,y+2],[316,y+13],[4,y+13]],'#b28555','#e0bc80');
      rr(4,y+13,312,7,1,'#6b4a32');
      for(let j=0;j<12;j++)line([[8+j*25,y+3],[17+j*25,y+12]],'#725239',1);
      for(const x of [8,153,302]){rr(x-3,y+20,6,106,1,'#8d6842');ellipse(x,y+26,1.7,1.7,'#e7bc70');}
      if(f>1){line([[-3,y+22],[-3,y+124],[-13,y+124]],'#a98958',3);for(let j=0;j<8;j++)line([[-13,y+30+j*12],[-3,y+30+j*12]],'#d6b681',2);}
      if(state.home.rooms.includes('lights'))for(let j=0;j<5;j++)ellipse(27+j*62,y+16,2,3,'#ffe4a3');
    }
    // One pitched roof crowns the building; the lighthouse rests on its right ridge.
    poly([[-13,81],[38,42],[270,42],[326,81]],'#8b7866','#dfb77a');
    for(let j=0;j<15;j++){const x=38+j*16;line([[x,43],[x+12,78]],j%2?'#ac8a66':'#546d70',6);}
    if(assets.rooms){const im=assets.rooms;ctx.save();poly([[-13,81],[38,42],[270,42],[326,81]],null,null);ctx.clip();ctx.drawImage(im,30*im.width/1254,20*im.height/1254,570*im.width/1254,90*im.height/1254,-13,35,339,54);ctx.restore();}
    line([[-13,81],[326,81]],'#e2b574',6);rr(-10,83,333,9,1,'#67472f');
    roomSprite(5,215,-2,87,57);
    if(state.island.choices.length===3){rr(115,90,76,28,2,'#9c3932');text('正经办事',153,109,13,'#ffe5a5','700','center');}
    for(const x of [231,284])line([[x,49],[x,59]],'#9a7045',3);

    ctx.restore();
    // Convert scene-local hitboxes using exactly the same camera transform, then clip.
    for(let i=first;i<hits.length;i++){const h=hits[i];h.x=ox+h.x*scale;h.y=oy+h.y*scale;h.w*=scale;h.h*=scale;const right=Math.min(342,h.x+h.w),bottom=Math.min(553,h.y+h.h);h.x=Math.max(12,h.x);h.y=Math.max(184,h.y);h.w=Math.max(0,right-h.x);h.h=Math.max(0,bottom-h.y);}
    for(let i=hits.length-1;i>=first;i--)if(hits[i].w<=0||hits[i].h<=0)hits.splice(i,1);
    if(ui.photo)return;
    for(let f=1;f<=6;f++)button(347,210+(6-f)*46,31,34,String(f)+'F',{kind:'floor',value:f},focus===f&&!full?'primary':'secondary',f<=reach);
    const job=state.tower.construction,selected=Core.SKY_ROOMS.find(r=>r.id===(active||ui.skyRoom)&&state.tower.rooms.includes(r.id)),reply=selected?(active?selected.reply:'查看「'+selected.name+'」的入住小事'):null;
    if(reply){rr(18,554,354,32,8,'#123d50');hit(18,554,354,32,{kind:'skyRoomDetail',id:selected.id},'查看房间小事');}
    text(reply?reply.slice(0,23)+'… ›':job?'施工中 · '+Core.SKY_ROOMS.find(r=>r.id===job.id).name+' · '+Math.max(0,Math.ceil((job.endsAt-now)/1000))+' 秒':'已建 '+state.tower.rooms.length+'/7 间 · 入住小事 '+state.tower.seen.length+'/7',195,568,11,'#fff1c9','600','center');
    button(18,594,112,26,full?'返回近景':'整栋看看',{kind:'towerOverview'},'secondary');
    button(138,594,113,26,'免费左右换位',{kind:'towerSwap',floor:focus},'secondary');
    button(259,594,113,26,'设备甲板',{kind:'towerExit'},'secondary');
    button(18,628,172,32,'海上怪事',{kind:'tales'},'primary');
    button(198,628,174,32,state.island.docked?'基博岛 · 已靠岸':Core.islandReady(state,now)?'发现基博岛 · 靠岸':'岛屿航线',{kind:'island'},'primary');
  }
  function skyRoomModal(Core,state,ui,now){
    const r=Core.SKY_ROOMS.find(r=>r.id===ui.skyRoom),done=state.tower.rooms.includes(r.id),job=state.tower.construction;
    const active=ui.roomEffect&&ui.roomEffect.id===r.id&&ui.roomEffect.until>now;
    text(r.name,35,257,22,C.ink,'800');text(r.floor+' 楼 · '+(done?'点道具，也可以点下方按钮':'一间新房，一段新生活'),35,290,12,C.teal);
    rr(30,313,330,224,14,'#c9ded7');skyRoomSprite(r,40,317,310,210,ui.reducedMotion?0:now/1000,active);
    if(done)hit(40,317,310,210,{kind:'towerPlay',id:r.id},r.action+'（房间内）');
    wrap(active?r.reply:r.intro,35,559,315,14,C.ink,23);
    if(!done){materialChips(Core,state,r.cost,630);text(job?'吊机正在施工，请稍等':Core.towerReady(state,r.id)?'施工 '+r.seconds+' 秒 · 离线可完成':r.floor===3?'先完成原有屋顶灯塔':'先建好 '+(r.floor-1)+' 楼的两间房',35,696,12,C.teal);}
    else text(state.tower.seen.includes(r.id)?'入住小事已收藏 · 随时再玩':'第一次互动将记下这段入住小事',35,696,12,C.teal);
    button(35,746,320,44,done?r.action:'开工 · '+r.name,done?{kind:'towerPlay',id:r.id}:{kind:'towerBuild',id:r.id},'primary',done||Core.towerReady(state,r.id)&&Core.afford(state,r.cost));
  }

  function largeHarbor(Core,state,ui,t,now){
    if(state.home.rooms.includes('lookout')&&ui.tower!==false){towerScene(Core,state,ui,t,now);return;}
    // Reposition the scene without stretching sprites, text, or hit targets.
    const first=hits.length,offsetY=48;ctx.save();ctx.translate(0,offsetY);harbor(Core,state,ui,t,now);ctx.restore();
    for(let i=first;i<hits.length;i++)hits[i].y+=offsetY;
    if(!ui.photo&&ui.interactionSuccess&&ui.interactionSuccess.until>now)speech(ui.interactionSuccess.kind==='eel'?'嗝——来电了！':ui.interactionSuccess.kind==='puffer'?'呼！这一口，开始生产！':ui.interactionSuccess.kind==='roof'?'终于能把锅还给卷姨了！':'捞到了！今晚枕头有着落了！',195,190,'#ffe7a5',12);
  }
  function islandTravelProgress(ui,now){return ui.islandTravel?Math.max(0,Math.min(1,(now-ui.islandTravel.started)/4200)):1;}
  function islandChief(x,feet,h,cheeky){
    const im=assets.chief;
    if(im){const sw=im.width/2,k=h/im.height;ctx.drawImage(im,cheeky?sw:0,0,sw,im.height,x-sw*k/2,feet-h,sw*k,h);}
    else{ellipse(x,feet-h*.7,h*.18,h*.22,'#dca36b');rr(x-h*.2,feet-h*.5,h*.4,h*.45,6,'#263c51');}
  }
  function islandVisitScene(Core,state,ui,t,now){
    const q=state.island,n=q.choices.length,travel=ui.islandTravel,p=islandTravelProgress(ui,now),smooth=p*p*(3-2*p),arriving=travel&&travel.kind==='arrive',departing=travel&&travel.kind==='depart';
    const docked=q.docked&&!travel;
    const moving=!!travel,bob=ui.reducedMotion?0:Math.sin(t*2)*2;
    text('这片海我包了',20,31,14,'#cce7df','600');text('基博岛 · 鲨鱼停靠站',20,62,24,'#fff1c5','800');
    if(!moving)button(286,21,86,33,'返回海楼',{kind:'islandHome'},'secondary');
    text(moving?(arriving?'海楼正在靠近，岛民来接你了':'缆绳松开，带着海风再次启航'):docked?'点建筑或岛民玩一玩 · 不耗材料':'灯塔发现的小岛，想去就去',20,94,12,'#d1ece5');
    ctx.save();ctx.beginPath();ctx.rect(0,110,390,520);ctx.clip();
    // A single shoreline, village and jetty move together as the floating home approaches.
    ctx.save();ctx.translate(arriving?(1-smooth)*150:0,arriving?(1-smooth)*-30:0);
    ellipse(303,331,226,216,'#fff4c05a');ellipse(302,323,214,208,'#e7c991','#956f4e');
    ellipse(310,295,194,180,'#8f9e62');ellipse(300,335,170,147,'#b0ad72');
    line([[251,172],[242,252],[297,342],[232,434],[207,488]],'#dcc18c',38);
    for(let j=0;j<14;j++){const x=143+(j*47)%238,y=147+(j*71)%345;ellipse(x,y,4+(j%3)*2,2,'#86966a');}
    // Timber public buildings reuse the game's existing hand-painted room assets.
    roomSprite(4,193,115,174,142);
    skyRoomSprite(Core.SKY_ROOMS.find(r=>r.id==='bath'),156,246,183,137,t,n>=2);
    skyRoomSprite(Core.SKY_ROOMS.find(r=>r.id==='diner'),254,361,130,107,t,ui.islandSpot==='drinks');
    for(const [rx,ry,rw] of [[197,145,168],[162,287,173],[258,407,120]]){
      poly([[rx-5,ry+10],[rx+rw*.22,ry-12],[rx+rw*.8,ry-12],[rx+rw+5,ry+10]],'#6b7e6d','#d3b17b');
      for(let j=0;j<9;j++)line([[rx+rw*.22+j*rw*.065,ry-10],[rx+j*rw/8,ry+9]],j%2?'#a88b65':'#779589',3);
      line([[rx-5,ry+12],[rx+rw+5,ry+12]],'#d6ae6e',4);
    }
    // Pier piles, deck planks and rope rails connect the land to the shark's gangway.
    for(let y=465;y<625;y+=36){for(const x of [168,232]){rr(x-4,y,8,34,2,'#634c38');ellipse(x,y,5,3,'#dec597');}}
    rr(161,451,78,159,3,'#a47a50','#e3be80');
    for(let y=456;y<610;y+=12)line([[164,y],[236,y]],'#634c38',2);
    line([[168,465],[168,526],[168,596]],'#d8be88',2);line([[232,465],[232,526],[232,596]],'#d8be88',2);
    for(const y of [465,526,596])for(const x of [168,232]){rr(x-3,y-13,6,26,2,'#70543c');ellipse(x,y-13,5,3,'#e1b77c');}
    // A bent palm and warm quay lantern keep the island recognizable from a distance.
    line([[365,294],[354,251],[360,206]],'#886843',10);
    for(const dx of [-47,-28,28,45])poly([[360,205],[360+dx,195],[360+dx*1.2,225],[361,212]],'#427b65','#a1bc7c');
    rr(151,459,6,42,2,'#674e37');rr(143,449,22,25,5,'#eac772','#7a5a38');ellipse(154,460,6,9,'#fff0a2');
    const acting=ui.islandEffect&&ui.islandEffect.until>now?ui.islandEffect.spot:null;
    crewSprite('crewBoss',142,377+(acting==='resident'?bob*3:0),77,acting==='resident',t);
    crewSprite('crewTank',345,365+(n>=2?bob:0),69,n>=2,t);
    crewSprite('crewWire',341,480,72,acting==='drinks',t);
    islandChief(224,283,91,!!ui.chiefCheeky);
    // The pipe crab is a tiny scene toy; it scuttles when tapped and becomes a neighbor after repair.
    const cx=269+(acting==='crab'?Math.sin(t*12)*18:0),cy=511;
    for(const side of [-1,1])for(let j=0;j<3;j++)line([[cx+side*7,cy+j*2],[cx+side*(16+j*2),cy-4+j*6]],'#a95036',2);
    ellipse(cx,cy,11,7,'#e6874e','#995437');for(const side of [-1,1]){line([[cx+side*5,cy-4],[cx+side*6,cy-12]],'#ab663b',2);ellipse(cx+side*6,cy-12,3,3,'#fff3ce');ellipse(cx+side*6,cy-12,1,2,'#243c40');}
    if(n>=2){for(let j=0;j<4;j++)ellipse(205+j*18,267-Math.sin(t+j)*6,6,10,'#fff3dd77');}
    if(n===3){rr(275,184,77,24,2,'#9c3932');text('谢谢海楼！',313,197,12,'#ffe5a5','700','center');}
    function spot(x,y,w,h,id,label){
      if(docked&&id===['chief','bath','drinks'][n])rr(x-3,y-3,w+6,30,10,'#ffd07466','#ffd574');
      rr(x,y,w,24,7,ui.islandSpot===id?'#ffc85e':'#fff1d9ee','#987448');text(label,x+w/2,y+12,11,C.ink,'700','center');
      if(docked)hit(x,y,w,h,{kind:'islandSpot',spot:id},label);
    }
    spot(191,118,164,164,'chief','岛务所 · 找岛主');
    spot(163,272,161,113,'bath',n>=2?'热水澡堂 · 热气腾腾':'公共澡堂 · 咔哒咔哒');
    spot(256,388,122,98,'drinks','怪饮摊 · 嘬一口');
    // Resident and crab hit areas are separate from the building zones.
    spot(55,278,102,28,'resident','大婶 · 挥澡盆');
    if(docked)hit(112,306,46,75,{kind:'islandSpot',spot:'resident'},'岛民大婶');
    spot(249,535,117,28,'crab','螃蟹 · 横着走');
    if(docked)hit(246,490,52,41,{kind:'islandSpot',spot:'crab'},'点点螃蟹');
    ctx.restore();
    // Render the player's actual multi-storey house and shark as one moving object.
    const boatScale=arriving?.5+.3*smooth:departing?.8-.3*smooth:q.docked?.8:.5;
    const boatX=arriving?-45-3*smooth:departing?-48-180*smooth:-48;
    const boatY=628-550*boatScale+bob;
    if(moving){for(let j=0;j<4;j++)ellipse(boatX+105-j*22,607+j*3,23+j*4,3,'#e3fcf388');}
    const beforeBoat=hits.length;ctx.save();ctx.translate(boatX,boatY);ctx.scale(boatScale,boatScale);
    towerScene(Core,state,Object.assign({},ui,{photo:true,towerOverview:true,roomEffect:null}),t,now);
    ctx.restore();hits.splice(beforeBoat);
    if(docked||arriving&&p>.88||departing&&p<.12){
      poly([[118,575],[168,552],[179,564],[129,590]],'#b18d58','#e5c08a');
      for(let j=0;j<5;j++)line([[121+j*9,576-j*4],[131+j*9,588-j*4]],'#6a5339',2);
      line([[127,595],[142,609],[168,592]],'#e3c38c',2);
      if(acting==='drinks')text('？！',338,394,24,'#fff3bc','800','center');
      if(acting==='resident')text(n>=2?'这才叫办事！':'先修澡堂！',130,310,12,'#fff4ce','700','center');
    }
    ctx.restore();
    // A small action tray keeps the island visible; no scene-blocking conversation modal.
    rr(12,632,366,200,18,'#fff5df','#ccac78');
    if(moving){
      const message=arriving?(p<.45?'看见岛屿了':p<.83?'减速，靠近木码头':'搭好跳板，欢迎上岛'):(p<.4?'收跳板，解开缆绳':'鲨鱼海楼离开码头');
      text(message,195,671,21,C.ink,'800','center');text(arriving?'岛主已经在岛务所前等你':'下次经过，还能来串门',195,708,13,C.teal,'400','center');
      rr(40,739,310,8,4,'#d6dfc8');rr(40,739,Math.max(8,310*p),8,4,'#c9974f');button(100,774,190,35,'跳过航行动画',{kind:'islandSkip'},'secondary');return;
    }
    if(!docked){
      text('基博岛航线',31,658,18,C.ink,'800');
      wrap(!state.home.rooms.includes('lookout')?'先建好屋顶灯塔，再让鲨鱼海楼带大家出发。':Core.islandReady(state,now)?'岛民们在码头招手。靠岸后，直接点建筑和人物就能玩。':'正在海上航行，约 '+Math.ceil(Math.max(0,q.nextAt-now)/60000)+' 分钟后可再次经过。',31,690,325,14,C.ink,23);
      if(Core.islandReady(state,now))button(31,764,328,44,'让鲨鱼海楼靠岸',{kind:'islandDock'},'primary');return;
    }
    const next=['chief','bath','drinks'][n],selected=ui.islandSpot,step=Core.ISLAND_STEPS[Math.min(n,2)];
    const hints={chief:n===0?'岛主扶正领带：“先把岛民的事办好。”转头挤眼：“来都来了，不得泡一泡？”':'岛主端着茶杯：“有事找我，没事也来泡……茶。”',bath:n===1?'水管里有只螃蟹！岛主卷起袖子：“管子通不通，得慢慢摸清楚。”':n>=2?'热水冒出来了！大婶舒舒服服地叹气：“这岛主嘴怪，办事倒实在。”':'大婶敲着澡盆：“岛主还在码头等你，先叫他过来！”',drinks:n===2?'岛主把第一杯热水让给老人，再端出海盐怪饮：“别光看颜色，先嘬一口。”':'摊主晃晃杯子，泡沫顶起了眉毛：“今天的配方，我也刚知道。”',resident:n>=2?'大婶举起澡盆当奖杯：“咱岛主话不着调，心可一直装着大家。”':'大婶挥着澡盆指路：“先找岛主，再修澡堂，最后请你喝点怪的！”',crab:n>=2?'螃蟹从安置茶壶里出来，横着巡查码头。岛主：“走得很有自己的想法。”':'螃蟹横着挪了三步：“借你管子泡个澡，怎么全岛都知道了？”'};
    text(ui.islandLine?'岛上又多了一件笑话':n===3?'基博岛 · 老朋友，随便逛逛':selected===next?step.title: '岛上小事 '+(n+1)+'/3 · '+['找岛主','点澡堂','逛怪饮摊'][n],31,656,17,C.ink,'800');
    wrap(ui.islandLine||hints[selected]||(n===3?'感谢旗已挂上海楼。点岛主、岛民、澡堂或螃蟹，看看今天的怪事。':'直接点岛上的发光招牌。随时可以回海楼，岛上的进度会保留。'),31,683,328,13,C.ink,20);
    if(ui.islandLine)button(31,745,328,34,'收起小事 · 继续逛岛',{kind:'islandNext'},'secondary');
    else if(n<3&&selected===next)step.choices.forEach((label,i)=>button(31+i*168,745,160,34,label,{kind:'islandChoice',choice:i},'primary'));
    else if(n===3&&selected==='chief')[0,1,2].forEach(i=>button(31+i*111,745,105,34,'回忆 '+(i+1),{kind:'islandReplay',step:i},'secondary'));
    else text(n<3?'下一站：'+['岛务所 · 找岛主','公共澡堂 · 咔哒咔哒','怪饮摊 · 嘬一口'][n]:'岛民会记得你帮忙的这一天',195,759,12,C.teal,'600','center');
    button(31,790,328,30,'告别岛主 · 继续航行',{kind:'islandLeave'},'secondary');
  }
  function talesModal(Core,state,ui,now){
    const type=ui.modal;
    if(type==='tales'){
      text('海上怪事营业中',35,229,23,C.ink,'800');
      button(35,245,320,30,'岛屿航线 · 基博岛',{kind:'island'},'secondary');
      Core.EPISODES.forEach((e,i)=>{const y=286+i*87,n=state.tales.choices[i].length,ready=Core.episodeReady(state,i);
        rr(30,y,330,78,12,ready?'#e3eddf':'#ece6d9');text(e.name,43,y+23,16,C.ink,'700');
        text(n===3?'已完成 · 重看故事':ready?e.steps[n][0]+' · '+n+'/3':e.hint,43,y+53,11,C.mute);
        hit(30,y,330,78,{kind:'episodeOpen',index:i},e.name);
      });
      const i=Core.nextAntic(state);button(35,564,320,40,'随手一玩 · '+Core.ANTICS[i][0],{kind:'anticOpen',index:i},'primary');
      text('趣事收藏 '+state.tales.seen.length+'/8 · 点击名字重看',35,632,12,C.teal);
      state.tales.seen.forEach((a,j)=>button(35+(j%2)*164,650+Math.floor(j/2)*30,156,25,Core.ANTICS[a][0],{kind:'anticOpen',index:a},'secondary'));
      return;
    }
    const isStory=type==='episode',e=isStory?Core.EPISODES[ui.episode]:null,n=isStory?state.tales.choices[ui.episode].length:0;
    const a=!isStory?Core.ANTICS[ui.antic]:null,step=isStory?e.steps[Math.min(n,2)]:null;
    text(isStory?e.name:a[0],35,228,20,C.ink,'800');
    text(isStory?'章节 '+(ui.taleReplay!==null&&ui.taleReplay!==undefined?ui.taleReplay+1:ui.taleResult?n:Math.min(n+1,3))+'/3 · 选择没有失败惩罚':'场景趣事 · 一个动作就好',35,258,12,C.teal);
    rr(35,282,320,232,15,'#e0eee7');
    const t=ui.reducedMotion?0:now/1000,animated=!!ui.taleResult,who=isStory?e.who:a[1];
    const bob=animated&&!ui.reducedMotion?Math.sin(t*7)*5:0;
    if(isStory&&ui.episode===0||!isStory&&ui.antic===0){machine('puffer',254,467,.65,t);crewSprite(who,112,488+bob,132,animated,t);}
    else if(isStory&&ui.episode===1||!isStory&&ui.antic===2){octopus(248,478,.9,t,true);crewSprite(who,111,489+bob,135,animated,t);}
    else {crewSprite(who,140,489+bob,154,animated,t);crewSprite(who==='crewBoss'?'crewWire':'crewBoss',260,489-bob,125,animated,t);}
    taleProps(isStory?ui.episode:-1,isStory?-1:ui.antic,t,animated);
    if(animated){for(let j=0;j<7;j++){const x=65+j*42,y=316+(ui.reducedMotion?j%3*9:Math.sin(t*2+j)*16);ellipse(x,y,4+j%3,4+j%3,'#f4ce79');}text(isStory?['今日怪饮，认真乱调！','今日打捞，意外满载！','开饭！给你留了位置。'][ui.episode]:['噗，重新变圆！','嗝！灯也跟着笑。','队长，帽子反了！','喂？海里信号很好。','电脑没事，咖啡再泡。','叮——开饭啦！','菜单想先去旅行。','给盆栽也留一份。'][ui.antic],195,310,13,C.teal,'700','center');}
    const ready=!isStory||Core.episodeReady(state,ui.episode);
    wrap(ui.taleResult||(isStory?(n===3?'故事已完成，纪念物已收藏。可以重演每一段，也可以去家园看看。':step[1]):a[3]),35,544,312,15,C.ink,25);
    if(isStory&&!ready){text(e.hint,35,666,13,C.teal);button(35,744,320,42,'回到家园继续经营',{kind:'tab',value:'home'},'primary');}
    else if(isStory&&(n===3||ui.taleReplay!==null&&ui.taleReplay!==undefined)){
      [0,1,2].filter(i=>i<n).forEach((i)=>button(35+i*108,666,102,34,'重看第'+(i+1)+'段',{kind:'episodeReplay',step:i},'secondary'));
      button(35,744,320,42,'查看纪念装饰',{kind:'decor'},'primary');
    }else if(ui.taleResult){button(35,744,320,42,isStory?'下一段小事':'回到怪事手记',{kind:isStory?'episodeNext':'tales'},'primary');}
    else if(isStory){step[2].forEach((label,i)=>button(35,665+i*63,320,45,label,{kind:'episodeChoose',choice:i},'primary'));}
    else button(35,734,320,45,a[4],{kind:'anticDo'},'primary');
  }
  function taleProps(chapter,antic,t,acted){
    const pulse=frameUi.reducedMotion?0:Math.sin(t*3)*4;
    // Small illustrated props make each vignette recognizable without another asset atlas.
    if(chapter===0||antic===0||antic===4){
      rr(170,425,42,48,8,'#e9bc76');line([[212,435],[225,435],[225,457],[212,457]],'#d59d54',5);
      ellipse(191,425,24,8,'#fff9e5');
      for(let j=0;j<(acted?7:3);j++)ellipse(179+j%3*12,417-Math.floor(j/3)*13+pulse,8,8,'#fff9e5');
      text(antic===4?'先存档！':'今日特饮',191,492,12,C.teal,'700','center');
    } else if(chapter===1||antic===2){
      decorSprite('oddHat',244,389+pulse,55,t,acted);decorSprite('lostSign',186,478,42,t,false);
    } else if(chapter===2||antic===5){
      ellipse(199,474,56,12,'#b78351');ellipse(199,464,37,9,'#f9e2b3');
      for(let j=0;j<4;j++)ellipse(179+j*13,460,7,5,j%2?'#7daa6e':'#df9a62');
      decorSprite('dinnerBell',207,363+pulse,45,t,acted);if(acted)text('♪',242,355,22,C.gold);
    } else if(antic===1){decorSprite('lamp',200,390+pulse,65,t,acted);if(acted)text('嗝！',223,359,19,C.teal);}
    else if(antic===3){ellipse(205,389+pulse,29,13,'#81b6b3');poly([[228,389+pulse],[243,376+pulse],[243,401+pulse]],'#e4b56d');ellipse(188,385+pulse,3,3,C.ink);text(acted?'喂——':'铃铃铃',202,350,16,C.teal,'700','center');}
    else if(antic===6){ctx.save();ctx.translate(203,375+pulse);ctx.rotate(acted?-.2:.08);rr(-25,-31,50,65,4,'#fff5d8');text('怪饮菜单',0,-13,10,C.ink,'700','center');for(let j=0;j<3;j++)line([[-15,j*10],[15,j*10]],'#bc9a67',2);ctx.restore();}
    else if(antic===7){decorSprite('tableFlower',202,413+pulse,72,t,acted);if(acted)text('我也有份？',204,354,14,C.teal,'700','center');}
  }
  function decorSprite(id,x,y,size,t,active){
    ctx.save();ctx.translate(x,y);ctx.scale(size/40,size/40);
    if(active&&!frameUi.reducedMotion)ctx.rotate(Math.sin(t*8)*.08);
    if(['coffeeSign','foamCup','oddHat','lostSign','dinnerBell','tableFlower'].includes(id)){
      if(id==='foamCup'){rr(-13,-23,26,25,4,'#f1d395');ellipse(0,-25,18,7,'#fff9e7');line([[13,-19],[21,-19],[21,-5],[13,-5]],'#f1d395',3);}
      else if(id==='oddHat'){ellipse(0,-7,25,5,'#5d9fad');rr(-15,-28,30,23,5,'#77c0bc');text('★',0,-15,14,'#ffe2a5','700','center');}
      else if(id==='dinnerBell'){ellipse(0,-13,18,17,'#efc66d');rr(-21,-7,42,6,3,'#b47c3e');ellipse(0,1,4,4,'#efd68f');}
      else if(id==='tableFlower'){rr(-10,-15,20,18,4,'#86b7bb');line([[0,-13],[0,-33]],'#679b65',3);for(let j=0;j<5;j++)ellipse(Math.cos(j*1.26)*8,-34+Math.sin(j*1.26)*8,5,5,'#f2c595');ellipse(0,-34,4,4,'#ffe9a4');}
      else{rr(-27,-29,54,26,3,'#b98b5f');text(id==='coffeeSign'?'今日怪饮':'木头与笑话',0,-16,10,'#fff4cc','700','center');line([[0,-3],[0,5]],'#9b744d',3);}
      ctx.restore();return;
    }
    const decorIndex=['flag','chime','plant','mushroom','cushion','radio','lamp','bunting','desk','telescope','tasting','sign'].indexOf(id);
    if(assets.decor&&decorIndex>=0){const im=assets.decor,rects=[[60,45,310,315],[430,45,230,320],[750,45,300,310],[1120,80,270,280],[50,460,300,210],[420,405,275,280],[785,400,220,285],[1080,445,330,240],[50,720,330,315],[430,720,280,310],[755,775,320,250],[1125,730,275,300]],r=rects[decorIndex],dw=52*r[2]/Math.max(r[2],r[3]),dh=52*r[3]/Math.max(r[2],r[3]);ctx.drawImage(im,r[0]*im.width/1422,r[1]*im.height/1067,r[2]*im.width/1422,r[3]*im.height/1067,-dw/2,7-dh,dw,dh);if(active){ellipse(0,-19,28,25,'#fff4b51a');if(id==='radio'||id==='chime')text('♪',24,-36,15,'#ffe7a4');}ctx.restore();return;}
    const color=['#64afaa','#dca56d','#9e91bd'][frameUi.palette||0];
    if(id==='flag'||id==='bunting'){line([[-16,0],[-16,-35],[17,-35]],'#99754f',2);for(let i=0;i<(id==='flag'?1:3);i++)poly([[-14+i*10,-34],[-5+i*10,-32+Math.sin(t)*2],[-14+i*10,-20]],i%2?'#efb96c':color);}
    else if(id==='plant'||id==='mushroom'){rr(-10,-10,20,13,3,'#bc8658');line([[0,-9],[0,-27]],'#79a57a',3);if(id==='plant'){ellipse(-7,-21,8,4,'#93bd7d');ellipse(6,-29,8,5,'#6caa8c');}else{ellipse(0,-27,15,8,'#ccb2e0');ellipse(-5,-29,3,2,'#fff1cf');}}
    else if(id==='chime'){line([[0,-38],[0,-27]],'#d7c08f',2);ellipse(0,-26,13,4,'#a7c9c6');for(let i=0;i<3;i++){line([[-8+i*8,-26],[-8+i*8,-9+i%2*5]],'#e5cdb0',1);ellipse(-8+i*8,-8+i%2*5,3,5,'#ead7a9');}}
    else if(id==='lamp'){line([[0,-39],[0,-24]],'#655543',2);ellipse(0,-18,14,13,active?'#ffe8a0':'#edc471');rr(-12,-25,24,5,2,'#956b43');if(active)ellipse(0,-18,22,20,'#ffe29533');}
    else if(id==='radio'){rr(-18,-25,36,26,4,color,'#183e4b');ellipse(-7,-12,8,8,'#243f4a');for(let j=0;j<3;j++)line([[5,-19+j*5],[14,-19+j*5]],'#f4d6a3',1);line([[12,-25],[19,-39]],'#dbc391',2);if(active)text('♪',23,-28,18,'#ffe6a0');}
    else if(id==='cushion'){ellipse(0,-5,21,8,color);ellipse(0,-10,16,6,'#b4c4ba');ellipse(0,-16,4,3,'#6a7f78');}
    else if(id==='desk'){rr(-22,-18,44,5,1,'#caa56d');line([[-19,-15],[-19,0]],'#98794e',3);line([[19,-15],[19,0]],'#98794e',3);rr(-16,-37,25,19,2,active?'#9bd2cc':'#425e68');line([[-16,-18],[12,-18]],'#c6d1c6',3);rr(13,-28,8,10,2,'#669f9a');}
    else if(id==='tasting'){rr(-23,-5,46,5,1,'#b99566');line([[-20,-5],[-20,-35],[20,-35],[20,-5]],'#b99566',2);for(let i=0;i<3;i++)rr(-15+i*12,-25,9,20,3,['#a995cb','#dbaa62','#86bba7'][i]);}
    else if(id==='telescope'){line([[0,-12],[-15,0]],'#bba275',2);line([[0,-12],[15,0]],'#bba275',2);ctx.rotate(-.4);rr(-20,-24,38,13,3,'#d5b57b');rr(14,-26,7,17,2,'#709d9f');}
    else{rr(-24,-29,48,24,3,'#bd9463');line([[0,-5],[0,4]],'#977249',3);text('怪人合租',0,-17,9,'#263f46','700','center');}
    ctx.restore();
  }
  function sceneDecor(Core,state,ui,t){
    ui.palette=state.life.palette;const early=!state.home.rooms.includes('kitchen')&&state.camp.stage<2;const pos=early?[[294,330],[274,474],[120,474],[270,392],[205,475],[275,428]]:[[93,399],[310,473],[120,474],[285,329],[210,475],[303,418]];
    state.life.slots.forEach((id,i)=>{if(!id)return;const [x,y]=pos[i],active=ui.decorEffect&&ui.decorEffect.id===id&&ui.decorEffect.until>frameNow;decorSprite(id,x,y,25,t,active);hit(x-17,y-30,34,34,{kind:'decorTap',id},'触摸'+Core.DECOR.find(d=>d.id===id).name);});
  }
  function lifeModal(Core,state,ui,now){
    const type=ui.modal;
    if(type==='author'){
      text('阿昊靠岸了',35,260,25,C.ink,'800');text('作者 · 背着咖啡馆去旅行',35,296,13,C.teal);
      uiAuthorPose(0);crewSprite('crewAuthor',195,548,238,false,0);
      wrap('“有个干燥的角落就行。我带了电脑、咖啡，还有沿途收集的奇怪菜单。”',35,578,310,15,C.ink,25);
      text('入住条件：补好屋顶 · 淡水 2 ＋ 鱼 1',35,661,12,C.mute);
      button(35,692,320,34,'去修屋顶',{kind:'rooms'},'secondary');
      button(35,746,320,44,'欢迎阿昊入住',{kind:'authorJoin'},'primary',state.home.rooms.includes('roof')&&Core.afford(state,{water:2,fish:1}));
    }else if(type==='story'){
      const who=ui.storyWho||'crewTank',index=state.life.stories[who],r=Core.story(state,who),joined=Core.residents(state).includes(who),result=ui.storyResult;
      text(CREW[who].name+'的生活手记',35,258,23,C.ink,'800');text('已收藏 '+index+'/3 段 · 故事不会过期',35,293,12,C.teal);
      uiAuthorPose(result?2:1);crewSprite(who,195,469,164,!!result,ui.reducedMotion?0:now/1000);
      text(result?'这一刻，留在家里了':r?r[0]:'三段故事都记下了',35,503,19,C.ink,'700');
      wrap(result?result.line:r?r[1]:Core.STORIES[who][2][5],35,541,310,15,C.ink,27);
      const hint=!joined?'先邀请这位居民入住':r&&!Core.storyReady(state,who)?'需要：'+Core.storyHint(r[2]):r?'准备：'+(Core.costText(r[3])||'一起聊聊天，无需物资'):'装饰可以在收藏页免费更换';
      if(!result)wrap(hint,35,643,310,12,C.mute,22);
      if(result){button(35,682,153,34,'回到新故事',{kind:'story',who},'secondary');button(201,682,154,34,'回顾下一段',{kind:'storyRecall',who,index:((ui.recallIndex||0)+1)%Math.max(1,index)},'secondary');}
      else if(index>0)button(35,682,320,34,'回顾已收藏故事',{kind:'storyRecall',who,index:0},'secondary');
      button(35,746,320,44,result||!r?'装饰收藏':!joined&&who==='crewAuthor'?'邀请阿昊':'一起完成这件小事',result||!r?{kind:'decor'}:!joined&&who==='crewAuthor'?{kind:'author'}:{kind:'storyDo',who,index},'primary',!!result||!r||Core.storyReady(state,who)&&Core.afford(state,r[3]));
    }else if(type==='decor'){
      text('把家布置成你的样子',35,258,22,C.ink,'800');text('6 个固定位置 · 已拥有 '+state.life.owned.length+'/'+Core.DECOR.length+' 件',35,291,12,C.teal);
      ['海风青','日落橙','暮色紫'].forEach((name,i)=>button(35+i*108,318,102,30,name,{kind:'action',action:{type:'palette',value:i}},state.life.palette===i?'primary':'secondary'));
      Core.DECOR.slice((ui.decorPage||0)*6,(ui.decorPage||0)*6+6).forEach((d,i)=>{
        const y=365+Math.floor(i/2)*109,x=35+i%2*164,owned=state.life.owned.includes(d.id),equipped=state.life.slots[d.slot]===d.id;
        rr(x,y,156,99,11,owned?'#e2ebdc':'#e7e4d6');decorSprite(d.id,x+30,y+54,35,now/1000,false);
        text(d.name,x+8,y+76,11,C.ink,'700');text(equipped?'已摆放':owned?'点击摆放':'故事解锁',x+63,y+35,11,owned?C.teal:C.mute);
        if(owned)hit(x,y,156,99,{kind:'action',action:{type:'decorate',id:d.id}},(equipped?'收起':'摆放')+d.name);
        else if(d.id&&Core.SOUVENIRS.some(x=>x[0]===d.id)){hit(x,y,156,99,{kind:'tales'},'解锁'+d.name);}
        else {const who=Object.keys(Core.STORIES).find(w=>Core.STORIES[w].some(r=>r[4]===d.id));hit(x,y,156,99,{kind:'story',who},'解锁'+d.name);}
      });
      text('点家里的装饰，有小回应；同一位置可免费替换。',195,711,11,C.mute,'400','center');
      ['第一页','第二页','怪事纪念'].forEach((label,i)=>button(35+i*108,746,102,42,label,{kind:'decorPage',value:i},(ui.decorPage||0)===i?'primary':'secondary'));
    }else if(type==='visitor'){
      text('旧物商人 · 老漂',35,258,24,C.ink,'800');boat(195,395,now/1000);icon('crate',163,392,35);icon('crate',211,389,29);
      wrap('“别看它旧，换个地方就是宝贝。” 老漂随时等你有空，不限时、不催单。',35,468,310,15,C.ink,27);
      const odd=state.life.visitor%2; text('拿出：'+(odd?'鱼类 2':'淡水 4'),35,595,17,C.ink,'700');text('换回：'+(odd?'金属 3':'木材 6'),35,633,17,C.teal,'700');
      text('两种补给轮流交换 · 不占普通商船订单',35,693,12,C.mute);
      button(35,746,320,44,'和老漂交换',{kind:'action',action:{type:'visitor',index:state.life.visitor}},'primary');
    }else if(type==='interact'){
      const kind=ui.interact,b=Core.getBuilding(state,ui.interactId),names={roof:'帮阿桶补屋顶',wood:'章鱼伸手，木头到手',eel:'电鳗的加餐时间',puffer:'给河豚鼓一口气'};
      text(names[kind],35,258,22,C.ink,'800');text(kind==='puffer'?'按住河豚 1.2 秒，松开后开始加工':'把左边材料拖到右边虚线圈',35,296,13,C.teal);
      rr(29,325,332,300,16,'#d9e8dd');
      const g=ui.gesture,t=ui.reducedMotion?0:now/1000;
      if(kind==='puffer'){
        const strength=g?Math.min(1,(now-g.started)/1200):0;
        machine('puffer',195,570,1.5+strength*.25,t,false,b?b.level:1);
        rr(80,588,230,9,4,'#b8cebe');if(strength)rr(80,588,230*strength,9,4,'#e6b65e');
        hit(75,335,240,290,{kind:'gestureStart'},'按住河豚');
      }else{
        ctx.save();ctx.setLineDash([5,6]);ellipse(260,440,65,65,null,'#609f9f');ctx.restore();
        if(kind==='eel')machine('eel',260,487,1.1,t,true);
        else if(kind==='wood')octopus(260,488,1.1,t,true);
        else{roomSprite(0,200,369,120,110);crewSprite('crewTank',281,553,80,true,t);}
        icon(kind==='eel'?'fish':'wood',g?g.x:93,g?g.y:457,58);
        if(!g)hit(48,403,90,105,{kind:'gestureStart'},'拖动材料');
        text('→',166,464,26,C.teal,'700','center');
      }
      const cost=kind==='roof'?'木材 8 ＋ 金属 2 · 施工 8 秒':kind==='wood'?'消耗 1 份漂流物 · 与普通打捞收益相同':kind==='eel'?'鱼类 2 · 发电时间增加 3 分钟':'淡水 2 · 仍按正常加工时间产出氧气';
      wrap(cost,35,657,310,13,C.mute,23);
      text('拖出目标或提前松手不扣物资，也可点击完成。',195,713,11,C.mute,'400','center');
      button(35,746,320,44,kind==='roof'?'点击完成修补':kind==='wood'?'点击打捞':kind==='eel'?'点击投喂':'点击投料',{kind:'interactDo'},'primary');
    }
  }
  function photoScene(Core,state,ui,t,now){
    text('这片海我包了',195,64,23,'#fff0c9','800','center');text(state.life.author?'阿昊和他的怪人邻居们':'海风、旧木头，还有一起生活的人',195,99,12,'#c6e8e0','500','center');
    largeHarbor(Core,state,ui,t,now);hits=[];
    text(['认真营业的一天','来，大家看镜头！','今日菜单有点怪','咖啡热，海风刚好'][ui.photoPose],195,695,18,'#fff1cd','700','center');
    text('T I D E H A V E N  ·  1 . 2',195,726,10,'#b7d7d2','500','center');
    if(!ui.photoClean){button(18,778,104,42,'退出拍照',{kind:'photoExit'},'secondary');button(143,778,104,42,'换个姿势',{kind:'photoPose'},'secondary');button(268,778,104,42,'保存照片',{kind:'photoSave'},'primary');}
  }
  function draw(context, Core, state, ui, t, now) {
    ctx = context; hits = []; frameUi = ui; frameNow = now; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 390, 844); ctx.clip();
    drawSea(t);
    if(ui.photo){photoScene(Core,state,ui,t,now);ctx.restore();return hits;}
    if(ui.islandScene){
      islandVisitScene(Core,state,ui,t,now);
      if(ui.modal)modal(Core,state,ui,now);
      ctx.restore();return hits;
    }
    header(Core, state, ui, now);
    if (ui.tab === 'home') { if(ui.layoutMode || ui.moveId) island(Core,state,ui,t,now); else largeHarbor(Core,state,ui,t,now); homePanel(Core, state, ui, now); }
    else if (ui.tab === 'residents') residents(Core,state,ui,now);
    else if (ui.tab === 'workshop') workshop(Core,state,ui,now);
    else if (ui.tab === 'orders') ordersPanel(Core, state);
    else journalPanel(Core, state, now);
    navigation(ui);
    if (ui.modal) modal(Core, state, ui, now);
    if (ui.toast && ui.toastUntil > now) {
      const s = ui.toast; ctx.font = '500 12px -apple-system, "PingFang SC", sans-serif'; const w = Math.min(358, ctx.measureText(s).width + 32);
      const toastY = ui.modal ? 177 : ui.tab === 'residents' ? 132 : 177;
      rr((390 - w) / 2, toastY, w, 43, 13, '#153e48ed'); wrap(s, (390 - w) / 2 + 16, toastY + 21, w - 30, 12, '#fff5df', 16);
    }
    ctx.restore(); return hits;
  }
  return { draw, setAssets, towerCamera };
});
