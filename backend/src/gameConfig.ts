/** 服务端作物与商品配置（与策划案周期档位对齐，数值可后续调参） */

export type CropId =
  | 'wheat'
  | 'carrot'
  | 'corn'
  | 'tomato'
  | 'watermelon';

export interface CropDef {
  id: CropId;
  name: string;
  growMs: number;
  sellPrice: number;
  expOnHarvest: number;
  unlockLevel: number;
  seedItemId: string;
}

export const CROPS: Record<CropId, CropDef> = {
  wheat: {
    id: 'wheat',
    name: '小麦',
    growMs: 5 * 60 * 1000,
    sellPrice: 8,
    expOnHarvest: 3,
    unlockLevel: 1,
    seedItemId: 'seed_wheat',
  },
  carrot: {
    id: 'carrot',
    name: '胡萝卜',
    growMs: 10 * 60 * 1000,
    sellPrice: 14,
    expOnHarvest: 5,
    unlockLevel: 1,
    seedItemId: 'seed_carrot',
  },
  corn: {
    id: 'corn',
    name: '玉米',
    growMs: 30 * 60 * 1000,
    sellPrice: 35,
    expOnHarvest: 12,
    unlockLevel: 3,
    seedItemId: 'seed_corn',
  },
  tomato: {
    id: 'tomato',
    name: '番茄',
    growMs: 60 * 60 * 1000,
    sellPrice: 55,
    expOnHarvest: 18,
    unlockLevel: 3,
    seedItemId: 'seed_tomato',
  },
  watermelon: {
    id: 'watermelon',
    name: '西瓜',
    growMs: 2 * 60 * 60 * 1000,
    sellPrice: 120,
    expOnHarvest: 40,
    unlockLevel: 5,
    seedItemId: 'seed_watermelon',
  },
};

export interface ShopItemDef {
  id: string;
  name: string;
  category: 'seed' | 'fertilizer' | 'prop' | 'decoration';
  priceCoins?: number;
  priceDiamonds?: number;
  /** 关联作物（种子） */
  cropId?: CropId;
  /** 肥料：缩短生长时间比例（与 planted 时 matureAt 重算） */
  speedMul?: number;
  /** 收获产量倍率（高级肥） */
  yieldMul?: number;
  unlockLevel: number;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  {
    id: 'seed_wheat',
    name: '小麦种子',
    category: 'seed',
    priceCoins: 5,
    cropId: 'wheat',
    unlockLevel: 1,
  },
  {
    id: 'seed_carrot',
    name: '胡萝卜种子',
    category: 'seed',
    priceCoins: 10,
    cropId: 'carrot',
    unlockLevel: 1,
  },
  {
    id: 'seed_corn',
    name: '玉米种子',
    category: 'seed',
    priceCoins: 25,
    cropId: 'corn',
    unlockLevel: 3,
  },
  {
    id: 'seed_tomato',
    name: '番茄种子',
    category: 'seed',
    priceCoins: 40,
    cropId: 'tomato',
    unlockLevel: 3,
  },
  {
    id: 'seed_watermelon',
    name: '西瓜种子',
    category: 'seed',
    priceDiamonds: 3,
    cropId: 'watermelon',
    unlockLevel: 5,
  },
  {
    id: 'fertilizer_normal',
    name: '普通肥料',
    category: 'fertilizer',
    priceCoins: 15,
    speedMul: 0.7,
    unlockLevel: 1,
  },
  {
    id: 'fertilizer_advanced',
    name: '高级肥料',
    category: 'fertilizer',
    priceDiamonds: 2,
    speedMul: 0.5,
    yieldMul: 1.2,
    unlockLevel: 3,
  },
  {
    id: 'prop_stamina_potion',
    name: '体力药水',
    category: 'prop',
    priceDiamonds: 1,
    unlockLevel: 1,
  },
  {
    id: 'decoration_fence',
    name: '木栅栏装饰',
    category: 'decoration',
    priceDiamonds: 5,
    unlockLevel: 1,
  },
];

export const TILL_COST_BASE = 15;
export const START_COINS = 100;
export const START_DIAMONDS = 5;
export const START_STAMINA = 30;
export const MAX_STAMINA = 100;
export const EXP_PER_LEVEL = 100;

export function maxUnlockedPlots(level: number): number {
  return Math.min(20, 4 + Math.max(0, level - 1) * 2);
}

export function expForNextLevel(level: number): number {
  return EXP_PER_LEVEL + (level - 1) * 20;
}

export interface TaskDef {
  id: string;
  title: string;
  kind: 'daily' | 'growth';
  target: number;
  rewardCoins: number;
  rewardDiamonds: number;
  rewardExp: number;
}

export const TASKS: TaskDef[] = [
  {
    id: 'daily_login',
    title: '每日登录',
    kind: 'daily',
    target: 1,
    rewardCoins: 20,
    rewardDiamonds: 0,
    rewardExp: 5,
  },
  {
    id: 'daily_water_3',
    title: '浇水 3 次',
    kind: 'daily',
    target: 3,
    rewardCoins: 15,
    rewardDiamonds: 0,
    rewardExp: 8,
  },
  {
    id: 'daily_harvest_5',
    title: '收获 5 次',
    kind: 'daily',
    target: 5,
    rewardCoins: 30,
    rewardDiamonds: 1,
    rewardExp: 10,
  },
  {
    id: 'daily_sell_10',
    title: '出售 10 个农产品',
    kind: 'daily',
    target: 10,
    rewardCoins: 25,
    rewardDiamonds: 0,
    rewardExp: 8,
  },
  {
    id: 'growth_level_3',
    title: '达到 3 级',
    kind: 'growth',
    target: 3,
    rewardCoins: 200,
    rewardDiamonds: 5,
    rewardExp: 0,
  },
];

export const SIGNIN_REWARDS = [
  { day: 1, coins: 10, diamonds: 0 },
  { day: 2, coins: 20, diamonds: 0 },
  { day: 3, coins: 30, diamonds: 1 },
  { day: 4, coins: 40, diamonds: 0 },
  { day: 5, coins: 50, diamonds: 1 },
  { day: 6, coins: 60, diamonds: 2 },
  { day: 7, coins: 100, diamonds: 5 },
];
