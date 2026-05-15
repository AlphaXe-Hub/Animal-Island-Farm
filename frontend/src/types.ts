export type PlotState = 'locked' | 'wasteland' | 'tilled' | 'growing' | 'mature'

export interface FarmPlotJson {
  index: number
  state: PlotState
  cropId: string | null
  plantedAt: string | null
  matureAt: string | null
  wateredTimes: number
  yieldMul: number
  fertilizerUsed: 'none' | 'normal' | 'advanced'
}

export interface UserJson {
  id: string
  username: string | null
  isGuest: boolean
  nickname: string
  level: number
  exp: number
  expToNext: number
  coins: number
  diamonds: number
  stamina: number
  soundOn: boolean
  farmPlots: FarmPlotJson[]
  inventory: { itemId: string; qty: number }[]
  taskProgress: Record<string, number>
  claimedTasks: string[]
  signInWeekKey: string
  signInClaimedDays: number[]
}

export interface ShopCatalogItem {
  id: string
  name: string
  category: string
  priceCoins?: number
  priceDiamonds?: number
  unlockLevel: number
  unlocked: boolean
}

export interface TaskRow {
  id: string
  title: string
  kind: string
  target: number
  rewardCoins: number
  rewardDiamonds: number
  rewardExp: number
  progress: number
  done: boolean
  claimed: boolean
}
