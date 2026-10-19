(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TideCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const CAP = 500;
  const OFFLINE_MAX = 4 * 60 * 60 * 1000;
  const RESOURCE_NAMES = { wood: '木材', metal: '废金属', water: '淡水', fish: '鱼类', coins: '金币', oxygen: '氧气瓶', resin: '海工树脂', mortar: '防水建材' };
  const DEFINITIONS = {
    filter: { name: '海水过滤器', short: '过滤器', color: '#82d7db', cost: { wood: 10, metal: 2 }, output: 'water', seconds: 12, amount: 2, capacity: 6, power: 1, description: '手动过滤也能产水。接通电力后，生产速度翻倍。' },
    fishery: { name: '基础渔场', short: '渔场', color: '#ecb86b', cost: { wood: 12, metal: 3 }, output: 'fish', seconds: 18, amount: 1, capacity: 4, power: 1, description: '渔网随潮汐捕捞。无需饲料；通电后收网更快。' },
    puffer: { name: '河豚增氧机', short: '增氧机', color: '#eac05c', cost: { wood: 18, metal: 8, coins: 30 }, output: 'oxygen', seconds: 20, amount: 3, capacity: 9, power: 1, unlock: 1, recipe: { water: 2 }, description: '每批淡水 2 → 氧气瓶 3。手动投料，20 秒完成；通电加速。' },
    manatee: { name: '海牛化工厂', short: '化工厂', color: '#91b6ad', cost: { wood: 28, metal: 12, coins: 55 }, output: 'resin', seconds: 30, amount: 1, capacity: 4, power: 1, unlock: 2, recipe: { oxygen: 2, water: 3 }, description: '每批氧气瓶 2 ＋ 淡水 3 → 树脂 1。手动投料，30 秒完成；通电加速。' },
    mixer: { name: '鲨鱼搅拌机', short: '搅拌机', color: '#84b7cd', cost: { wood: 24, metal: 14, coins: 45 }, output: 'mortar', seconds: 24, amount: 2, capacity: 6, power: 1, unlock: 2, recipe: { resin: 1, metal: 2 }, description: '每批树脂 1 ＋ 金属 2 → 防水建材 2。用于暖灯与瞭望台建设，24 秒一批。' },
    eel: { name: '电鳗发电机', short: '发电机', color: '#cbd87b', cost: { wood: 18, metal: 6, coins: 25 }, output: null, seconds: 0, amount: 0, capacity: 0, power: 0, description: '投喂 2 条鱼，发电 3 分钟。给设备供电，也点亮家园。' }
  };
  const OFFLINE_CAP = { wood:48, water:36, fish:18, oxygen:9, resin:4, mortar:6 };
  const DECOR = [
    {id:'flag',name:'海风小旗',slot:0,reply:'风比闹钟更准时。'},
    {id:'chime',name:'贝壳风铃',slot:0,reply:'叮——海风来签到了。'},
    {id:'plant',name:'漂流盆栽',slot:1,reply:'它的梦想是长成一座岛。'},
    {id:'mushroom',name:'发光蘑菇',slot:1,reply:'晚上不用找开关了。'},
    {id:'cushion',name:'锅盖坐垫',slot:2,reply:'阿桶：终于有个锅不用戴了！'},
    {id:'radio',name:'鱼骨收音机',slot:2,reply:'滋滋……今天也是适合摸鱼的一天。'},
    {id:'lamp',name:'暖光吊灯',slot:3,reply:'小屋的晚安模式已开启。'},
    {id:'bunting',name:'庆典彩灯',slot:3,reply:'今天没有节日，我们自己过一个。'},
    {id:'desk',name:'旅行咖啡工作台',slot:4,reply:'阿昊：先存档，再出发。'},
    {id:'telescope',name:'纸筒望远镜',slot:4,reply:'看见了！远处有人在吃饭。'},
    {id:'tasting',name:'奇味收藏架',slot:5,reply:'阿昊：这个味道，我得再确认一口。'},
    {id:'sign',name:'怪人合租招牌',slot:5,reply:'欢迎入住。正常人也可以申请。'}
  ];
  const EPISODES = [
    {id:'coffee',name:'阿昊的怪味咖啡馆',who:'crewAuthor',hint:'邀请阿昊，建好河豚增氧机',rewards:['coffeeSign','foamCup'],steps:[
      ['今天卖什么','阿昊把电脑摆上桌：菜单只写正常口味，怎么对得起这片海？',['海盐咖啡','海藻特饮'],['阿昊敲下菜单：海风味，盐量随缘。','阿昊认真备注：像喝了一口会光合作用的海。']],
      ['泡沫失控','河豚自告奋勇打奶泡。阿线已经拿出了最大的杯子。',['轻轻鼓一口','再来一点泡'],['泡沫刚好盖住杯口。河豚得意得又鼓了一点。','整杯只剩泡沫！卷姨端锅来接：这算一道汤吗？']],
      ['谁先试喝','新饮料做好了，阿昊打开电脑，准备记录试喝表情。',['请阿线先尝','阿昊自己尝'],['阿线把鱼递过去：它先接电话，我先缓缓。','阿昊喝完沉默三秒：有意思，再记一个问号。']]]},
    {id:'salvage',name:'章鱼捞错东西了',who:'crewTank',hint:'补好屋顶，建造章鱼打捞站',rewards:['oddHat','lostSign'],steps:[
      ['漂流的惊喜','章鱼举起两件东西，坚称它们都是非常特别的木头。',['看看左脚拖鞋','看看旧招牌'],['阿桶试了一下：正好！就是还缺另一只。','招牌上写着“今天休息”。章鱼立即点头。']],
      ['帽子去哪了','章鱼捞起了自己的帽子，还以为又发现了一件宝贝。',['帮它戴正','给它转个方向'],['帽子戴好了。它郑重向自己的倒影敬礼。','章鱼倒戴帽子，觉得自己已经是打捞队长。']],
      ['旧物有新家','阿桶想把这批战利品摆出来，证明今天绝没有摸鱼。',['挂在门口','摆在打捞站'],['门口多了一块旧招牌：木头慢慢捞，笑话天天有。','章鱼的纪念角开张。第一位顾客还是它自己。']]]},
    {id:'dinner',name:'卷姨的海上开饭日',who:'crewBoss',hint:'建好独立厨房，完成一次居民供餐',rewards:['dinnerBell','tableFlower'],steps:[
      ['饭还没好','卷姨刚拿出锅，阿桶已经抱着碗坐下了。',['先摆好餐具','请阿桶帮端菜'],['碗刚摆齐，阿桶就问：可以开始了吗？','阿桶端菜走得极慢：我在保护汤汁。']],
      ['神秘的饮料','阿线拿鱼当电话报菜名。桌上那瓶奇怪饮料正在冒泡。',['闻一闻再喝','先请卷姨鉴定'],['大家一起凑过去，齐齐打了个喷嚏。海风味的！','卷姨尝了一滴：可以，拿来给锅开胃。']],
      ['大家坐近一点','饭终于上桌。没有人愿意错过这张海上聚餐合影。',['举杯看镜头','先给卷姨夹菜'],['阿桶举起了整口锅。阿线：这张照片有点重。','卷姨笑着坐下：今天洗碗的人，也是你们。']]]}
  ];
  const ANTICS = [
    ['河豚方了','crewWire','puffer','河豚把自己鼓成了方形。','轻点一下','噗！它恢复圆形，还瞪了阿线一眼。'],
    ['灯泡打嗝','crewTank','eel','电鳗打嗝，灯泡跟着一闪一闪。','拍拍灯罩','阿桶扭了两下：不是舞会啊？'],
    ['帽子戴反了','crewTank','salvage','章鱼戴着反帽子，连自己都没认出来。','扶正帽子','它趁你转身，又偷偷戴反了。'],
    ['鱼电话响了','crewWire','always','阿线的鱼电话终于有信号了！','接听电话','噗！鱼喷了他一脸水。信号很湿。'],
    ['先救哪一个','crewAuthor','author','咖啡杯晃了一下，阿昊的电脑就在旁边。','扶住杯子','阿昊已经抱起电脑：咖啡我还能再泡。'],
    ['开饭预告','crewBoss','always','卷姨举起了锅，邻居们正在偷看。','敲一下锅','三个脑袋同时探出来：今天吃什么？'],
    ['海风翻菜单','crewAuthor','author','阿昊的新菜单被海风翻到了背面。','翻回菜单','背面写着：不好喝也要认真记录。'],
    ['盆栽也想吃','crewBoss','always','卷姨发现餐桌旁的盆栽朝锅歪了过去。','转一转盆栽','它朝太阳转过去。阿桶：原来不是想吃。']
  ];
  const SOUVENIRS=[['coffeeSign','今日怪饮招牌',5,'今日特饮：老板也在试喝。'],['foamCup','泡沫纪念杯',2,'杯子很轻，泡沫很有想法。'],['oddHat','章鱼队长帽',0,'队长允许大家倒着戴。'],['lostSign','漂流旧招牌',4,'木头慢慢捞，笑话天天有。'],['dinnerBell','开饭小铜铃',3,'一响就有人带碗出现。'],['tableFlower','聚餐小花瓶',1,'给一起吃饭的人留一个位置。']];
  for(const [id,name,slot,reply] of SOUVENIRS)DECOR.push({id,name,slot,reply});
  const ISLAND_STEPS = [
    {title:'欢迎词还没说完',line:'岛主扶正眼镜：“各位远道而来，先解决岛民洗热水澡的问题。”他忽然凑近：“来都来了……不得泡一泡？”',choices:['先听岛民说说','看看坏掉的管道'],replies:['大婶把发言稿卷成喇叭：“先修澡堂！”岛主立刻记下：“收到，讲话压缩到三句。”','管道里卡着一只偷泡澡的螃蟹。岛主眯眼：“藏得挺深啊，小东西。”']},
    {title:'正经维修，不正经解说',line:'岛主卷起西装袖子亲自帮忙：“热水必须送到每户。”又小声补一句：“管子通不通，得慢慢摸清楚。”',choices:['请螃蟹搬个家','敲管子把它哄出来'],replies:['你给螃蟹换了个茶壶。岛主认真挂牌：“临时安置房，不收房租。”','岛主带头敲出舞曲，螃蟹横着跳出来。他偷笑：“扭得比我还放得开。”']},
    {title:'全岛第一杯热水',line:'热水终于来了。岛民把第一杯递给岛主，他转手让给了老人。随后端出海盐怪饮：“别光看颜色，先嘬一口。”',choices:['尝一口海盐怪饮','给大家拍张纪念照'],replies:['咸得眉毛都立起来了！岛主挤眼：“够不够味？我亲手调的。”岛民笑着送你一面感谢旗。','快门一响，岛主正经站好；下一秒又对镜头挑眉。大家笑着把“正经办事”感谢旗送上你的海楼。']}
  ];
  const ISLAND_TOYS={
    post:{name:'贝壳邮局',lines:['你敲了敲贝壳，弹出一封信：“收件人：昨天的我。请少喝那杯怪饮。”','邮差海鸥把信送回你手里：“同岛快递，快得还没出门。”','新明信片写着：“今天风很大，思念被吹到隔壁岛了。”']},
    garden:{name:'怪蔬菜小园',lines:['紫甘蓝抖抖叶子，露出一只偷午睡的螃蟹。菜农：“这是会动的有机认证。”','南瓜顶起小草帽，里面传来一声“别浇了，我刚洗完头”。','岛主在菜地插了新牌：禁止比菜还闲。']},
    well:{name:'回声许愿井',lines:['你向井里喊“发财！”回声答：“先吃饭！”看来井也饿了。','你许愿今晚不加班，井里冒出一个泡泡：“批准。”','你问井里有谁。回声说：“我只是路过的水。”']},
    drying:{name:'海风晾鱼架',lines:['风把咸鱼吹得齐刷刷翻身。大婶：“看，连鱼都知道换个姿势。”','你轻轻一碰，晾鱼架奏出一声跑调的海风小曲。','有条鱼挂反了。岛主扶正眼镜：“它想看看不同的世界。”']}
  };
  function islandFresh(){return {docked:false,choices:[],visits:0,nextAt:0};}
  function islandReady(s,now){return s.home.rooms.includes('lookout')&&!s.island.docked;}
  function talesFresh(){return {choices:[[],[],[]],seen:[],cursor:0};}
  function episodeReady(s,i){return i===0?s.life.author&&s.buildings.some(b=>b.type==='puffer'):i===1?s.salvager.built:i===2?s.home.rooms.includes('kitchen')&&s.camp.meals>0:false;}
  function anticReady(s,i){const k=ANTICS[i][2];return k==='always'||k==='author'&&s.life.author||k==='salvage'&&s.salvager.built||s.buildings.some(b=>b.type===k);}
  function nextAntic(s){for(let j=0;j<ANTICS.length;j++){const i=(s.tales.cursor+j)%ANTICS.length;if(anticReady(s,i))return i;}return 3;}
  function nextEpisode(s){return EPISODES.findIndex((e,i)=>episodeReady(s,i)&&s.tales.choices[i].length<3);}
  const STORIES = {
    crewTank: [
      ['头上的锅','阿桶：雨滴敲锅，听起来像催饭。卷姨说，那是她最后一口锅！','roof',{},'cushion','屋顶补好了。阿桶把锅还了，却留了一个锅盖当坐垫。'],
      ['冷风争夺战','大家排队追着阿桶的空调跑。把冷风留给屋里吧。','camp1',{metal:2},'chime','空调安稳了，门口的贝壳风铃替他追风。'],
      ['合租全家福','阿桶想站最前面，结果挡住了整栋楼。','bunk',{},'sign','他往旁边挪了一小步，给每个人都留了位置。']
    ],
    crewWire: [
      ['鱼电话没信号','阿线把鱼举到最高处：喂？先让电鳗吃饱再说。','fed',{},'radio','电话还是不通，鱼骨收音机倒响了。'],
      ['一口气的实验','河豚说自己能吹亮一盏灯。阿线已经举起了开关。','oxygen',{oxygen:1},'lamp','灯亮了！河豚憋红了脸，阿线忘了鼓掌。'],
      ['并不科学的星星','阿线想给星星接电，阿潜递过来一卷纸筒。','lights',{},'telescope','望远镜看不清星星，却看清了隔壁船的晚饭。']
    ],
    crewBoss: [
      ['锅终于回家','卷姨：锅是用来煮饭的，不是安全帽。今天先吃点热的。','camp1',{water:2,fish:1},null,'锅里的香气飘出来，连电鳗都伸长了脖子。'],
      ['厨房小花园','卷姨捡到一盆植物，坚持说它以后能当葱用。','kitchen',{},'mushroom','没长出葱，长出了一朵发光蘑菇。厨房更亮了。'],
      ['没有节日也开席','大家忙着搬家，卷姨宣布今晚理由不重要，吃饭重要。','camp2',{fish:2},'bunting','灯串一亮，连阿桶都主动洗了锅。']
    ],
    crewDiver: [
      ['头盔里的敲门声','阿潜入住第一晚，有人听见头盔里咚咚响。','diver',{},null,'原来他把备用扳手忘在头盔里了。'],
      ['修好漏风的晚安','阿潜检查了一圈，把窗缝和自己的鞋底都补好了。','lights',{mortar:1},null,'风留在外面，晚安留在屋里。'],
      ['灯塔第一班岗','灯塔亮起时，阿潜想当最先看到新朋友的人。','lookout',{},null,'他看见一条小船，也看见大家在楼下挥手。']
    ],
    crewAuthor: [
      ['第一杯海上咖啡','阿昊背着电脑靠岸：有淡水吗？我带了咖啡，也带了很多奇怪的菜单。','author',{water:2},null,'第一口咖啡下肚。他在手账写下：这里适合多住几天。'],
      ['只差一个插座','阿昊打开背包，桌子和遮阳棚弹了出来。现在，只差电鳗点头。','fed',{},'desk','电鳗：电脑可以，咖啡壶得排队。阿昊先把文档存了。'],
      ['今日菜单有点怪','卷姨端来海藻气泡饮和螺旋烤串。阿昊已经翻开风味护照。','kitchen',{fish:1,water:1},'tasting','表情停了三秒，他又喝了一口：这个味道，我得再确认一下。']
    ]
  };
  const VIGNETTES = [
    ['crewTank','阿桶转了半圈，大家也追着冷风转了半圈。'],
    ['crewWire','阿线对着鱼电话说：信号不好，你先别游。'],
    ['crewBoss','卷姨尝了一口汤：淡了。海风立刻想帮忙。'],
    ['crewTank','阿桶抱着木头路过：这是家具，还是今晚的枕头？'],
    ['crewWire','电鳗打了个嗝，阿线的头发又立起来了。'],
    ['crewBoss','卷姨敲锅开饭，连海鸥都排上了队。']
  ];
  function lifeFresh(opening=0) { return { author:false, opening, stories:{crewTank:0,crewWire:0,crewBoss:0,crewDiver:0,crewAuthor:0}, owned:['flag','plant'], slots:['flag','plant',null,null,null,null], palette:0, offline:Object.fromEntries(Object.keys(OFFLINE_CAP).map(k=>[k,0])), visitor:0, sound:true }; }
  function storyGate(s,key) {
    return key==='author'?s.life.author:key==='diver'?s.home.resident:key==='fed'?s.stats.fed>0:key==='oxygen'?s.stats.oxygenCollected>0:key==='camp1'?s.camp.stage>=1:key==='camp2'?s.camp.stage>=2:s.home.rooms.includes(key);
  }
  function story(s,who) { const rows=STORIES[who];return rows&&rows[s.life.stories[who]]||null; }
  function storyReady(s,who) { const r=story(s,who);return !!r&&residents(s).includes(who)&&storyGate(s,r[2]); }
  function storyHint(key) { return {author:'邀请阿昊入住',diver:'邀请阿潜入住',fed:'投喂过一次电鳗',oxygen:'收取一批氧气瓶',camp1:'建成清凉小屋',camp2:'建成轮胎合租楼',roof:'补好漏雨屋顶',kitchen:'建好独立厨房',bunk:'建好二层客房',lights:'建好暖灯客厅',lookout:'建好屋顶灯塔'}[key]; }
  function claimOffline(s) { const loot={};for(const k in OFFLINE_CAP){const n=Math.min(s.life.offline[k],CAP-s.resources[k]);if(n){s.life.offline[k]-=n;s.resources[k]+=n;recordCollected(s,k,n);loot[k]=n;}}return loot; }
  const SALVAGER = { cost: { wood: 8, metal: 4 }, seconds: 20, capacity: 24 };
  function salvagerFresh() { return { built: false, pending: 0, progress: 0, worker: null, powered: false }; }
  function residents(s) { return ['crewTank','crewWire','crewBoss',...(s.home.resident?['crewDiver']:[]),...(s.life&&s.life.author?['crewAuthor']:[])]; }
  function salvagerAmount(s) { return s.salvager.worker ? 3 : 2; }
  function collectSalvager(s) {
    const n=Math.min(s.salvager.pending,CAP-s.resources.wood);
    s.salvager.pending-=n;s.resources.wood+=n;
    if(n)recordCollected(s,'wood',n);
    return n;
  }
  // Forecast only already-scheduled automatic wood; no hypothetical feeding or collection.
  function woodEstimate(s, needed, now) {
    if(s.resources.wood>=needed)return '木材已备齐';
    if(s.life&&s.life.offline.wood>0)return '离线补给箱还有 '+s.life.offline.wood+' 木材，回家一键收取';
    const q=s.salvager;
    if(!q.built)return '建章鱼打捞站可自动获得木材';
    const missing=needed-s.resources.wood;
    if(q.pending>=missing)return '打捞站已有足够木材，点击收取';
    if(missing>SALVAGER.capacity)return '超过暂存容量，需要分次收取';
    const copy=JSON.parse(JSON.stringify(s));
    advance(copy,now);
    for(let seconds=0;seconds<=240;seconds++){
      advance(copy,now+seconds*1000);
      if(copy.salvager.pending>=missing)return '按当前指派与剩余电力，约 '+seconds+' 秒后可收齐';
    }
    return '先收取暂存木材，再继续生产';
  }
  const CAMP_PROJECTS = [
    { title: '空调别背了，装屋里！', who: 'crewTank', line: '我一转身，全屋的人都追着冷风跑。先把饭和水备好，再给空调装个架子！', cost: { water: 4, fish: 2, metal: 4 }, result: '清凉合租屋', need: '建好过滤器和渔场', types: ['filter', 'fishery'] },
    { title: '大婶要一间正经厨房', who: 'crewBoss', line: '锅在床边，鱼在枕边。把轮胎楼搭起来，我就给全营地开伙！', cost: { wood: 20, metal: 10, water: 8, coins: 35 }, result: '轮胎合租楼', need: '至少投喂过一次电鳗', types: ['eel'] },
    { title: '给整栋楼装条鲨鱼', who: 'crewWire', line: '别人搬家打包家具。我们把楼装到机械鲨鱼背上，连家一起开走！', cost: { wood: 40, metal: 22, water: 14, fish: 8, coins: 90 }, result: '机械鲨鱼营地', need: '至少一台设备升到 2 级', types: ['filter', 'fishery', 'eel'] }
  ];
  // Fixed projects are permanent; a single saved work order prevents duplicate spending.
  const ROOMS = [
    { id: 'roof', name: '补好漏雨屋顶', event: '阿桶把锅顶在头上：再不补屋顶，床就变渔场了！', result: '屋顶不漏了，终于能安心睡觉。', cost: { wood: 8, metal: 2 }, stage: 0, seconds: 8 },
    { id: 'kitchen', name: '卷姨的独立厨房', event: '卷姨：别在枕头上切鱼！我要自己的灶台。', result: '厨房开伙，供餐生活费从 8 提升到 12 金币。', cost: { wood: 12, metal: 4, water: 4 }, stage: 1, seconds: 12 },
    { id: 'bunk', name: '给新邻居留张床', event: '窗外有个潜水头盔在敲门：有床吗？我自带扳手！', result: '新增二层客房，可以邀请潜水维修工阿潜入住。', cost: { wood: 18, metal: 6, resin: 2 }, stage: 2, seconds: 16 },
    { id: 'lights', name: '暖灯公共客厅', event: '阿线：每晚找拖鞋都像寻宝。咱们装一排灯吧！', result: '暖灯照亮客厅，全体住户有了公共休息区。', cost: { oxygen: 3, mortar: 2, coins: 25 }, stage: 2, seconds: 12 },
    { id: 'lookout', name: '屋顶灯塔与吊机', event: '阿潜：把吊机装上去，以后捞东西不用拿我当鱼钩。', result: '三层灯塔落成！每份漂流物额外获得木材 2、金属 1。', cost: { mortar: 4, resin: 2, wood: 24, coins: 50 }, stage: 3, seconds: 20 }
  ];
  const SKY_ROOMS = [
    {id:'coffee',name:'阿昊咖啡工作间',floor:3,art:0,who:'crewAuthor',cost:{wood:18,metal:5,resin:2},seconds:12,action:'给咖啡打奶泡',intro:'阿昊把电脑搬上三楼：终于有一间房，插座比床位多了。',reply:'噗——奶泡堆成小山！阿昊：这杯叫云端办公。'},
    {id:'bath',name:'海景泡泡浴室',floor:3,art:1,who:'crewTank',cost:{wood:16,metal:6,water:8},seconds:12,action:'打开海风花洒',intro:'阿桶抱着浴缸上楼：海景房有了，我想泡的水得是淡的。',reply:'花洒一开，泡沫飞上头顶。阿桶：今天的发型叫海草自由。'},
    {id:'laundry',name:'水母洗衣房',floor:4,art:2,who:'crewWire',cost:{wood:20,metal:6,resin:3},seconds:16,action:'启动水母甩干',intro:'阿线请来水母洗衣工：它负责转圈，我负责认领袜子。',reply:'袜子啪地贴住玻璃！阿线：衣服没丢，只是换了个展示位置。'},
    {id:'diner',name:'怪味海鲜餐厅',floor:4,art:3,who:'crewBoss',cost:{wood:22,metal:5,mortar:3},seconds:16,action:'揭开今日特餐',intro:'卷姨挂出菜单：今天的菜名，等阿昊尝完再定。',reply:'锅盖一开，饮料咕嘟冒泡。卷姨：这是汤，还是你点的咖啡？'},
    {id:'greenhouse',name:'海风玻璃温室',floor:5,art:4,who:'crewDiver',cost:{wood:24,metal:8,resin:4},seconds:18,action:'给海藻浇点水',intro:'阿潜把捞来的海藻种进花盆：它应该不会比楼长得快吧？',reply:'海藻探过窗户，跟隔壁打招呼。阿潜：房客没增加，绿化超员了。'},
    {id:'hammock',name:'摇摇吊床露台',floor:5,art:5,who:'crewTank',cost:{wood:22,metal:5,resin:3},seconds:18,action:'轻轻推一下吊床',intro:'阿桶挂好吊床：从这里躺着看海，应该不算摸鱼。',reply:'吊床晃了一圈，拖鞋先下楼了。阿桶：帮我给一楼带个话！'},
    {id:'rooftop',name:'楼顶烧烤营地',floor:6,art:6,who:'crewBoss',cost:{wood:30,metal:10,mortar:5,coins:35},seconds:20,action:'敲响楼顶开饭铃',intro:'灯串亮起，大家各搬一把椅子上楼。六层的海风，配一顿热饭。',reply:'叮——全楼开饭！阿昊带咖啡，阿桶带胃口，卷姨说谁也不许洗碗前溜走。'}
  ];
  function towerFresh(){return {rooms:[],construction:null,swapped:[],seen:[]};}
  function towerPrerequisite(s,r){return !!r&&s.home.rooms.includes('lookout')&&(r.floor===3||SKY_ROOMS.filter(x=>x.floor===r.floor-1).every(x=>s.tower.rooms.includes(x.id)));}
  function towerReady(s,id){const r=SKY_ROOMS.find(r=>r.id===id);return towerPrerequisite(s,r)&&!s.home.construction&&!s.tower.construction&&!s.tower.rooms.includes(id);}
  function towerTop(s){return Math.max(2,...SKY_ROOMS.filter(r=>s.tower.rooms.includes(r.id)||s.tower.construction&&s.tower.construction.id===r.id).map(r=>r.floor));}
  function towerReach(s){return s.home.rooms.includes('lookout')?Math.max(3,...SKY_ROOMS.filter(r=>towerPrerequisite(s,r)).map(r=>r.floor)):2;}
  function homeFresh() { return { rooms: [], construction: null, resident: false }; }
  function roomReady(s, id) {
    const i = ROOMS.findIndex(r => r.id === id), r = ROOMS[i];
    return !!r && !s.home.construction && !s.home.rooms.includes(id) && s.camp.stage >= r.stage && (i === 0 || s.home.rooms.includes(ROOMS[i-1].id)) && (id !== 'lookout' || s.home.resident);
  }
  function mealReward(s) { return { coins: (s.home.rooms.includes('kitchen') ? 12 : 8) + (s.home.resident ? 4 : 0) }; }
  function campReady(s) {
    const stage = s.camp ? s.camp.stage : 0, p = CAMP_PROJECTS[stage];
    return !!p && p.types.every(type => s.buildings.some(b => b.type === type)) && (stage !== 1 || s.stats.fed > 0) && (stage !== 2 || s.buildings.some(b => b.level >= 2));
  }
  const ORDER_LIST = [
    { title: '给邻船一桶清水', from: '邮船阿岚', need: { water: 6 }, reward: { coins: 20, wood: 5 }, line: '长途航行后，一口清水最珍贵。' },
    { title: '今天想吃鲜鱼', from: '海上小厨房', need: { fish: 4 }, reward: { coins: 25, metal: 3 }, line: '晚饭的香气，已经在甲板上等你。' },
    { title: '灯塔补给箱', from: '灯塔看守人', need: { water: 10, fish: 3 }, reward: { coins: 40, wood: 8, metal: 4 }, line: '谢谢你，让远处的灯也能一直亮着。' }
  ];
  const CONTRACTS = [
    { title: '灯塔防水维修', need: { oxygen: 3, resin: 2 }, reward: { coins: 60, metal: 6 } },
    { title: '邻船船体保养', need: { oxygen: 6, resin: 3 }, reward: { coins: 90, wood: 12, metal: 8 } }
  ];
  function unlocked(state, kind) { return !DEFINITIONS[kind].unlock || state.camp.stage >= DEFINITIONS[kind].unlock; }
  function recordCollected(state, key, n) { state.stats[key + 'Collected'] = (state.stats[key + 'Collected'] || 0) + n; }
  const QUESTS = [
    { title: '捞起第一份漂流物', tip: '点击海面上的漂流木箱，收集建造材料。', stat: 'salvaged', target: 1, reward: { wood: 5 } },
    { title: '建造海水过滤器', tip: '点击空甲板，放下一台过滤器。', building: 'filter', reward: { coins: 10, metal: 2 } },
    { title: '收取第一桶淡水', tip: '等过滤完成，点击设备收取淡水。', stat: 'waterCollected', target: 2, reward: { wood: 8 } },
    { title: '建造基础渔场', tip: '在空甲板上建造渔场，让渔网随潮汐工作。', building: 'fishery', reward: { coins: 15 } },
    { title: '收获两条鲜鱼', tip: '渔场不需要电也能工作，收获后点击领取。', stat: 'fishCollected', target: 2, reward: { metal: 4, wood: 8 } },
    { title: '迎接电鳗伙伴', tip: '备齐材料，在空甲板建造电鳗发电机。', building: 'eel', reward: { fish: 2 } },
    { title: '点亮海上家园', tip: '点击发电机，用 2 条鱼投喂电鳗。', stat: 'fed', target: 1, reward: { coins: 20 } },
    { title: '让过滤器加速运转', tip: '选择过滤器，打开电力加速。', stat: 'powered', target: 1, reward: { wood: 8, metal: 3 } },
    { title: '完成第一笔订单', tip: '前往商船，交付物资并获得奖励。', stat: 'orders', target: 1, reward: { coins: 25 } },
    { title: '升级一台设备', tip: '选择设备，用材料和金币升到 2 级。', stat: 'upgrades', target: 1, reward: { coins: 30, wood: 10, metal: 4 } }
  ];
  QUESTS.push(
    { title: '把空调装进合租屋', tip: '进入居民页，完成第一个营地项目。', camp: 1, reward: { coins: 20 } },
    { title: '请河豚来上班', tip: '进入工坊，建造河豚增氧机。', building: 'puffer', reward: { water: 6 } },
    { title: '收取第一批氧气瓶', tip: '工坊中给河豚投料，完成后收取。', stat: 'oxygenCollected', target: 3, reward: { wood: 10, metal: 4 } },
    { title: '建成轮胎合租楼', tip: '进入居民页，完成卷姨的厨房项目。', camp: 2, reward: { coins: 25 } },
    { title: '海牛的化工第一天', tip: '进入工坊，建造海牛化工厂。', building: 'manatee', reward: { water: 6 } },
    { title: '收取第一桶海工树脂', tip: '用氧气瓶和淡水投料，完成后收取树脂。', stat: 'resinCollected', target: 1, reward: { coins: 20 } },
    { title: '完成第一笔工坊订单', tip: '备齐氧气瓶与树脂，在工坊交付订单。', stat: 'contracts', target: 1, reward: { coins: 35, metal: 6 } }
  );
  QUESTS.push(
    { title: '让雨水留在屋外', tip: '居民页打开居住改造，补好屋顶。', room: 'roof', reward: { wood: 8 } },
    { title: '给卷姨一个灶台', tip: '完成独立厨房，提升供餐收入。', room: 'kitchen', reward: { coins: 20 } },
    { title: '鲨鱼也要上班', tip: '工坊第二页建造鲨鱼搅拌机。', building: 'mixer', reward: { resin: 2, metal: 4 } },
    { title: '迎接潜水邻居', tip: '建好二层客房，再邀请阿潜入住。', stat: 'residentsJoined', target: 1, reward: { coins: 25 } },
    { title: '亮起一屋暖灯', tip: '用鲨鱼生产的防水建材建造公共客厅。', room: 'lights', reward: { wood: 12 } },
    { title: '灯塔照见新生活', tip: '机械鲨鱼营地阶段，建成屋顶灯塔与吊机。', room: 'lookout', reward: { coins: 60 } }
  );
  const NEW_STATS = ['oxygenCollected','resinCollected','contracts','mortarCollected','roomsBuilt','residentsJoined','woodCollected'];
  const STAT_KEYS = ['salvaged', 'waterCollected', 'fishCollected', 'fed', 'powered', 'orders', 'upgrades', 'expanded'];
  function fresh(now) {
    return {
      version: VERSION, lastTick: now, createdAt: now,
      resources: { wood: 16, metal: 6, water: 0, fish: 0, coins: 20, oxygen: 0, resin: 0, mortar: 0 },
      salvager: salvagerFresh(), life: lifeFresh(), tales: talesFresh(), tower: towerFresh(), island: islandFresh(),
      plots: [5, 6, 7, 9, 10, 11], buildings: [], nextId: 1,
      salvage: 3, salvageProgress: 0, quest: 0, order: 0, introSeen: false,
      camp: { stage: 0, meals: 0, nextMealAt: 0 }, home: homeFresh(),
      stats: Object.fromEntries([...STAT_KEYS,...NEW_STATS].map(k => [k, 0]))
    };
  }
  function costText(cost) { return Object.entries(cost).map(([k, n]) => RESOURCE_NAMES[k] + ' ' + n).join(' · '); }
  function afford(state, cost) { return Object.entries(cost).every(([k, n]) => state.resources[k] >= n); }
  function spend(state, cost) { for (const k in cost) state.resources[k] -= cost[k]; }
  function rewardFits(state, reward) { return Object.entries(reward).every(([k, n]) => state.resources[k] + n <= CAP); }
  function grant(state, reward) { for (const k in reward) state.resources[k] = Math.min(CAP, state.resources[k] + reward[k]); }
  function getBuilding(state, id) { return state.buildings.find(b => b.id === id); }
  function amount(b) { return DEFINITIONS[b.type].amount + b.level - 1; }
  function capacity(b) { return DEFINITIONS[b.type].capacity + (b.level - 1) * 3; }
  function upgradeCost(b) { return { wood: 10 * b.level, metal: 3 * b.level, coins: 20 * b.level }; }
  function expansionCost(state) { const n = state.plots.length - 6; return { wood: 12 + n * 4, coins: 10 + n * 5 }; }
  function adjacent(a, b) { return Math.abs(a % 4 - b % 4) + Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) === 1; }
  function expandable(state, plot) { return Number.isInteger(plot) && plot >= 0 && plot < 16 && !state.plots.includes(plot) && state.plots.some(p => adjacent(p, plot)); }
  function power(state, now) {
    const total = state.buildings.filter(b => b.type === 'eel' && b.fuelUntil > now).reduce((sum, b) => sum + b.level + 2, 0);
    let used = 0;
    const active = [];
    for (const b of state.buildings) {
      const demand = DEFINITIONS[b.type].power;
      if (b.powered && demand && used + demand <= total) { used += demand; active.push(b.id); }
    }
    if(state.salvager.built&&state.salvager.powered&&used<total){used++;active.push('salvager');}
    return { total, used, active };
  }
  // Progress is split at fuel-expiry boundaries, so offline catch-up uses the same rules as live play.
  function advance(state, now, offline = false) {
    if (!Number.isFinite(now) || now <= state.lastTick) return { elapsed: 0, produced: {} };
    const elapsed = Math.min(now - state.lastTick, OFFLINE_MAX);
    const end = state.lastTick + elapsed;
    let cursor = state.lastTick;
    const produced = {};
    while (cursor < end) {
      let next = end;
      for (const b of state.buildings) if (b.type === 'eel' && b.fuelUntil > cursor && b.fuelUntil < next) next = b.fuelUntil;
      const dt = (next - cursor) / 1000;
      const p = power(state, cursor);
      for (const b of state.buildings) {
        const d = DEFINITIONS[b.type];
        const reserve = offline && d.output ? Math.max(0,OFFLINE_CAP[d.output]-state.life.offline[d.output]) : 0;
        if (!d.output || b.pending >= capacity(b) && !reserve) { b.progress = 0; continue; }
        if (d.recipe && !b.batch) { b.progress = 0; continue; }
        b.progress += dt * (p.active.includes(b.id) ? 2 : 1);
        const cycles = Math.floor((b.progress + 1e-8) / d.seconds);
        if (cycles) {
          const added = Math.min(capacity(b) + reserve - b.pending, (d.recipe ? 1 : cycles) * amount(b));
          b.pending += added;
          if(offline&&b.pending>capacity(b)){state.life.offline[d.output]+=b.pending-capacity(b);b.pending=capacity(b);}
          produced[d.output] = (produced[d.output] || 0) + added;
          if (d.recipe) { b.batch = false; b.progress = 0; continue; }
          b.progress = b.pending === capacity(b) ? 0 : Math.max(0, b.progress - cycles * d.seconds);
        }
      }
      const q=state.salvager;
      const reserveWood=offline?Math.max(0,OFFLINE_CAP.wood-state.life.offline.wood):0;
      if(q.built&&(q.pending<SALVAGER.capacity||reserveWood)){
        q.progress+=dt*(p.active.includes('salvager')?2:1);
        const cycles=Math.floor((q.progress+1e-8)/SALVAGER.seconds);
        if(cycles){const n=Math.min(SALVAGER.capacity+reserveWood-q.pending,cycles*salvagerAmount(state));q.pending+=n;if(offline&&q.pending>SALVAGER.capacity){state.life.offline.wood+=q.pending-SALVAGER.capacity;q.pending=SALVAGER.capacity;}produced.wood=(produced.wood||0)+n;q.progress=q.pending===SALVAGER.capacity?0:Math.max(0,q.progress-cycles*SALVAGER.seconds);}
      }
      cursor = next;
    }
    if (state.salvage < 3) {
      state.salvageProgress += elapsed / 1000;
      const count = Math.floor(state.salvageProgress / 20);
      state.salvage = Math.min(3, state.salvage + count);
      state.salvageProgress = state.salvage === 3 ? 0 : state.salvageProgress % 20;
    }
    if (state.home.construction && state.home.construction.endsAt <= now) {
      state.home.rooms.push(state.home.construction.id);
      state.home.construction = null; state.stats.roomsBuilt++;
    }
    if(state.tower.construction&&state.tower.construction.endsAt<=now){state.tower.rooms.push(state.tower.construction.id);state.tower.construction=null;}
    state.lastTick = now;
    return { elapsed, produced };
  }
  function questDone(state) {
    const q = QUESTS[state.quest];
    return !!q && (q.room ? state.home.rooms.includes(q.room) : q.camp ? state.camp.stage >= q.camp : q.building ? state.buildings.some(b => b.type === q.building) : state.stats[q.stat] >= q.target);
  }
  function fail(message) { return { ok: false, message }; }
  function success(message) { return { ok: true, message }; }
  function act(state, action, now) {
    advance(state, now);
    switch (action.type) {
      case 'islandDock': {
        if(!islandReady(state,now))return fail('请先建好灯塔；已靠岸时无需重复停靠');
        state.island.docked=true;state.island.visits++;return success('已靠岸 · 基博岛主来迎接了');
      }
      case 'islandChoice': {
        const q=state.island;
        if(!q.docked||q.choices.length>=3||action.step!==q.choices.length||!integer(action.choice,0,1))return fail('这段靠岛故事已经记下了');
        const step=ISLAND_STEPS[q.choices.length];q.choices.push(action.choice);
        return {ok:true,message:q.choices.length===3?'获得纪念：正经办事感谢旗':'岛主记住了你的帮忙',islandLine:step.replies[action.choice]};
      }
      case 'islandLeave': {
        if(!state.island.docked)return fail('海楼正在航行');
        state.island.docked=false;state.island.nextAt=0;return success('再次启航 · 故事进度已保留');
      }
      case 'episode': {
        if(!integer(action.episode,0,2)||!integer(action.choice,0,1))return fail('无效的故事选择');
        const i=action.episode,e=EPISODES[i],progress=state.tales.choices[i];
        if(!episodeReady(state,i))return fail(e.hint);
        if(progress.length>=3||action.step!==progress.length)return fail('这段故事已经记下了');
        const line=e.steps[progress.length][3][action.choice];progress.push(action.choice);
        const prize=progress.length===1?e.rewards[0]:progress.length===3?e.rewards[1]:null;
        if(prize&&!state.life.owned.includes(prize)){state.life.owned.push(prize);state.life.slots[DECOR.find(d=>d.id===prize).slot]=prize;}
        return {ok:true,message:prize?'纪念物已摆进家园':'记下这段海上怪事',taleLine:line,prize};
      }
      case 'antic': {
        const i=action.index;if(!integer(i,0,ANTICS.length-1)||!anticReady(state,i))return fail('这件小事还没发生');
        if(!state.tales.seen.includes(i))state.tales.seen.push(i);
        state.tales.cursor=(i+1)%ANTICS.length;
        return {ok:true,message:'小事已收藏，随时可重看',taleLine:ANTICS[i][5]};
      }
      case 'opening':
        if(state.life.opening!==0)return fail('屋顶已经检查过了');
        state.life.opening=1;return success('木板到位！现在可以确认修补屋顶。');
      case 'authorJoin':
        if(state.life.author)return fail('阿昊已经入住');
        if(!state.home.rooms.includes('roof'))return fail('先补好漏雨屋顶，给电脑一个干燥的家');
        if(!afford(state,{water:2,fish:1}))return fail('迎新小餐需要淡水 2、鱼类 1');
        spend(state,{water:2,fish:1});state.life.author=true;
        return success('阿昊入住！咖啡、电脑和奇怪菜单都带来了。');
      case 'story': {
        const r=story(state,action.who),index=state.life.stories[action.who];
        if(!r||action.index!==index)return fail('这段故事已经记下了');
        if(!storyReady(state,action.who))return fail('先完成：'+storyHint(r[2]));
        if(!afford(state,r[3]))return fail('准备物资：'+costText(r[3]));
        spend(state,r[3]);state.life.stories[action.who]++;
        if(r[4]&&!state.life.owned.includes(r[4]))state.life.owned.push(r[4]);
        return {ok:true,message:r[4]?'故事已收藏 · 获得'+DECOR.find(d=>d.id===r[4]).name:'故事已收藏',line:r[5],who:action.who};
      }
      case 'decorate': {
        const d=DECOR.find(d=>d.id===action.id);
        if(!d||!state.life.owned.includes(d.id))return fail('先解锁这件装饰');
        state.life.slots[d.slot]=state.life.slots[d.slot]===d.id?null:d.id;
        return success('布置已保存 · 已拥有的装饰可免费更换');
      }
      case 'palette':
        if(!integer(action.value,0,2))return fail('未知配色');
        state.life.palette=action.value;return success('家园配色已更新');
      case 'sound':state.life.sound=!state.life.sound;return success(state.life.sound?'音效已开启':'音效已关闭');
      case 'visitor': {
        if(!state.home.rooms.includes('roof'))return fail('修好屋顶后，旧物商人才会靠岸');
        if(action.index!==state.life.visitor)return fail('这笔交换已经完成');
        const need=state.life.visitor%2?{fish:2}:{water:4},reward=state.life.visitor%2?{metal:3}:{wood:6};
        if(!afford(state,need))return fail('物资不足：'+costText(need));
        if(!rewardFits(state,reward))return fail('仓库放不下，请先使用一些材料');
        spend(state,need);grant(state,reward);state.life.visitor++;
        return success('旧物商人：别人眼里的废物，在这里都能当家具！');
      }
      case 'offlineClaim': {const loot=claimOffline(state);return Object.keys(loot).length?success('离线补给：'+costText(loot)):fail('暂无补给可领，或仓库已满');}

      case 'salvagerBuild': {
        if(state.salvager.built)return fail('打捞站已经建好');
        if(!state.home.rooms.includes('roof'))return fail('先修好漏雨屋顶，再请章鱼来上班');
        if(!afford(state,SALVAGER.cost))return fail('需要木材 8、金属 4');
        spend(state,SALVAGER.cost);state.salvager.built=true;
        return success('章鱼打捞站开工！独立泊位不占甲板');
      }
      case 'salvagerAssign': {
        if(!state.salvager.built)return fail('先建造章鱼打捞站');
        if(action.worker!==null&&!residents(state).includes(action.worker))return fail('只能指派已经入住的居民');
        state.salvager.worker=action.worker;
        return success(action.worker?'居民已接班，每批木材增加到 3':'居民回家休息，章鱼继续每批打捞 2 木材');
      }
      case 'salvagerPower': {
        const q=state.salvager;if(!q.built)return fail('先建造章鱼打捞站');
        const p=power(state,now);
        if(!q.powered&&p.used>=p.total)return fail('电力不足，请投喂电鳗或释放其他设备电力');
        q.powered=!q.powered;return success(q.powered?'打捞站电力加速开启':'打捞站恢复自然速度');
      }
      case 'salvagerCollect': {
        const n=collectSalvager(state);return n?success('自动打捞：木材 +'+n):fail('暂无可收木材，或木材仓库已满');
      }
      case 'towerBuild': {
        const r=SKY_ROOMS.find(r=>r.id===action.id);
        if(!towerReady(state,action.id))return fail('先完成灯塔和下一层的两间房，一次只施工一间');
        if(!afford(state,r.cost))return fail('扩建物资不足：'+costText(r.cost));
        spend(state,r.cost);state.tower.construction={id:r.id,startedAt:now,endsAt:now+r.seconds*1000};
        return success('吊机开工：'+r.name);
      }
      case 'towerPlay': {
        const r=SKY_ROOMS.find(r=>r.id===action.id);if(!r||!state.tower.rooms.includes(r.id))return fail('先建好这间房');
        if(!state.tower.seen.includes(r.id))state.tower.seen.push(r.id);
        return {ok:true,message:'这段入住小事已记住',roomLine:r.reply};
      }
      case 'towerSwap': {
        const f=action.floor,rs=SKY_ROOMS.filter(r=>r.floor===f);
        if(rs.length!==2||!rs.every(r=>state.tower.rooms.includes(r.id)))return fail('同层两间房建好后，可以免费换位');
        const a=state.tower.swapped,i=a.indexOf(f);if(i<0)a.push(f);else a.splice(i,1);return success('房间左右换好了，家具也跟着搬过来');
      }
      case 'room': {
        const r = ROOMS.find(r => r.id === action.id);
        if (!r || !roomReady(state, action.id)) return fail('请先完成前一项改造、升级营地；灯塔还需要阿潜入住');
        if (!afford(state, r.cost)) return fail('改造物资不足：' + costText(r.cost));
        spend(state, r.cost);
        state.home.construction = { id: r.id, startedAt: now, endsAt: now + r.seconds * 1000 };
        return success('大家开始施工：' + r.name);
      }
      case 'recruit': {
        if (state.home.resident) return fail('阿潜已经入住');
        if (!state.home.rooms.includes('bunk')) return fail('先给新邻居建一张床');
        const cost = { water: 4, fish: 3 };
        if (!afford(state, cost)) return fail('迎新晚餐需要淡水 4、鱼类 3');
        spend(state, cost); state.home.resident = true; state.stats.residentsJoined++;
        return success('阿潜入住！供餐生活费额外增加 4 金币');
      }
      case 'batch': {
        const b = getBuilding(state, action.id), d = b && DEFINITIONS[b.type];
        if (!d || !d.recipe) return fail('请选择工坊加工设备');
        if (b.batch) return fail('这一批还在加工，请勿重复投料');
        if (capacity(b) - b.pending < amount(b)) return fail('暂存空间不足，先收取产物');
        if (!afford(state,d.recipe)) return fail('原料不足：' + costText(d.recipe));
        spend(state,d.recipe);b.batch=true;b.progress=0;return success('已投料，开始加工这一批');
      }
      case 'contract': {
        const n=state.stats.contracts, o=CONTRACTS[n%CONTRACTS.length];
        if (action.index!==n) return fail('订单已更新，请重新查看');
        if (state.camp.stage<2) return fail('轮胎合租楼建成后开放工坊订单');
        if (!afford(state,o.need)) return fail('工坊物资未备齐');
        if (!rewardFits(state,o.reward)) return fail('奖励超出仓储上限');
        spend(state,o.need);grant(state,o.reward);state.stats.contracts++;
        return success('工坊订单完成！'+costText(o.reward));
      }
      case 'camp': {
        const p = CAMP_PROJECTS[state.camp.stage];
        if (!p || action.stage !== state.camp.stage) return fail('营地项目已经更新，请重新查看');
        if (!campReady(state)) return fail(p.need);
        if (!afford(state, p.cost)) return fail('建设物资还没备齐，先生产和接订单吧');
        spend(state, p.cost); state.camp.stage++;
        return success('营地升级：' + p.result);
      }
      case 'meal': {
        if (!state.camp.stage) return fail('先完成第一个居民项目，开放合租生活');
        if (action.meals !== state.camp.meals || now < state.camp.nextMealAt) return fail('大家还在吃饭，稍后再来');
        const cost = { water: 2, fish: 1 }, reward = mealReward(state);
        if (!afford(state, cost)) return fail('备好淡水 2 和鱼类 1 再开饭');
        if (!rewardFits(state, reward)) return fail('金币仓储已满');
        spend(state, cost); grant(state, reward); state.camp.meals++;
        state.camp.nextMealAt = now + 60000;
        return success('居民吃饱了！收到生活费 ' + reward.coins + ' 金币');
      }
      case 'intro': state.introSeen = true; return success('这片海我包了');
      case 'salvage': {
        if (!state.salvage) return fail('漂流物还在路上，稍等一会儿');
        const base = state.home.rooms.includes('lookout') ? { wood: 6, metal: 3 } : { wood: 4, metal: 2 };
        const loot=Object.fromEntries(Object.entries(base).map(([k,n])=>[k,Math.min(n,CAP-state.resources[k])]).filter(([,n])=>n>0));
        if (!Object.keys(loot).length) return fail('木材和金属仓库都满了，先使用一些材料吧');
        state.salvage--; state.stats.salvaged++; grant(state, loot);
        return success('打捞成功：' + costText(loot));
      }
      case 'build': {
        if (!Object.prototype.hasOwnProperty.call(DEFINITIONS, action.kind)) return fail('未知设备');
        const d = DEFINITIONS[action.kind];
        if (!unlocked(state,action.kind)) return fail('先完成营地项目，解锁这台设备');
        if (!state.plots.includes(action.plot) || state.buildings.some(b => b.plot === action.plot)) return fail('请选择一块空甲板');
        if (!afford(state, d.cost)) return fail('材料不足，打捞漂流物或完成订单吧');
        spend(state, d.cost);
        state.buildings.push({ id: state.nextId++, type: action.kind, plot: action.plot, level: 1, pending: 0, progress: 0, powered: false, fuelUntil: 0 });
        if (d.recipe) state.buildings[state.buildings.length-1].batch=false;
        return success(d.name + '建造完成');
      }
      case 'collect': {
        const b = getBuilding(state, action.id);
        if (!b || !DEFINITIONS[b.type].output) return fail('请选择生产设备');
        if (!b.pending) return fail('正在生产，稍等片刻');
        const resource = DEFINITIONS[b.type].output;
        const n = Math.min(b.pending, CAP - state.resources[resource]);
        if (!n) return fail('仓库已满，先交付订单吧');
        b.pending -= n; state.resources[resource] += n;
        recordCollected(state,resource,n);
        return success(RESOURCE_NAMES[resource] + ' +' + n);
      }
      case 'collectAll': {
        const loot = claimOffline(state), wood=collectSalvager(state);if(wood)loot.wood=(loot.wood||0)+wood;
        for (const b of state.buildings) {
          const d = DEFINITIONS[b.type];
          if (!d.output) continue;
          const n = Math.min(b.pending, CAP - state.resources[d.output]);
          b.pending -= n; state.resources[d.output] += n;
          if(n){loot[d.output]=(loot[d.output]||0)+n;recordCollected(state,d.output,n);}
        }
        return Object.keys(loot).length ? success('已收取：'+costText(loot)) : fail('暂无可收取产物，或仓库已满');
      }
      case 'feed': {
        const b = getBuilding(state, action.id);
        if (!b || b.type !== 'eel') return fail('请选择电鳗发电机');
        if (state.resources.fish < 2) return fail('需要 2 条鱼，先去渔场收获吧');
        if (Math.max(now, b.fuelUntil) + 180000 > now + 900000) return fail('电鳗已经吃饱了，稍后再投喂');
        state.resources.fish -= 2; b.fuelUntil = Math.max(now, b.fuelUntil) + 180000; state.stats.fed++;
        return success('电鳗吃饱啦！发电时间 +3 分钟');
      }
      case 'power': {
        const b = getBuilding(state, action.id);
        if (!b || !DEFINITIONS[b.type].power) return fail('这台设备无需供电');
        if (!b.powered) {
          const p = power(state, now);
          if (p.total - p.used < DEFINITIONS[b.type].power) return fail('电力不足，请先投喂电鳗或升级发电机');
          b.powered = true; state.stats.powered++;
        } else b.powered = false;
        return success(b.powered ? '已接通电力，生产速度 ×2' : '已切回自然生产');
      }
      case 'upgrade': {
        const b = getBuilding(state, action.id);
        if (!b) return fail('设备不存在');
        if (b.batch) return fail('这批加工结束后才能升级');
        if (b.level >= 3) return fail('当前原型最高为 3 级');
        const cost = upgradeCost(b);
        if (!afford(state, cost)) return fail('升级材料不足，先打捞或完成订单吧');
        spend(state, cost); b.level++; state.stats.upgrades++;
        return success(DEFINITIONS[b.type].short + '升至 ' + b.level + ' 级');
      }
      case 'move': {
        const b = getBuilding(state, action.id);
        if (!b || !state.plots.includes(action.plot) || state.buildings.some(x => x.plot === action.plot)) return fail('只能移动到空甲板上');
        b.plot = action.plot; return success('设备位置已调整');
      }
      case 'expand': {
        if (!expandable(state, action.plot)) return fail('请选择紧邻现有甲板的位置');
        const cost = expansionCost(state);
        if (!afford(state, cost)) return fail('扩建材料不足');
        spend(state, cost); state.plots.push(action.plot); state.stats.expanded++;
        return success('新甲板铺好了，家园又大了一点');
      }
      case 'order': {
        const order = ORDER_LIST[state.order % ORDER_LIST.length];
        if (!afford(state, order.need)) return fail('物资还没备齐，先收取设备产物吧');
        if (!rewardFits(state, order.reward)) return fail('奖励超出仓储上限，先消耗一些材料吧');
        spend(state, order.need); grant(state, order.reward); state.order++; state.stats.orders++;
        return success('订单完成！' + costText(order.reward));
      }
      case 'quest': {
        const q = QUESTS[state.quest];
        if (!q || !questDone(state)) return fail(q ? q.tip : '全部经营目标已完成');
        if (!rewardFits(state, q.reward)) return fail('奖励超出仓储上限，先使用一些材料吧');
        grant(state, q.reward); state.quest++;
        return success('目标完成！' + costText(q.reward));
      }
      default: return fail('不支持的操作');
    }
  }
  function integer(n, min, max) { return Number.isSafeInteger(n) && n >= min && n <= max; }
  function valid(s) {
    if (!s || s.version !== VERSION || !Number.isFinite(s.lastTick) || s.lastTick < 0 || !Number.isFinite(s.createdAt) || s.createdAt < 0 || typeof s.introSeen !== 'boolean') return false;
    if (s.camp !== undefined && (!s.camp || !integer(s.camp.stage, 0, 3) || !integer(s.camp.meals, 0, 1e12) || !Number.isFinite(s.camp.nextMealAt) || s.camp.nextMealAt < 0)) return false;
    if (s.home !== undefined) {
      const h=s.home;
      if (!h || !Array.isArray(h.rooms) || h.rooms.length>ROOMS.length || !h.rooms.every((id,i)=>id===ROOMS[i].id) || typeof h.resident!=='boolean' || (h.resident&&!h.rooms.includes('bunk'))) return false;
      if (h.rooms.some(id=>ROOMS.find(r=>r.id===id).stage>(s.camp?s.camp.stage:0)) || (h.rooms.includes('lookout')&&!h.resident)) return false;
      const c=h.construction, r=c&&ROOMS[h.rooms.length];
      if (c!==null && (!r || c.id!==r.id || !Number.isFinite(c.startedAt) || c.startedAt<0 || c.startedAt>s.lastTick || c.endsAt-c.startedAt!==r.seconds*1000 || (s.camp?s.camp.stage:0)<r.stage || (c.id==='lookout'&&!h.resident))) return false;
    }
    if(s.tower!==undefined){
      const q=s.tower,known=id=>SKY_ROOMS.some(r=>r.id===id);
      if(!q||!Array.isArray(q.rooms)||q.rooms.length>7||new Set(q.rooms).size!==q.rooms.length||!q.rooms.every(known)||!Array.isArray(q.seen)||q.seen.length>7||new Set(q.seen).size!==q.seen.length||!q.seen.every(id=>q.rooms.includes(id))||!Array.isArray(q.swapped)||q.swapped.length>3||new Set(q.swapped).size!==q.swapped.length||!q.swapped.every(f=>[3,4,5].includes(f)&&SKY_ROOMS.filter(r=>r.floor===f).every(r=>q.rooms.includes(r.id))))return false;
      if(q.rooms.some(id=>!towerPrerequisite(s,SKY_ROOMS.find(r=>r.id===id))))return false;
      const c=q.construction,r=c&&SKY_ROOMS.find(r=>r.id===c.id);
      if(c!==null&&(!r||q.rooms.includes(c.id)||!towerPrerequisite(s,r)||s.home.construction||!Number.isFinite(c.startedAt)||c.startedAt<0||c.startedAt>s.lastTick||c.endsAt-c.startedAt!==r.seconds*1000))return false;
    }
    if(s.salvager!==undefined){
      const q=s.salvager;
      if(!q||typeof q.built!=='boolean'||typeof q.powered!=='boolean'||!integer(q.pending,0,SALVAGER.capacity)||!Number.isFinite(q.progress)||q.progress<0||q.progress>=SALVAGER.seconds)return false;
      const allowed=['crewTank','crewWire','crewBoss',...(s.home&&s.home.resident?['crewDiver']:[]),...(s.life&&s.life.author?['crewAuthor']:[])];
      if(q.worker!==null&&!allowed.includes(q.worker))return false;
      if(!q.built&&(q.pending||q.progress||q.powered||q.worker!==null))return false;
      if(q.built&&(!s.home||!s.home.rooms.includes('roof')))return false;
      if(q.pending===SALVAGER.capacity&&q.progress!==0)return false;
    }
    if(s.island!==undefined){const q=s.island;
      if(!q||typeof q.docked!=='boolean'||!Array.isArray(q.choices)||q.choices.length>3||!q.choices.every(x=>integer(x,0,1))||!integer(q.visits,0,1e8)||!Number.isFinite(q.nextAt)||q.nextAt<0)return false;
      if((q.docked||q.choices.length||q.visits)&&(!s.home||!s.home.rooms.includes('lookout')))return false;
      if((q.docked||q.choices.length)&&!q.visits)return false;
    }
    if(s.tales!==undefined){const t=s.tales;
      if(!t||!Array.isArray(t.choices)||t.choices.length!==3||!t.choices.every(a=>Array.isArray(a)&&a.length<=3&&a.every(x=>integer(x,0,1)))||!Array.isArray(t.seen)||t.seen.length>8||new Set(t.seen).size!==t.seen.length||!t.seen.every(x=>integer(x,0,7))||!integer(t.cursor,0,7))return false;
    }
    if(s.life!==undefined){
      const l=s.life;
      if(!l||typeof l.author!=='boolean'||typeof l.sound!=='boolean'||!integer(l.opening,0,2)||!integer(l.palette,0,2)||!integer(l.visitor,0,1e8))return false;
      if(l.author&&(!s.home||!s.home.rooms.includes('roof')))return false;
      if(!l.stories||!Object.keys(STORIES).every(k=>integer(l.stories[k],0,3)))return false;
      if(l.stories.crewAuthor&&!l.author||l.stories.crewDiver&&!(s.home&&s.home.resident))return false;
      if(!Array.isArray(l.owned)||l.owned.length>DECOR.length||new Set(l.owned).size!==l.owned.length||!l.owned.every(id=>DECOR.some(d=>d.id===id)))return false;
      if(!Array.isArray(l.slots)||l.slots.length!==6||!l.slots.every((id,i)=>id===null||l.owned.includes(id)&&DECOR.some(d=>d.id===id&&d.slot===i)))return false;
      if(!l.offline||!Object.keys(OFFLINE_CAP).every(k=>integer(l.offline[k],0,OFFLINE_CAP[k])))return false;
    }
    if (!s.resources || !Object.keys(RESOURCE_NAMES).every(k => (['oxygen','resin','mortar'].includes(k) && s.resources[k] === undefined) || integer(s.resources[k], 0, CAP))) return false;
    if (!Array.isArray(s.plots) || s.plots.length < 6 || s.plots.length > 16 || new Set(s.plots).size !== s.plots.length || !s.plots.every(p => integer(p, 0, 15))) return false;
    if (!Array.isArray(s.buildings) || s.buildings.length > s.plots.length) return false;
    const ids = new Set(), plots = new Set();
    for (const b of s.buildings) {
      if (!b || !Object.prototype.hasOwnProperty.call(DEFINITIONS, b.type) || !integer(b.id, 1, 1e8) || !integer(b.level, 1, 3) || !s.plots.includes(b.plot) || ids.has(b.id) || plots.has(b.plot)) return false;
      if (!integer(b.pending, 0, capacity(b)) || !Number.isFinite(b.progress) || b.progress < 0 || b.progress >= Math.max(1, DEFINITIONS[b.type].seconds) || typeof b.powered !== 'boolean' || !Number.isFinite(b.fuelUntil) || b.fuelUntil < 0) return false;
      if (DEFINITIONS[b.type].recipe && (typeof b.batch !== 'boolean' || (!b.batch && b.progress !== 0) || (b.batch && capacity(b)-b.pending<amount(b)))) return false;
      if (b.type === 'eel' && (b.pending || b.progress || b.powered)) return false;
      ids.add(b.id); plots.add(b.plot);
    }
    if (!integer(s.nextId, 1, 1e8) || s.buildings.some(b => b.id >= s.nextId)) return false;
    if (!integer(s.salvage, 0, 3) || !Number.isFinite(s.salvageProgress) || s.salvageProgress < 0 || s.salvageProgress >= 20) return false;
    if (!integer(s.quest, 0, QUESTS.length) || !integer(s.order, 0, 1e8)) return false;
    return !!s.stats && NEW_STATS.every(k=>s.stats[k]===undefined||integer(s.stats[k],0,1e12)) && STAT_KEYS.every(k => integer(s.stats[k], 0, 1e12));
  }
  function checksum(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
  function serialize(state) { const payload = JSON.stringify(state); return JSON.stringify({ checksum: checksum(payload), payload }); }
  function deserialize(text, now) {
    try {
      const envelope = JSON.parse(text);
      if (typeof envelope.payload !== 'string' || checksum(envelope.payload) !== envelope.checksum) return null;
      const s = JSON.parse(envelope.payload);
      if (!valid(s)) return null;
      for(const k of ['oxygen','resin','mortar']) if(s.resources[k]===undefined)s.resources[k]=0;
      for(const k of NEW_STATS) if(s.stats[k]===undefined)s.stats[k]=0;
      if (!s.camp) s.camp = { stage: 0, meals: 0, nextMealAt: 0 };
      if (!s.home) s.home = homeFresh();
      if (!s.salvager) s.salvager = salvagerFresh();
      if (!s.life) s.life = lifeFresh(2);
      if (!s.tales) s.tales = talesFresh();
      if (!s.tower) s.tower = towerFresh();
      if (!s.island) s.island = islandFresh();
      // Legacy cooldowns no longer restrict visits. Keep the field for save compatibility.
      s.island.nextAt=0;
      // Clock rollback must not freeze the entire village until a future date.
      if (s.lastTick > now) {
        const delta = s.lastTick - now;
        s.island.nextAt=Math.max(0,s.island.nextAt-delta);
        for (const b of s.buildings) if (b.type === 'eel') b.fuelUntil = Math.max(0, b.fuelUntil - delta);
        if (s.home.construction) { s.home.construction.startedAt = Math.max(0, s.home.construction.startedAt-delta); s.home.construction.endsAt = s.home.construction.startedAt+ROOMS.find(r=>r.id===s.home.construction.id).seconds*1000; }
        if(s.tower.construction){const c=s.tower.construction;c.startedAt=Math.max(0,c.startedAt-delta);c.endsAt=c.startedAt+SKY_ROOMS.find(r=>r.id===c.id).seconds*1000;}
        s.camp.nextMealAt = Math.max(0, s.camp.nextMealAt - delta);
        s.lastTick = now;
      }
      return s;
    } catch (_) { return null; }
  }
  return { ISLAND_TOYS, ISLAND_STEPS, islandFresh, islandReady, SKY_ROOMS, towerFresh, towerReady, towerTop, towerReach, EPISODES, ANTICS, SOUVENIRS, talesFresh, episodeReady, anticReady, nextAntic, nextEpisode, DECOR, STORIES, VIGNETTES, OFFLINE_CAP, story, storyReady, storyHint, SALVAGER, residents, salvagerAmount, woodEstimate, ROOMS, roomReady, mealReward, CONTRACTS, unlocked, CAMP_PROJECTS, campReady, VERSION, CAP, OFFLINE_MAX, RESOURCE_NAMES, DEFINITIONS, ORDER_LIST, QUESTS, fresh, costText, afford, amount, capacity, upgradeCost, expansionCost, expandable, power, advance, questDone, act, getBuilding, valid, serialize, deserialize };
});
