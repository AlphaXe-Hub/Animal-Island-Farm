import type { HydratedDocument } from 'mongoose';
import type { UserDoc } from '../models/User.js';
import { expForNextLevel } from '../gameConfig.js';
import { applyPlotLocks, syncPlotMaturity } from '../services/plotService.js';
import {
  ensureDailyTaskReset,
  ensureSignInWeek,
  bumpTask,
  getTaskProgress,
} from '../services/taskService.js';

export function grantExp(user: HydratedDocument<UserDoc>, delta: number): void {
  user.exp += delta;
  while (user.exp >= expForNextLevel(user.level)) {
    user.exp -= expForNextLevel(user.level);
    user.level += 1;
  }
}

export function prepareUserForApi(user: HydratedDocument<UserDoc>): void {
  ensureDailyTaskReset(user);
  ensureSignInWeek(user);
  syncPlotMaturity(user);
  applyPlotLocks(user);
  if (getTaskProgress(user, 'daily_login') < 1) {
    bumpTask(user, 'daily_login', 1);
  }
}

export function userToJson(user: HydratedDocument<UserDoc>) {
  prepareUserForApi(user);
  const taskProgress: Record<string, number> = {
    ...((user.taskProgress as Record<string, number> | undefined) ?? {}),
  };
  return {
    id: user._id.toString(),
    username: user.username ?? null,
    isGuest: user.isGuest,
    nickname: user.nickname,
    level: user.level,
    exp: user.exp,
    expToNext: expForNextLevel(user.level),
    coins: user.coins,
    diamonds: user.diamonds,
    stamina: user.stamina,
    soundOn: user.soundOn,
    farmPlots: user.farmPlots.map((p) => ({
      index: p.index,
      state: p.state,
      cropId: p.cropId,
      plantedAt: p.plantedAt ? new Date(p.plantedAt).toISOString() : null,
      matureAt: p.matureAt ? new Date(p.matureAt).toISOString() : null,
      wateredTimes: p.wateredTimes,
      yieldMul: p.yieldMul,
      fertilizerUsed: p.fertilizerUsed ?? 'none',
    })),
    inventory: user.inventory.map((i) => ({ itemId: i.itemId, qty: i.qty })),
    taskProgress,
    claimedTasks: [...user.claimedTasks],
    signInWeekKey: user.signInWeekKey,
    signInClaimedDays: [...user.signInClaimedDays],
  };
}
