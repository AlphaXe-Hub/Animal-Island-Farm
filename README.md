# 动物岛农场（Animal Island Farm）

Web 休闲农场经营原型：React + Vite + [animal-island-ui](https://www.npmjs.com/package/animal-island-ui) 前端，Fastify + MongoDB 后端，BGM 位于仓库根目录 [`bgm/`](bgm/)（构建时同步进前端 `public/bgm`）。

## 一键部署（Docker Compose）

```bash
# 若 8080 已被占用，可指定端口：
# WEB_PORT=8081 docker compose up -d

docker compose up -d --build
```

浏览器访问：<http://localhost:8080>（或你设置的 `WEB_PORT`）。前端通过 Nginx 将 `/api` 反代到后端，同域调用无需额外 CORS 配置。

环境变量示例见 [`.env.example`](.env.example)。生产环境务必修改 `JWT_SECRET`。

停止与清理：

```bash
docker compose down
# 删除数据库卷（慎用）
# docker compose down -v
```

## 本地开发

1. 启动 MongoDB（可用 Compose 只起数据库）：

   ```bash
   docker compose up -d mongo
   ```

2. 后端（默认连接 `mongodb://localhost:27017/animal-island-farm`）：

   ```bash
   cd backend
   npm install
   cp ../.env.example ../.env   # 按需编辑
   npm run dev
   ```

3. 前端（Vite 已将 `/api` 代理到 `http://127.0.0.1:3000`）：

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 功能概览

- 注册 / 登录 / 游客；农田开垦、播种、浇水、施肥、收获（服务端时间戳，支持离线生长同步）
- 商店购买、仓库出售作物、钱包流水、模拟钻石充值
- 每日任务与签到、个人设置（背景音乐开关，与策划案音效项对应）

## 排错

- **`Bind for 0.0.0.0:8080 failed`**：设置 `WEB_PORT` 为其他端口后重新 `docker compose up -d`。
- **Mongo 未就绪**：Compose 中 `api` 依赖 `mongo` 的 `healthcheck`，首次拉取镜像可能较慢，请等待 `Healthy` 后再访问。
- **Node 版本**：推荐使用 Node 20.19+；当前前端锁定 Vite 5 以便在略低版本上构建，Docker 镜像使用官方 `node:20-alpine`。
