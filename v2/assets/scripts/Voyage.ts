import { type Economy, createEconomy, validEconomy } from './Economy.ts';
export type Phase = 'home' | 'sailing' | 'approaching' | 'docked' | 'leaving';
export const ISLANDS = [
    { id: 'jibo', name: '基博岛', subtitle: '一岛烟火，满街怪人', color: '#e6b46e', reward: '海风蒸汽浴室', spots: ['岛务所', '公共澡堂', '怪饮摊'], lines: ['岛主扶正领带：先把大家的热水安排上！', '转动阀门，蒸汽重新钻出澡堂。大婶满意地拍了拍盆。', '岛主递来怪饮：这杯名字很正经，味道就不一定了。'] },
    { id: 'brew', name: '怪饮岛', subtitle: '今天这杯，海也没喝过', color: '#b4c786', reward: '旅行咖啡吧', spots: ['海盐柜台', '摇摇茶壶', '试饮露台'], lines: ['阿昊选了海盐和椰奶：咖啡先别急，让我研究一下。', '摇摇茶壶晃了三下，泡沫开始认真地膨胀。', '岛民眯起眼：第一口很怪，第二口还想来。'] },
    { id: 'sail', name: '风帆岛', subtitle: '风往哪吹，笑话往哪跑', color: '#e8d4ae', reward: '海楼旅行帆', spots: ['风向台', '晾帆架', '送风码头'], lines: ['风向台的旗子指向了三种方向。岛民：今天的风有主见。', '拉紧绳子，整排布帆一起鼓起来，晾着的袜子也有航海梦。', '岛民把小帆送给海楼：遇到顺风，记得回来报个喜。'] }
] as const;
export interface VoyageState {
    schema: 2; homeLife: {seen:string[];swapped:number[];toys:Record<string,number>};
    phase: Phase;
    destination: string | null;
    elapsed: number;
    floors: number;
    wood: number;
    stamp: number;
    progress: Record<string, number>;
    keepsakes: string[];
    roomPlays: number;
    legacyImported: boolean;
    economy: Economy;
}
export const SAVE_KEY = 'zhepianhai.v2.save';
export function fresh(): VoyageState { return { schema: 2, homeLife:{seen:[],swapped:[],toys:{}}, phase: 'home', destination: null, elapsed: 0, floors: 3, wood: 40, stamp: 0, progress: { jibo: 0, brew: 0, sail: 0 }, keepsakes: [], roomPlays: 0, legacyImported: false, economy: createEconomy() }; }
export function island(s: VoyageState) { return ISLANDS.find(i => i.id === s.destination); }
export function depart(s: VoyageState, id: string) { if (s.phase !== 'home' || !ISLANDS.some(i => i.id === id))
    return false; s.phase = 'sailing'; s.destination = id; s.elapsed = 0; return true; }
export function advance(s: VoyageState, dt: number) { if (!Number.isFinite(dt) || dt <= 0)
    return false; const durations = { sailing: 8, approaching: 4, leaving: 3 }; let changed = false; let remaining = Math.min(dt, 30); while (remaining > 0) {
    const duration = durations[s.phase as keyof typeof durations];
    if (!duration)
        break;
    const used = Math.min(remaining, duration - s.elapsed);
    s.elapsed += used;
    remaining -= used;
    if (s.elapsed >= duration) {
        s.phase = s.phase === 'sailing' ? 'approaching' : s.phase === 'approaching' ? 'docked' : 'home';
        s.elapsed = 0;
        changed = true;
    }
} return changed; }
export function interact(s: VoyageState, spot: number) { const i = island(s); if (s.phase !== 'docked' || !i || !Number.isInteger(spot) || spot < 0 || spot > 2)
    return { ok: false, line: '先在码头停稳，再去逛岛。' }; const p = s.progress[i.id]; if (spot > p)
    return { ok: false, line: '先去' + i.spots[p] + '看看，大家正在那里等你。' }; if (spot === p && p < 3) {
    s.progress[i.id]++;
    if (p === 2 && !s.keepsakes.includes(i.id)) {
        s.keepsakes.push(i.id);
        s.stamp++;
        s.wood += 20;
    }
} return { ok: true, line: i.lines[spot] }; }
export function leave(s: VoyageState) { if (s.phase !== 'docked')
    return false; s.phase = 'leaving'; s.elapsed = 0; return true; }
export function expand(s: VoyageState) { if (s.phase !== 'home' || s.floors >= 8 || s.wood < 20)
    return false; if (s.floors >= 5 && s.economy.stock.mortar < 2)
    return false; if (s.floors >= 5)
    s.economy.stock.mortar -= 2; s.wood -= 20; s.economy.stock.wood = s.wood; s.floors++; return true; }
export function valid(s: any): s is VoyageState { return !!s && s.schema === 2 && ['home', 'sailing', 'approaching', 'docked', 'leaving'].includes(s.phase) && (s.destination === null || ISLANDS.some(i => i.id === s.destination)) && (s.phase === 'home' || s.destination !== null) && Number.isFinite(s.elapsed) && s.elapsed >= 0 && s.elapsed < (({ sailing: 8, approaching: 4, leaving: 3 } as Record<string, number>)[s.phase] || 1) && Number.isInteger(s.floors) && s.floors >= 3 && s.floors <= 8 && Number.isInteger(s.wood) && s.wood >= 0 && s.wood <= 1e8 && Number.isInteger(s.stamp) && s.stamp >= 0 && s.stamp <= 3 && s.progress && ISLANDS.every(i => Number.isInteger(s.progress[i.id]) && s.progress[i.id] >= 0 && s.progress[i.id] <= 3) && Array.isArray(s.keepsakes) && new Set(s.keepsakes).size === s.keepsakes.length && s.keepsakes.every((id: string) => ISLANDS.some(i => i.id === id) && s.progress[id] === 3) && ISLANDS.every(i => s.progress[i.id] !== 3 || s.keepsakes.includes(i.id)) && s.stamp === s.keepsakes.length && Number.isInteger(s.roomPlays) && s.roomPlays >= 0 && typeof s.legacyImported === 'boolean' && validEconomy(s.economy) && !!s.homeLife && Array.isArray(s.homeLife.seen) && s.homeLife.seen.every((x:any)=>typeof x==='string'&&/^sky[0-6]$/.test(x)) && new Set(s.homeLife.seen).size===s.homeLife.seen.length && Array.isArray(s.homeLife.swapped) && s.homeLife.swapped.every((n:any)=>Number.isInteger(n)&&n>=0&&n<s.floors) && new Set(s.homeLife.swapped).size===s.homeLife.swapped.length && !!s.homeLife.toys && Object.entries(s.homeLife.toys).every(([k,v])=>['post','garden','well','drying'].includes(k)&&Number.isInteger(v)&&Number(v)>=0); }
export function load(raw: string | null): VoyageState | null { try {
    const s = JSON.parse(raw || 'null');
    if(s&&s.schema===2&&s.homeLife===undefined)s.homeLife={seen:[],swapped:[],toys:{}};
    if (s && s.schema === 2 && s.economy === undefined)
        s.economy = createEconomy();
    return valid(s) ? s : null;
}
catch {
    return null;
} }
// A preview import only. The complete v1 save is preserved separately for the full economy migration.
export function importLegacy(raw: string | null): VoyageState | null { try {
    const envelope = JSON.parse(raw || 'null');
    if (!envelope || typeof envelope.payload !== 'string')
        return null;
    let h = 2166136261;
    for (let i = 0; i < envelope.payload.length; i++) {
        h ^= envelope.payload.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    if ((h >>> 0).toString(16) !== envelope.checksum)
        return null;
    const old = JSON.parse(envelope.payload);
    if (!old || old.version !== 1 || !Array.isArray(old.home?.rooms) || !old.resources || !Number.isFinite(old.resources.wood) || old.resources.wood < 0)
        return null;
    const s = fresh();
    s.wood = Math.min(500, Math.floor(old.resources.wood));
    s.floors = old.tower?.rooms?.includes('rooftop') ? 6 : old.tower?.rooms?.some((r: string) => ['greenhouse', 'hammock'].includes(r)) ? 5 : old.tower?.rooms?.some((r: string) => ['laundry', 'diner'].includes(r)) ? 4 : 3;
    s.legacyImported = true;
    return s;
}
catch {
    return null;
} }
