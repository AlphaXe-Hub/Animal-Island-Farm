import type { HydratedDocument } from 'mongoose';
import type { UserDoc } from '../models/User.js';
import { TASKS } from '../gameConfig.js';

function taskObj(user: HydratedDocument<UserDoc>): Record<string, number> {
  if (!user.taskProgress || typeof user.taskProgress !== 'object') {
    user.taskProgress = {};
  }
  return user.taskProgress as Record<string, number>;
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoWeekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const yearStart = new Date(Date.UTC(y, 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${y}-W${week}`;
}

export function ensureDailyTaskReset(user: HydratedDocument<UserDoc>): void {
  const today = utcToday();
  if (user.lastTaskResetDate === today) return;
  user.lastTaskResetDate = today;
  const dailyIds = TASKS.filter((t) => t.kind === 'daily').map((t) => t.id);
  user.claimedTasks = user.claimedTasks.filter((id) => !dailyIds.includes(id));
  const o = taskObj(user);
  for (const id of dailyIds) {
    o[id] = 0;
  }
  user.markModified('taskProgress');
}

export function ensureSignInWeek(user: HydratedDocument<UserDoc>): void {
  const wk = isoWeekKey();
  if (user.signInWeekKey === wk) return;
  user.signInWeekKey = wk;
  user.signInClaimedDays = [];
}

export function bumpTask(
  user: HydratedDocument<UserDoc>,
  taskId: string,
  delta = 1,
): void {
  const o = taskObj(user);
  o[taskId] = (o[taskId] ?? 0) + delta;
  user.markModified('taskProgress');
}

export function getTaskProgress(user: HydratedDocument<UserDoc>, taskId: string): number {
  const o = user.taskProgress as Record<string, number> | undefined;
  return o?.[taskId] ?? 0;
}
