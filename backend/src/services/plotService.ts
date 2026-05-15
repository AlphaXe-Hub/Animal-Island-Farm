import type { HydratedDocument } from 'mongoose';
import type { UserDoc } from '../models/User.js';
import { CROPS, maxUnlockedPlots, type CropId } from '../gameConfig.js';

export type PlotSub = UserDoc['farmPlots'][number];

export function syncPlotMaturity(user: HydratedDocument<UserDoc>): void {
  const now = Date.now();
  for (const p of user.farmPlots) {
    if (p.state === 'growing' && p.matureAt) {
      const t = new Date(p.matureAt).getTime();
      if (now >= t) {
        p.state = 'mature';
      }
    }
  }
}

export function applyPlotLocks(user: HydratedDocument<UserDoc>): void {
  const max = maxUnlockedPlots(user.level);
  for (const p of user.farmPlots) {
    if (p.index >= max && p.state === 'locked') continue;
    if (p.index >= max && p.state !== 'locked') {
      if (p.state === 'growing' || p.state === 'mature') continue;
      p.state = 'locked';
      p.cropId = null;
      p.plantedAt = null;
      p.matureAt = null;
      p.wateredTimes = 0;
      p.yieldMul = 1;
      p.fertilizerUsed = 'none';
    }
    if (p.index < max && p.state === 'locked') {
      p.state = 'wasteland';
    }
  }
}

export function getCropGrowMs(cropId: string): number {
  const c = CROPS[cropId as CropId];
  if (!c) throw new Error('未知作物');
  return c.growMs;
}

export function findPlot(user: HydratedDocument<UserDoc>, index: number): PlotSub | undefined {
  return user.farmPlots.find((x) => x.index === index);
}
