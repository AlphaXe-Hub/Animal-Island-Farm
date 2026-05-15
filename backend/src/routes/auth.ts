import type { FastifyInstance } from 'fastify';
import { UserModel, createInitialPlots } from '../models/User.js';
import { hashPassword, verifyPassword, signToken } from '../auth/crypto.js';
import {
  START_COINS,
  START_DIAMONDS,
  START_STAMINA,
} from '../gameConfig.js';

function randomGuestName(): string {
  return `游客${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (req, reply) => {
    const body = req.body as {
      username?: string;
      password?: string;
      nickname?: string;
    };
    const username = body.username?.trim();
    const password = body.password;
    if (!username || !password) {
      return reply.code(400).send({ error: '账号与密码必填' });
    }
    if (username.length < 3 || username.length > 20) {
      return reply.code(400).send({ error: '账号长度 3-20' });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: '密码至少 6 位' });
    }
    const exists = await UserModel.findOne({ username });
    if (exists) {
      return reply.code(409).send({ error: '账号已存在' });
    }
    const passwordHash = await hashPassword(password);
    const nickname = body.nickname?.trim() || username;
    const user = await UserModel.create({
      username,
      passwordHash,
      isGuest: false,
      nickname,
      level: 1,
      exp: 0,
      coins: START_COINS,
      diamonds: START_DIAMONDS,
      stamina: START_STAMINA,
      farmPlots: createInitialPlots(),
      inventory: [{ itemId: 'seed_wheat', qty: 3 }],
      taskProgress: {},
      claimedTasks: [],
      lastTaskResetDate: '',
      signInClaimedDays: [],
      signInWeekKey: '',
    });
    const token = signToken(user._id.toString());
    return { token, userId: user._id.toString() };
  });

  app.post('/api/auth/login', async (req, reply) => {
    const body = req.body as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password;
    if (!username || !password) {
      return reply.code(400).send({ error: '账号与密码必填' });
    }
    const user = await UserModel.findOne({ username });
    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: '账号或密码错误' });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return reply.code(401).send({ error: '账号或密码错误' });
    }
    const token = signToken(user._id.toString());
    return { token, userId: user._id.toString() };
  });

  app.post('/api/auth/guest', async () => {
    const user = await UserModel.create({
      isGuest: true,
      nickname: randomGuestName(),
      level: 1,
      exp: 0,
      coins: START_COINS,
      diamonds: START_DIAMONDS,
      stamina: START_STAMINA,
      farmPlots: createInitialPlots(),
      inventory: [{ itemId: 'seed_wheat', qty: 5 }],
      taskProgress: {},
      claimedTasks: [],
      lastTaskResetDate: '',
      signInClaimedDays: [],
      signInWeekKey: '',
    });
    const token = signToken(user._id.toString());
    return { token, userId: user._id.toString() };
  });
}
