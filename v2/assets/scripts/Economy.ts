/** Engine-independent production rules. Seconds are simulated, timestamps are milliseconds. */
export const NAMES = { wood: '木材', metal: '金属', coins: '金币', water: '淡水', fish: '鱼', oxygen: '氧气', resin: '树脂', mortar: '建材' };
export type Resource = keyof typeof NAMES;
export type Stock = Record<Resource, number>;
export type Cost = Partial<Stock>;
export const MACHINES = {
    filter: { name: '海水过滤器', output: 'water', seconds: 12, amount: 2, cap: 6, cost: { wood: 10, metal: 2 }, recipe: {} },
    fishery: { name: '基础渔场', output: 'fish', seconds: 18, amount: 1, cap: 4, cost: { wood: 12, metal: 3 }, recipe: {} },
    eel: { name: '电鳗发电机', output: 'fish', seconds: 0, amount: 0, cap: 0, cost: { wood: 18, metal: 6, coins: 25 }, recipe: {} },
    puffer: { name: '河豚增氧机', output: 'oxygen', seconds: 20, amount: 3, cap: 9, cost: { wood: 18, metal: 8, coins: 30 }, recipe: { water: 2 } },
    manatee: { name: '海牛化工厂', output: 'resin', seconds: 30, amount: 1, cap: 4, cost: { wood: 28, metal: 12, coins: 55 }, recipe: { oxygen: 2, water: 3 } },
    mixer: { name: '鲨鱼搅拌机', output: 'mortar', seconds: 24, amount: 2, cap: 6, cost: { wood: 24, metal: 14, coins: 45 }, recipe: { resin: 1, metal: 2 } }
} satisfies Record<string, {
    name: string;
    output: Resource;
    seconds: number;
    amount: number;
    cap: number;
    cost: Cost;
    recipe: Cost;
}>;
export type Machine = keyof typeof MACHINES;
export interface Device {
    level: number;
    pending: number;
    progress: number;
    working: boolean;
}
export interface Economy {
    stock: Stock;
    devices: Record<Machine, Device>;
    fuel: number;
    lastAt: number;
    salvageAt: number;
    deliveries: number;
}
export function createEconomy(now = Date.now()): Economy {
    const devices = {} as Economy['devices'];
    for (const key of Object.keys(MACHINES) as Machine[])
        devices[key] = { level: key === 'filter' || key === 'fishery' ? 1 : 0, pending: 0, progress: 0, working: false };
    return { stock: { wood: 0, metal: 18, coins: 60, water: 0, fish: 0, oxygen: 0, resin: 0, mortar: 0 }, devices, fuel: 0, lastAt: now, salvageAt: 0, deliveries: 0 };
}
export function costText(cost: Cost) { return Object.entries(cost).map(([k, v]) => `${v}${NAMES[k as Resource]}`).join(' + '); }
export function afford(e: Economy, cost: Cost) { return Object.entries(cost).every(([k, v]) => e.stock[k as Resource] >= v!); }
export function pay(e: Economy, cost: Cost) { if (!afford(e, cost))
    return false; for (const [k, v] of Object.entries(cost))
    e.stock[k as Resource] -= v!; return true; }
export function upgradeCost(e: Economy, id: Machine): Cost { const level = e.devices[id].level; return level ? { wood: 10 * level, metal: 3 * level, coins: 20 * level } : MACHINES[id].cost; }
export function upgrade(e: Economy, id: Machine) { const d = e.devices[id]; if (d.level >= 3 || d.working || d.pending > 0 || !pay(e, upgradeCost(e, id)))
    return false; d.level++; return true; }
export function batch(e: Economy, id: Machine) { const d = e.devices[id], def = MACHINES[id]; if (!d.level || id === 'eel' || !Object.keys(def.recipe).length || d.working || d.pending + def.amount * d.level > def.cap * d.level || !pay(e, def.recipe))
    return false; d.working = true; d.progress = 0; return true; }
export function collect(e: Economy, id: Machine) { const d = e.devices[id], out = MACHINES[id].output; if (!d.pending)
    return 0; const amount = Math.min(d.pending, 9999 - e.stock[out]); e.stock[out] += amount; d.pending -= amount; return amount; }
export function feed(e: Economy) { if (!e.devices.eel.level || e.fuel + 180 * e.devices.eel.level > 900 || !pay(e, { fish: 2 }))
    return false; e.fuel += 180 * e.devices.eel.level; return true; }
/** Fuel only accelerates the powered portion, including when resuming offline. */
export function tick(e: Economy, seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0)
        return;
    const dt = Math.min(seconds, 14400), powered = Math.min(e.fuel, dt);
    e.fuel = Math.max(0, e.fuel - dt);
    for (const id of Object.keys(MACHINES) as Machine[]) {
        const d = e.devices[id], def = MACHINES[id];
        if (!d.level || id === 'eel')
            continue;
        const automatic = id === 'filter' || id === 'fishery';
        if (!automatic && !d.working)
            continue;
        const work = dt + powered;
        d.progress += work;
        while (d.progress >= def.seconds && d.pending < def.cap * d.level) {
            d.progress -= def.seconds;
            d.pending += def.amount * d.level;
            if (!automatic) {
                d.working = false;
                d.progress = 0;
                break;
            }
        }
        if (d.pending >= def.cap * d.level)
            d.progress = 0;
    }
}
export function resume(e: Economy, now = Date.now()) { if (!Number.isFinite(now) || now <= e.lastAt)
    return 0; const seconds = Math.min(14400, (now - e.lastAt) / 1000); tick(e, seconds); e.lastAt = now; return seconds; }
export function salvage(e: Economy, now = Date.now()) { if (!Number.isFinite(now) || now < e.salvageAt)
    return false; e.salvageAt = now + 3000; e.stock.wood = Math.min(9999, e.stock.wood + 5); e.stock.metal = Math.min(9999, e.stock.metal + 2); return true; }
export function deliver(e: Economy) { if (!pay(e, { water: 4, fish: 2 }))
    return false; e.stock.coins = Math.min(9999, e.stock.coins + 20); e.deliveries++; return true; }
export function validEconomy(e: any): e is Economy { return !!e && Object.keys(NAMES).every(k => Number.isInteger(e.stock?.[k]) && e.stock[k] >= 0 && e.stock[k] <= 9999) && Number.isFinite(e.fuel) && e.fuel >= 0 && e.fuel <= 900 && Number.isFinite(e.lastAt) && e.lastAt >= 0 && Number.isFinite(e.salvageAt) && e.salvageAt >= 0 && Number.isInteger(e.deliveries) && e.deliveries >= 0 && Object.entries(MACHINES).every(([id, def]) => { const d = e.devices?.[id]; return d && Number.isInteger(d.level) && d.level >= 0 && d.level <= 3 && Number.isInteger(d.pending) && d.pending >= 0 && d.pending <= def.cap * d.level && Number.isFinite(d.progress) && d.progress >= 0 && d.progress < Math.max(1, def.seconds) && typeof d.working === 'boolean' && (!d.working || d.level > 0) && (!(id === 'eel' || id === 'filter' || id === 'fishery') || !d.working); }); }
