import type { PlotState } from './types'

/** 作物 id → emoji（与后端 cropId 一致） */
export const CROP_EMOJI: Record<string, string> = {
  wheat: '🌾',
  carrot: '🥕',
  corn: '🌽',
  tomato: '🍅',
  watermelon: '🍉',
}

/** 物品 id → emoji */
export const ITEM_EMOJI: Record<string, string> = {
  seed_wheat: '🌾',
  seed_carrot: '🥕',
  seed_corn: '🌽',
  seed_tomato: '🍅',
  seed_watermelon: '🍉',
  crop_wheat: '🌾',
  crop_carrot: '🥕',
  crop_corn: '🌽',
  crop_tomato: '🍅',
  crop_watermelon: '🍉',
  fertilizer_normal: '🧪',
  fertilizer_advanced: '✨',
  prop_stamina_potion: '🧃',
  decoration_fence: '🪵',
}

export const PLOT_STATE_EMOJI: Record<PlotState, string> = {
  locked: '🔒',
  wasteland: '🪨',
  tilled: '🟫',
  growing: '🌱',
  mature: '✨',
}

export const NAV_EMOJI: Record<string, string> = {
  farm: '🌾',
  inventory: '🎒',
  shop: '🏪',
  tasks: '📋',
  profile: '🐻',
}

export const INV_CAT_EMOJI: Record<string, string> = {
  crop: '🧺',
  seed: '🌰',
  fertilizer: '🧪',
  decoration: '🎀',
  prop: '🧃',
  other: '📦',
}

export const SHOP_CAT_EMOJI: Record<string, string> = {
  seed: '🌱',
  fertilizer: '🧪',
  prop: '🧃',
  decoration: '🏡',
}

export const TASK_EMOJI: Record<string, string> = {
  daily_login: '🌅',
  daily_water_3: '💧',
  daily_harvest_5: '🧺',
  daily_sell_10: '💰',
  growth_level_3: '⭐',
}

export function cropEmoji(cropId: string | null | undefined): string {
  if (!cropId) return '🌱'
  return CROP_EMOJI[cropId] ?? '🌿'
}

export function itemEmoji(itemId: string): string {
  return ITEM_EMOJI[itemId] ?? '📦'
}

export function plotCellEmoji(state: PlotState, cropId: string | null): string {
  if (state === 'growing' || state === 'mature') return cropEmoji(cropId)
  return PLOT_STATE_EMOJI[state]
}
