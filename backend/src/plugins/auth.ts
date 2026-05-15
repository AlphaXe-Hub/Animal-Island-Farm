import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../auth/crypto.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authPreHandler(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    reply.code(401).send({ error: '未登录' });
    return;
  }
  try {
    const { sub } = verifyToken(h.slice(7));
    req.userId = sub;
  } catch {
    reply.code(401).send({ error: '登录已失效' });
  }
}

export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authPreHandler(req, reply);
  if (reply.sent) return;
}
