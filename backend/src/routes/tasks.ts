import type { FastifyInstance } from 'fastify';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import type { UserDoc } from '../models/User.js';
import { UserModel } from '../models/User.js';
import { authPreHandler } from '../plugins/auth.js';
import { TASKS, SIGNIN_REWARDS } from '../gameConfig.js';
import { logTransaction } from '../services/transactionService.js';
import { grantExp, prepareUserForApi, userToJson } from '../services/userPayload.js';
import { getTaskProgress } from '../services/taskService.js';

function taskProgressValue(
  user: HydratedDocument<UserDoc> | null,
  taskId: string,
): number {
  if (!user) return 0;
  if (taskId === 'growth_level_3') {
    return Math.min(user.level, 3);
  }
  return getTaskProgress(user, taskId);
}

export async function registerTasksRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/tasks', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    await user.save();
    const tasks = TASKS.map((t) => {
      const progress = taskProgressValue(user, t.id);
      const claimed = user.claimedTasks.includes(t.id);
      const done = progress >= t.target;
      return { ...t, progress, done, claimed };
    });
    return { tasks };
  });

  app.post('/api/tasks/claim', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const body = req.body as { taskId?: string };
    const taskId = body.taskId;
    if (!taskId) {
      return reply.code(400).send({ error: '缺少 taskId' });
    }
    const def = TASKS.find((t) => t.id === taskId);
    if (!def) {
      return reply.code(400).send({ error: '任务不存在' });
    }
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    if (user.claimedTasks.includes(taskId)) {
      return reply.code(400).send({ error: '已领取' });
    }
    const progress = taskProgressValue(user, taskId);
    if (progress < def.target) {
      return reply.code(400).send({ error: '任务未完成' });
    }
    user.claimedTasks.push(taskId);
    user.coins += def.rewardCoins;
    user.diamonds += def.rewardDiamonds;
    if (def.rewardExp > 0) {
      grantExp(user, def.rewardExp);
    }
    if (def.rewardCoins) {
      await logTransaction(user._id as mongoose.Types.ObjectId, 'coins', def.rewardCoins, 'task_reward', {
        taskId,
      });
    }
    if (def.rewardDiamonds) {
      await logTransaction(
        user._id as mongoose.Types.ObjectId,
        'diamonds',
        def.rewardDiamonds,
        'task_reward',
        { taskId },
      );
    }
    await user.save();
    return userToJson(user);
  });

  app.get('/api/signin', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    await user.save();
    return {
      weekKey: user.signInWeekKey,
      claimedDays: [...user.signInClaimedDays],
      rewards: SIGNIN_REWARDS,
    };
  });

  app.post('/api/signin/claim', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    const claimed = user.signInClaimedDays;
    const nextDay = claimed.length === 0 ? 1 : Math.max(...claimed) + 1;
    if (nextDay > 7) {
      return reply.code(400).send({ error: '本周已签满' });
    }
    if (claimed.includes(nextDay)) {
      return reply.code(400).send({ error: '重复签到' });
    }
    const reward = SIGNIN_REWARDS.find((r) => r.day === nextDay);
    if (!reward) {
      return reply.code(400).send({ error: '奖励配置错误' });
    }
    claimed.push(nextDay);
    user.coins += reward.coins;
    user.diamonds += reward.diamonds;
    await logTransaction(user._id as mongoose.Types.ObjectId, 'coins', reward.coins, 'signin', {
      day: nextDay,
    });
    if (reward.diamonds) {
      await logTransaction(
        user._id as mongoose.Types.ObjectId,
        'diamonds',
        reward.diamonds,
        'signin',
        { day: nextDay },
      );
    }
    await user.save();
    return userToJson(user);
  });
}
