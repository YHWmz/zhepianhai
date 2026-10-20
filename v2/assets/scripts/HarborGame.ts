import { _decorator, Component, Node, Canvas, Camera, UITransform, Graphics, Color, Label, Sprite, SpriteFrame, Texture2D, resources, Vec3, view, ResolutionPolicy, Layers, tween, Tween, EventTouch, sys, game, Game, profiler, UIOpacity, BlockInputEvents } from 'cc';
import { fresh, load, valid, depart, advance, leave, interact, expand, island, ISLANDS, SAVE_KEY, VoyageState } from './Voyage';
import { MACHINES, Machine, costText, upgradeCost, upgrade, batch, collect, feed, resume, salvage, deliver } from './Economy';
import { SKY_ROOMS, ISLAND_TOYS, VIGNETTES } from './HomeContent';
const { ccclass } = _decorator;
const FLOOR_HEIGHT = 104, CLOSE_SCALE = 1.23, CLOSE_BASE = -190;
const INK = '#183e47', PAPER = '#fff0ce', GOLD = '#e9b65d';
@ccclass('HarborGame')
export class HarborGame extends Component {
    private root!: Node;
    private screen!: Node;
    private floaters: Node[] = [];
    private time = 0;
    private frames: Record<string, SpriteFrame> = {};
    private state: VoyageState = fresh();
    private boat: Node | null = null;
    private coast: Node | null = null;
    private status: Label | null = null;
    private toastNode: Node | null = null;
    private economyLabels: (() => void)[] = [];
    private economyClock = 0;
    private floor = 0;
    private paused = false;
    private overview = false;
    private deckView=false;private selectedFloor=2;private actors:Node[]=[];
    private dirty = false;
    private saveClock = 0;
    async start() {
        view.setDesignResolutionSize(390, 844, ResolutionPolicy.SHOW_ALL);
        this.root = new Node('Canvas');
        this.root.layer = Layers.Enum.UI_2D;
        this.node.addChild(this.root);
        this.root.addComponent(UITransform).setContentSize(390, 844);
        this.root.addComponent(Canvas);
        const camera = new Node('UICamera');
        this.node.addChild(camera);
        camera.setPosition(0, 0, 1000);
        const c = camera.addComponent(Camera);
        c.projection = Camera.ProjectionType.ORTHO;
        c.orthoHeight = 422;
        c.near = 0;
        c.far = 2000;
        c.visibility = Layers.Enum.UI_2D;
        c.clearColor = new Color(14, 43, 55, 255);
        this.root.getComponent(Canvas)!.cameraComponent = c;
        this.screen = this.nodeAt('Loading', this.root);
        this.label(this.screen, '这片海我包了', 0, 35, 28);
        this.label(this.screen, '大航海时代 · 正在准备出航', 0, -10, 15);
        const names = ['ocean', 'island', 'shark', 'chief', 'author', 'boss', 'tank', 'wire', ...Object.keys(MACHINES), ...Array.from({ length: 6 }, (_, i) => 'room' + i), ...Array.from({ length: 7 }, (_, i) => 'sky' + i)];
        const results = await Promise.all(names.map(name => new Promise<boolean>(resolve => resources.load('art/' + name + '/texture', Texture2D, (err, texture) => { if (texture) {
            const frame = new SpriteFrame();
            frame.texture = texture;
            this.frames[name] = frame;
        } resolve(!err); }))));
        const existing = sys.localStorage.getItem(SAVE_KEY), backup = sys.localStorage.getItem(SAVE_KEY + '.backup');
        const restored=load(existing)||load(backup);
        if(existing&&!load(existing))sys.localStorage.setItem(SAVE_KEY+'.recovery',existing);
        if((existing||backup)&&!restored){this.paused=true;this.label(this.screen,'存档校验未通过，原始数据已保留。\n请勿清空缓存；本次不会覆盖存档。',0,-75,14,PAPER,350);return;}
        this.state=restored||fresh();
        const offline = resume(this.state.economy);
        profiler.hideStats();
        this.render();
        if (offline > 60)
            this.toast('离线期间设备继续生产，去设备甲板收取吧。');
        if (results.some(x => !x))
            this.toast('部分图片未加载，返回后可重试。');
        game.on(Game.EVENT_HIDE, this.onHide, this);
        game.on(Game.EVENT_SHOW, this.onShow, this);
    }
    private onHide() { this.paused = true; this.save(); }
    private onShow() { this.paused = false; resume(this.state.economy); this.save(); }
    onDestroy() { game.off(Game.EVENT_HIDE, this.onHide, this); game.off(Game.EVENT_SHOW, this.onShow, this); }
    private save() { try {
        this.state.economy.stock.wood = this.state.wood;
        if(!valid(this.state)){this.toast('当前数据校验未通过，上一份存档已保留。');return;}
        const next = JSON.stringify(this.state);
        const old = sys.localStorage.getItem(SAVE_KEY);
        if (load(old))
            sys.localStorage.setItem(SAVE_KEY + '.backup', old);
        sys.localStorage.setItem(SAVE_KEY, next);
        this.dirty = false;
    }
    catch {
        this.toast('存档空间不足，请保持游戏打开。');
    } }
    private nodeAt(name: string, parent: Node, x = 0, y = 0) { const n = new Node(name); n.layer = Layers.Enum.UI_2D; n.setPosition(x, y); parent.addChild(n); return n; }
    private box(parent: Node, x: number, y: number, w: number, h: number, color: string, r = 10) { const n = this.nodeAt('Panel', parent, x, y); n.addComponent(UITransform).setContentSize(w, h); const g = n.addComponent(Graphics); g.fillColor = new Color().fromHEX(color); g.roundRect(-w / 2, -h / 2, w, h, r); g.fill(); return n; }
    private label(parent: Node, str: string, x: number, y: number, size = 16, color = PAPER, width = 360) { const n = this.nodeAt('Text', parent, x, y); n.addComponent(UITransform).setContentSize(width, 50); const l = n.addComponent(Label); l.string = str; l.fontSize = size; l.lineHeight = size * 1.35; l.color = new Color().fromHEX(color); l.horizontalAlign = Label.HorizontalAlign.CENTER; l.verticalAlign = Label.VerticalAlign.CENTER; l.overflow = Label.Overflow.SHRINK; l.enableWrapText = true; return l; }
    private sprite(parent: Node, key: string, x: number, y: number, w: number, h: number) { const n = this.nodeAt(key, parent, x, y); const f = this.frames[key]; n.addComponent(UITransform); if (f) {
        const size = f.originalSize, k = Math.min(w / size.width, h / size.height);
        const s = n.addComponent(Sprite);
        s.sizeMode = Sprite.SizeMode.CUSTOM;
        s.spriteFrame = f;
        n.getComponent(UITransform)!.setContentSize(size.width * k, size.height * k);
    } return n; }
    private button(parent: Node, str: string, x: number, y: number, w: number, fn: () => void, secondary = false) { const n = this.box(parent, x, y, w, 42, secondary ? '#e7eee0' : GOLD); this.label(n, str, 0, 0, 14, INK, w - 14); n.on(Node.EventType.TOUCH_END, (e: EventTouch) => { e.propagationStopped = true; fn(); }); return n; }
    private toast(message: string) { if (this.toastNode?.isValid)
        this.toastNode.destroy(); this.toastNode = this.box(this.root, 0, -270, 354, 70, PAPER); this.label(this.toastNode, message, 0, 0, 14, INK, 326); const n = this.toastNode; this.scheduleOnce(() => { if (n.isValid)
        n.destroy(); }, 4); }
    private render() {
        this.economyLabels = [];this.actors=[];
        if (this.screen?.isValid)
            this.screen.destroy();
        this.floaters = [];
        this.boat = null;
        this.coast = null;
        this.status = null;
        this.screen = this.nodeAt('VoyageScreen', this.root);
        this.sprite(this.screen, 'ocean', 0, 0, 1000, 1100);
        this.box(this.screen, 0, 365, 370, 92, '#123e4a');
        this.label(this.screen, '这片海我包了', 0, 384, 23);
        this.label(this.screen, '大航海时代 · 海上怪人家园', 0, 354, 12, '#b8dcd6');
        if (this.state.phase === 'home')
            this.home();
        else
            this.journey();
        this.save();
    }
    private roomKey(f:number,j:number){
        if(this.state.homeLife.swapped.includes(f))j=1-j;
        if(f===1&&j===0&&this.state.keepsakes.includes('jibo'))return 'sky1';
        return f>=2?'sky'+((f-2)*2+j)%7:'room'+(f*2+j);
    }
    private person(key:string){return key==='crewAuthor'?'author':key==='crewBoss'?'boss':key==='crewWire'?'wire':'tank';}
    /** Layered timber framing keeps the house readable at room and voyage scales. */
    private beam(parent: Node, x: number, y: number, w: number, h: number, vertical = false) {
        const n = this.box(parent,x,y,w,h,'#3b241c',2);
        this.box(n,-1,1,w-3,h-3,'#865338',1);
        this.box(n,vertical?-w/2+2:0,vertical?0:h/2-2,vertical?2:w-5,vertical?h-5:2,'#c49360',0);
        const g=this.nodeAt('WoodGrain',n).addComponent(Graphics);g.strokeColor=new Color().fromHEX('#593723');g.lineWidth=.7;
        for(let i=0;i<3;i++){const offset=(i-1)*2;if(vertical){g.moveTo(offset,-h/2+5);g.bezierCurveTo(offset+2,-h/5,offset-2,h/5,offset,h/2-5);}else{g.moveTo(-w/2+5,offset);g.bezierCurveTo(-w/5,offset+2,w/5,offset-2,w/2-5,offset);}g.stroke();}
        for(const sign of [-1,1]){g.fillColor=new Color().fromHEX('#252c29');g.circle(vertical?0:sign*(w/2-7),vertical?sign*(h/2-7):0,1.3);g.fill();}
        return n;
    }
    private buildBoat(parent: Node, scale: number, x = 0, y = 0) {
        const n=this.nodeAt('SharkHouse',parent,x,y);n.setScale(scale,scale,1);
        this.sprite(n,'shark',0,-64,332,158);
        // Deck, metal saddle and angled knees visually connect the house to the shark.
        this.box(n,0,-15,226,23,'#37413d',3);
        for(const x of [-112,112]){const knee=this.beam(n,x,-8,10,42,true);knee.setRotationFromEuler(0,0,x<0?-24:24);}
        for(let i=0;i<9;i++)this.beam(n,-132+i*33,1,34,15);
        this.beam(n,0,-7,310,10);
        for(let f=0;f<this.state.floors;f++){
            const floor=this.nodeAt('Floor-'+(f+1),n,0,58+f*FLOOR_HEIGHT);
            this.box(floor,0,0,292,104,'#302b24',1);
            for(let j=0;j<2;j++){
                const rx=j?72:-72;
                this.box(floor,rx,0,137,96,'#564535',0);
                this.sprite(floor,this.roomKey(f,j),rx,-1,142,106);
                const art=this.roomKey(f,j),info=art.startsWith('sky')?SKY_ROOMS[Number(art.slice(3))]:null;
                const actor=this.sprite(floor,info?this.person(info.who):f===0?(j?'tank':'wire'):'boss',rx+23,-17,37,52);this.actors.push(actor);
                const hit=this.nodeAt('RoomTouch',floor,rx,0);hit.addComponent(UITransform).setContentSize(137,96);
                let startY=0,moved=false;
                hit.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{startY=e.getUILocation().y;moved=false;});
                hit.on(Node.EventType.TOUCH_MOVE,(e:EventTouch)=>{moved=moved||Math.abs(startY-e.getUILocation().y)>10;});
                hit.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{if(this.state.phase==='home'&&!moved&&Math.abs(startY-e.getUILocation().y)<12)this.room(f,j);});
            }
            for(const px of [-146,0,146])this.beam(floor,px,0,8,104,true);
            this.box(floor,0,-45,298,5,'#261f19',0);
            this.beam(floor,0,-51,306,12);
            this.box(floor,0,-58,308,3,'#35291f',0);
            // Small brass corner plates, brackets and a floor plaque replace flat green strips.
            for(const px of [-138,138]){const bracket=this.beam(floor,px,36,5,24,true);bracket.setRotationFromEuler(0,0,px<0?-40:40);this.box(floor,px,-50,8,7,'#9e8960',1);}
            const plaque=this.box(floor,0,-51,21,11,'#342d24',2);this.label(plaque,String(f+1)+'F',0,0,7,'#e4bd79',19);
        }
        const top=this.state.floors*FLOOR_HEIGHT+8;
        const roof=this.nodeAt('TiledRoof',n,0,top),g=roof.addComponent(Graphics);
        g.fillColor=new Color().fromHEX('#2f241c');g.moveTo(-163,-4);g.lineTo(-125,42);g.lineTo(125,42);g.lineTo(163,-4);g.close();g.fill();
        // Staggered terracotta shingles follow the pitched silhouette.
        for(let row=0;row<4;row++){
            const yy=row*9,edge=155-row*8;
            for(let xx=-edge;xx<edge;xx+=24){const ww=Math.min(23,edge-xx);g.fillColor=new Color().fromHEX(['#865437','#a46c45','#92603e','#b17d50'][(row+Math.floor((xx+160)/24))%4]);g.roundRect(xx,yy,ww,9,1.2);g.fill();g.strokeColor=new Color().fromHEX('#422c23');g.lineWidth=1;g.stroke();}
        }
        this.beam(roof,0,40,253,7);this.beam(roof,0,-5,326,9);
        // A small chimney and brass rain gutters give the silhouette a lived-in nautical character.
        this.box(roof,94,49,21,32,'#514d43',2);this.box(roof,94,66,29,7,'#b29366',2);
        for(const px of [-151,151]){this.beam(n,px,top-12,7,28,true);const lamp=this.nodeAt('PorchLantern',n,px,top-30);const l=lamp.addComponent(Graphics);l.fillColor=new Color(255,205,100,35);l.circle(0,0,15);l.fill();this.box(lamp,0,0,7,13,'#f7c96f',2);this.box(lamp,0,8,10,3,'#4a3925',1);}
        if(this.state.keepsakes.includes('jibo')){const flag=this.box(n,117,136,43,20,'#344c48',2);this.label(flag,'基博岛赠',0,0,7,'#efcc83',40);}
        if(this.state.keepsakes.includes('sail'))this.label(n,'⚑',70,top+66,55);
        return n;
    }
    private home() {
        if(this.deckView){this.productionScene();return;}
        const scale = this.overview ? Math.min(.9, 400 / (this.state.floors * FLOOR_HEIGHT + 180)) : CLOSE_SCALE;
        this.boat = this.buildBoat(this.screen, scale, 0, this.overview ? -115 : CLOSE_BASE - this.floor * FLOOR_HEIGHT * CLOSE_SCALE);
        const touch = this.boat;
        let start = 0, old = 0, moved = false;
        touch.addComponent(UITransform).setContentSize(310, this.state.floors * FLOOR_HEIGHT + 180);
        touch.on(Node.EventType.TOUCH_START, (e: EventTouch) => { start = e.getUILocation().y; old = touch.position.y; moved = false; });
        touch.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => { if (this.overview)
            return; const d = e.getUILocation().y - start; moved = moved || Math.abs(d) > 10; if (moved)
            touch.setPosition(0, Math.max(235 - (this.state.floors * FLOOR_HEIGHT + 78) * CLOSE_SCALE, Math.min(CLOSE_BASE, old + d)), 0); });
        touch.on(Node.EventType.TOUCH_END, () => { this.floor = Math.max(0, (CLOSE_BASE - touch.position.y) / (FLOOR_HEIGHT * CLOSE_SCALE)); });
        this.homeHud();
    }
    private homeHud(){
        this.box(this.screen,0,365,390,112,'#163f49',8).addComponent(BlockInputEvents);
        this.label(this.screen,'这片海我包了',-88,398,19,PAPER,185);
        const money=this.label(this.screen,'',112,398,12,GOLD,140);
        const entries=[['wood','木材'],['metal','金属'],['water','淡水'],['fish','鱼类']];
        entries.forEach(([key,title],i)=>{const x=-138+i*92;this.box(this.screen,x,352,85,48,'#285460',8);const amount=this.label(this.screen,'',x,361,17,PAPER,80);this.label(this.screen,title,x,339,10,'#b7d9d3',80);this.economyLabels.push(()=>{if(amount.isValid)amount.string=String(key==='wood'?this.state.wood:this.state.economy.stock[key as 'metal'|'water'|'fish']);});});
        const hint=this.label(this.screen,'',0,292,12,PAPER,370);
        this.economyLabels.push(()=>{if(!hint.isValid)return;money.string='金币 '+this.state.economy.stock.coins+' · 纪念 '+this.state.stamp;hint.string=this.deckView?'点击设备收取 / 投料 · 电力 '+Math.ceil(this.state.economy.fuel)+' 秒':'上下拖动看楼层 · 点击房间找住户玩';});
        this.economyLabels.forEach(fn=>fn());
        this.box(this.screen,0,-327,390,190,'#173f48',10).addComponent(BlockInputEvents);
        this.button(this.screen,this.deckView?'设备管理':this.overview?'返回近景':'整栋看看',-120,-264,112,()=>{if(this.deckView)this.workshop();else{this.overview=!this.overview;this.render();}},true);
        this.button(this.screen,'扩建海楼',0,-264,112,()=>{if(expand(this.state)){this.deckView=false;this.floor=Math.max(0,(CLOSE_BASE-235+(this.state.floors*FLOOR_HEIGHT+78)*CLOSE_SCALE)/(FLOOR_HEIGHT*CLOSE_SCALE));this.render();this.toast('新楼层落成！');}else this.toast(this.state.floors>=8?'当前支持八层海楼。':'需要20木材；六层起还需要2建材。');},true);
        this.button(this.screen,this.deckView?'卷姨开饭':'左右换位',120,-264,112,()=>{if(this.deckView){if(deliver(this.state.economy)){this.save();this.toast('卷姨敲锅：开饭！金币 +20。');}else this.toast('供餐需要4份淡水和2条鱼。');return;}const f=Math.min(this.state.floors-1,this.selectedFloor),arr=this.state.homeLife.swapped;this.state.homeLife.swapped=arr.includes(f)?arr.filter(x=>x!==f):[...arr,f];this.render();this.toast('第'+(f+1)+'层左右房间已换位。先点房间可选择楼层。');},true);
        this.button(this.screen,this.deckView?'回到海楼':'设备甲板',-91,-317,170,()=>{this.deckView=!this.deckView;this.render();});
        this.button(this.screen,'海图 · 基博岛',91,-317,170,()=>this.chart());
        this.button(this.screen,'打捞材料',-91,-369,170,()=>{this.state.economy.stock.wood=this.state.wood;if(!salvage(this.state.economy)){this.toast('渔网正在回收，稍等一下。');return;}this.state.wood=this.state.economy.stock.wood;this.save();this.toast('打捞上岸：木材 +5，金属 +2。');},true);
        this.button(this.screen,'一键收取',91,-369,170,()=>{let total=0;for(const id of Object.keys(MACHINES) as Machine[])total+=collect(this.state.economy,id);this.save();this.render();this.toast(total?'收取了 '+total+' 份产物！':'设备还在忙，产物完成后再来。');},true);
        const foot=this.label(this.screen,'',0,-405,11,'#b7d9d3');const updateFoot=()=>{if(foot.isValid)foot.string=this.deckView?'设备在航行时也会继续工作':'已选 '+(this.selectedFloor+1)+'F · 房间小事 '+this.state.homeLife.seen.length+'/7 · 点击房间选择';};this.economyLabels.push(updateFoot);updateFoot();
    }
    private productionScene(){
        this.sprite(this.screen,'shark',0,-186,350,155);
        for(const x of [-174,174]){this.beam(this.screen,x,42,8,430,true);this.box(this.screen,x+3,42,2,428,'#b59b68',0);}
        for(const y of [125,-20,-165])this.beam(this.screen,0,y,358,10);
        const ids=Object.keys(MACHINES) as Machine[];
        ids.forEach((id,index)=>{
            const x=index%2?91:-91,y=171-Math.floor(index/2)*145,d=this.state.economy.devices[id],def=MACHINES[id];
            const dock=this.nodeAt('Device-'+id,this.screen,x,y);
            this.beam(dock,0,-46,163,12);for(const px of [-71,71])this.beam(dock,px,-58,7,25,true);
            const machine=this.sprite(dock,id,0,16,112,111);
            if(!d.level)machine.addComponent(UIOpacity).opacity=110;
            if(d.level&&id!=='eel'&&(d.working||id==='filter'||id==='fishery')&&d.pending<def.cap*d.level)tween(machine).to(.9,{scale:new Vec3(1.025,1.025,1)}).to(.9,{scale:new Vec3(1,1,1)}).union().repeatForever().start();
            const tag=this.box(dock,0,-64,160,33,'#244b53',6);const label=this.label(tag,'',0,0,11,PAPER,155);
            this.economyLabels.push(()=>{if(label.isValid)label.string=def.name+'\n'+(!d.level?'待建造':id==='eel'?'投喂 · '+Math.ceil(this.state.economy.fuel)+'秒电力':d.pending?'可收取 '+d.pending:d.working||id==='filter'||id==='fishery'?'生产中 '+Math.floor(d.progress)+'/'+def.seconds+'秒':'点击投料');});
            const hit=this.nodeAt('DeviceTouch',dock);hit.addComponent(UITransform).setContentSize(160,130);hit.on(Node.EventType.TOUCH_END,(ev:EventTouch)=>{ev.propagationStopped=true;if(!d.level){this.device(id);return;}resume(this.state.economy);const count=collect(this.state.economy,id);let message='';if(count)message='收取 '+count+' 份产物！';else if(id==='eel')message=feed(this.state.economy)?'滋——电鳗来电了！':'投喂需要2条鱼，或电鳗已吃饱。';else if(id==='filter'||id==='fishery')message='正在自动生产，很快就好。';else message=batch(this.state.economy,id)?'开工！材料已经送进去了。':'投料需要 '+costText(def.recipe)+'，请确认上一批已完成。';this.save();this.render();this.toast(message);});
        });
        [['tank',-135],['boss',0],['wire',135]].forEach(([key,x],i)=>{const actor=this.sprite(this.screen,String(key),Number(x),-211,52,65);actor.on(Node.EventType.TOUCH_END,()=>{tween(actor).by(.16,{position:new Vec3(0,8,0)}).by(.16,{position:new Vec3(0,-8,0)}).start();this.toast(VIGNETTES[i][1]);});});
        this.homeHud();
    }
    private workshop() {
        const overlay = this.box(this.screen, 0, 0, 380, 800, PAPER);
        overlay.addComponent(BlockInputEvents);
        const e = this.state.economy;
        e.stock.wood = this.state.wood;
        this.label(overlay, '海楼设备甲板', 0, 365, 23, INK);
        const stock = this.label(overlay, '', 0, 320, 13, INK, 350);
        const refresh = () => { if (!overlay.isValid)
            return; stock.string = `木 ${this.state.wood} · 金属 ${e.stock.metal} · 金币 ${e.stock.coins}\n水 ${e.stock.water} · 鱼 ${e.stock.fish} · 氧 ${e.stock.oxygen} · 树脂 ${e.stock.resin} · 建材 ${e.stock.mortar}`; };
        this.economyLabels = [refresh];
        refresh();
        const update = () => { this.state.wood = e.stock.wood; this.save(); overlay.destroy(); this.workshop(); };
        (Object.keys(MACHINES) as Machine[]).forEach((id, index) => {
            const def = MACHINES[id], d = e.devices[id], y = 242 - index * 72;
            this.box(overlay, 0, y, 354, 65, '#e5e8d7');
            this.sprite(overlay, id, -143, y, 58, 60);
            const label = this.label(overlay, '', -28, y + 12, 12, INK, 163);
            const refreshRow = () => { if (!label.isValid)
                return; label.string = def.name + ' ' + (d.level ? 'Lv.' + d.level : '待建造') + '\n' + (!d.level ? '点击查看建造条件' : id === 'eel' ? '供电剩余 ' + Math.ceil(e.fuel) + ' 秒' : d.pending ? '待收取 ' + d.pending : d.working || id === 'filter' || id === 'fishery' ? '生产中 ' + Math.floor(d.progress) + '/' + def.seconds + ' 秒' : '等待投料'); };
            this.economyLabels.push(refreshRow);
            refreshRow();
            this.button(overlay, '操作', 123, y, 84, () => { overlay.destroy(); this.device(id); }, true);
        });
        this.label(overlay, '过滤器和渔场自动生产；其他设备每次投料一批。', 0, -211, 12, INK);
        this.button(overlay, '供餐 · 4水 + 2鱼 → 20金币', 0, -255, 342, () => { e.stock.wood = this.state.wood; if (!deliver(e)) {
            this.toast('先收取4份淡水和2条鱼。');
            return;
        } update(); this.toast('卷姨开饭了！金币 +20。'); });
        this.label(overlay, '电鳗供电让设备加速；离线最多计算4小时，满仓停产。', 0, -301, 11, INK);
        this.button(overlay, '返回海楼', 0, -355, 342, () => this.render(), true);
    }
    private device(id: Machine) {
        this.economyLabels = [];
        const e = this.state.economy, d = e.devices[id], def = MACHINES[id];
        e.stock.wood = this.state.wood;
        const panel = this.box(this.screen, 0, 0, 374, 720, PAPER);
        panel.addComponent(BlockInputEvents);
        this.label(panel, def.name + (d.level ? ' · Lv.' + d.level : ''), 0, 320, 23, INK);
        this.sprite(panel, id, 0, 190, 200, 180);
        const detail = this.label(panel, '', 0, 53, 15, INK, 335);
        this.economyLabels = [() => { if (detail.isValid)
                detail.string = !d.level ? '建造后加入海楼生产' : id === 'eel' ? '投喂2条鱼，供电' + 180 * d.level + '秒\n剩余 ' + Math.ceil(e.fuel) + ' 秒' : `库存 ${d.pending}/${def.cap * d.level} · 进度 ${Math.floor(d.progress)}/${def.seconds} 秒\n` + (id === 'filter' || id === 'fishery' ? '自动生产，满仓后暂停' : costText(def.recipe) + ' → ' + def.amount * d.level + '份产物'); }];
        this.economyLabels[0]();
        const act = (fn: () => boolean, message: string) => { resume(e); e.stock.wood = this.state.wood; if (fn()) {
            this.state.wood = e.stock.wood;
            this.save();
            panel.destroy();
            this.device(id);
            this.toast(message);
        }
        else
            this.toast('条件未满足：检查材料、库存或正在生产的批次。'); };
        if (d.level) {
            this.button(panel, id === 'eel' ? '投喂 · 2条鱼' : '收取产物', 0, -35, 330, () => act(() => id === 'eel' ? feed(e) : collect(e, id) > 0, id === 'eel' ? '电鳗精神了！设备以双倍速度生产。' : '产物已收入仓库。'));
            if (id !== 'eel' && id !== 'filter' && id !== 'fishery')
                this.button(panel, '投料开工 · ' + costText(def.recipe), 0, -94, 330, () => act(() => batch(e, id), '开工！可以去航行，设备会继续生产。'));
        }
        this.button(panel, d.level >= 3 ? '已达最高等级' : (d.level ? '升级' : '建造') + ' · ' + costText(upgradeCost(e, id)), 0, -163, 330, () => act(() => upgrade(e, id), '设备准备好了！'), true);
        this.label(panel, id === 'eel' ? '升级延长每次投喂的供电时长。\n最高三级，最多储存900秒电力。' : '升级前请收空产物并等待批次结束。\n升级提高产量和容量，最高三级。', 0, -222, 12, INK);
        this.button(panel, '返回设备甲板', 0, -300, 330, () => { this.deckView=true;this.render(); }, true);
    }
    private room(f:number,j:number){
        this.selectedFloor=f;const key=this.roomKey(f,j),info=key.startsWith('sky')?SKY_ROOMS[Number(key.slice(3))]:null;
        this.state.roomPlays++;
        if(info&&!this.state.homeLife.seen.includes(key))this.state.homeLife.seen.push(key);
        const actor=this.actors[f*2+j];if(actor?.isValid){Tween.stopAllByTarget(actor);const base=actor.position.clone();tween(actor).to(.18,{position:new Vec3(base.x-6,base.y+10,0)}).to(.22,{position:base}).start();const fx=this.label(actor.parent!,'✦',actor.position.x,actor.position.y+35,25,GOLD).node;tween(fx).by(.8,{position:new Vec3(0,28,0)}).call(()=>fx.destroy()).start();}
        this.save();this.toast(info?info.reply:VIGNETTES[(f*2+j)%VIGNETTES.length][1]);
    }
    private chart() {
        const overlay = this.box(this.screen, 0, 0, 374, 575, PAPER);
        overlay.addComponent(BlockInputEvents);
        this.label(overlay, '大航海 · 近海航线', 0, 245, 23, INK);
        this.label(overlay, '已发现的岛屿，随时欢迎回来', 0, 211, 13, INK);
        ISLANDS.forEach((i, k) => { const y = 132 - k * 130; this.box(overlay, 0, y, 338, 110, k === 0 ? '#dfe7cb' : '#e5e2d5'); this.label(overlay, i.name, 0, y + 28, 20, INK); this.label(overlay, k === 0 ? '岛主在码头等你 · ' + this.state.progress[i.id] + '/3 件小事' : '后续航线 · 场景制作中', 0, y - 1, 12, INK); this.button(overlay, k === 0 ? (this.state.progress.jibo === 3 ? '回访基博岛' : '前往基博岛') : '尚未开放', 0, y - 33, 294, () => { if (k !== 0) {
            this.toast('先把基博岛航线打磨好，新岛随后开放。');
            return;
        } if (depart(this.state, i.id)) {
            this.render();
        } }, k !== 0); });
        this.button(overlay, '返回海楼', 0, -245, 310, () => overlay.destroy(), true);
    }
    private journey() {
        const i = island(this.state)!;
        const docked = this.state.phase === 'docked';
        this.label(this.screen, docked ? i.name : this.state.phase === 'leaving' ? '告别 ' + i.name : '前往 ' + i.name, 0, 292, 23);
        this.status = this.label(this.screen, docked ? (this.state.progress[i.id] === 3 ? '老朋友，欢迎回来 · 随便逛逛' : '下一站 · ' + i.spots[this.state.progress[i.id]]) : '扬帆，海楼出发！', 0, 260, 13);
        this.coast = this.nodeAt('Island', this.screen, 45, 22);
        this.sprite(this.coast, 'island', 0, 0, 295, 455);
        if (docked) {
            this.sprite(this.coast, 'chief', 12, 40, 65, 90);
            [[12, 140], [-62, 22], [75, 0]].forEach(([x, y], spot) => { this.button(this.coast!, i.spots[spot], x, y, spot === 0 ? 110 : 90, () => { const r = interact(this.state, spot); this.save(); if (r.ok) {
                this.render();
                const sparkle = this.label(this.coast!, '✦', x, y + 30, 30, GOLD).node;
                tween(sparkle).by(.7, { position: new Vec3(0, 35, 0) }).call(() => sparkle.destroy()).start();
            } this.toast(r.line); if (this.status)
                this.status.string = this.state.progress[i.id] === 3 ? '岛民记住你了 · 已获得' + i.reward : '岛上小事 ' + this.state.progress[i.id] + '/3 · 下一站 ' + i.spots[this.state.progress[i.id]]; }, this.state.progress[i.id] !== spot); });
            const bridge = this.box(this.screen, -60, -130, 130, 18, '#c49d67', 2);
            bridge.setRotationFromEuler(0, 0, 15);
        }
        for (let k = 0; k < 4; k++) {
            const wave = this.label(this.screen, '～', -163 + k * 18, -183 - k * 4, 28, '#b3ece3').node;
            this.floaters.push(wave);
        }
        this.boat = this.buildBoat(this.screen, .32, -120, -150);
        this.box(this.screen, 0, -330, 390, 184, '#123e4a', 0);
        if (docked) {
            (Object.entries(ISLAND_TOYS) as [keyof typeof ISLAND_TOYS,typeof ISLAND_TOYS.post][]).forEach(([key,toy],idx)=>{this.button(this.screen,toy.name,idx%2?91:-91,-252-Math.floor(idx/2)*45,170,()=>{const n=this.state.homeLife.toys[key]||0;this.state.homeLife.toys[key]=n+1;this.save();this.toast(toy.lines[n%toy.lines.length]);},true);});
            this.button(this.screen, '解缆 · 继续航行', 0, -357, 352, () => { if (leave(this.state))
                this.render(); });
            this.label(this.screen, '旅行纪念会留在你的海楼上', 0, -404, 13, '#b9d8cf');
        }
        else {
            this.label(this.screen, '海风、船尾浪花、下一座岛的灯火', 0, -275, 14);
            this.button(this.screen, '靠窗看海 · 航行中', 0, -331, 352, () => this.toast('鲨鱼正在自动驾驶，放心看风景。'), true);
        }
    }
    update(dt: number) {
        if (!this.screen || this.paused)
            return;
        this.time += dt;
        this.saveClock += dt;
        this.economyClock += dt;
        if (this.economyClock >= .5) {
            this.economyClock = 0;
            resume(this.state.economy);
            this.economyLabels.forEach(fn => fn());
            this.dirty = true;
        }
        this.floaters.forEach((n, k) => { if (n.isValid)
            n.setPosition(-163 + k * 18 + Math.sin(this.time * 2 + k) * 6, -183 - k * 4, 0); });
        const previous = this.state.phase;
        if (advance(this.state, dt)) {
            this.render();
            return;
        }
        if (previous !== 'home' && previous !== 'docked') {
            if (this.boat) {
                const p = this.state.elapsed;
                const x = previous === 'sailing' ? -125 + Math.sin(this.time) * 3 : previous === 'approaching' ? -125 + 5 * p / 4 : -120 - 240 * p / 3;
                this.boat.setPosition(x, -150 + Math.sin(this.time * 1.7) * 3, 0);
            }
            if (this.coast)
                this.coast.setPosition(previous === 'sailing' ? 470 - this.state.elapsed * 30 : previous === 'approaching' ? 230 - 185 * this.state.elapsed / 4 : 45, 22, 0);
            if (this.status)
                this.status.string = previous === 'sailing' ? '海楼航行中 · ' + Math.max(0, Math.ceil(8 - this.state.elapsed)) + '秒后见到岛屿' : previous === 'approaching' ? '减速靠岸 · 缆绳和跳板准备好了' : '收起跳板 · 下次还来';
            if (this.saveClock > 1) {
                this.saveClock = 0;
                this.save();
            }
        }
        else if (this.dirty && this.saveClock > 2) {
            this.saveClock = 0;
            this.save();
        }
    }
}
