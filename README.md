# Shop Idle

一个简单的商店放置类（idle）小游戏 Demo。前端使用 Vue 3，后端使用 Fastify，数据存储在 Postgres。

## 技术栈

- Frontend: Vue 3 + Vite + TypeScript
- Backend: Fastify + TypeScript + pg
- DB: Postgres 16（Docker Compose）

## 目录结构

- `frontend/` 前端工程（Vite）
- `backend/` 后端工程（Fastify + PostgreSQL）
- `docker-compose.yml` 本地数据库

## 快速开始

### 1 启动数据库

```bash
docker compose up -d db
```

### 2 初始化数据库结构

PowerShell（推荐）：

```powershell
Get-Content backend\src\db\schema.sql | docker exec -i shop_idle_db psql -U shop -d shop_idle
```

或使用 cmd 重定向：

```cmd
docker exec -i shop_idle_db psql -U shop -d shop_idle < backend\src\db\schema.sql
```

### 3 启动后端

在 `backend/` 下安装依赖并启动：

```bash
cd backend
npm install
```

复制示例环境变量文件：

```bash
cp .env.example .env
```

然后启动开发服务器：

```bash
npm run dev
```

### 4 启动前端

在 `frontend/` 下安装依赖并启动：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 Vite 输出的地址（默认 `http://localhost:5173`）。

## 环境变量

后端必须提供：

- `DATABASE_URL` Postgres 连接串（必填）
- `PORT` 后端端口（可选，默认 3000）

脚本可选：

- `DEMO_USER_ID` 重置 demo 存档时使用的用户 ID（默认 `11111111-1111-1111-1111-111111111111`）

## API

前端在开发模式下会将 `/api` 代理到 `http://localhost:3000`。

- `GET /health` 健康检查
- `GET /save` 获取当前 demo 用户存档
- `POST /ops` 提交一次操作

`POST /ops` 示例：

```json
{
  "opId": "uuid",
  "baseVersion": 0,
  "type": "restock",
  "payload": { "skuId": "apple", "qty": 1 }
}
```

## 常用脚本

后端：

- `npm run dev` 启动开发服务器
- `npm run build` 构建
- `npm run start` 启动生产构建
- `npm run reset:demo -- --yes` 重置 demo 存档（仅允许 `NODE_ENV=development`）

## OAuth Login (LinuxDO Connect)

Backend env vars (required):
- `LINUXDO_CLIENT_ID`
- `LINUXDO_CLIENT_SECRET`
- `LINUXDO_REDIRECT_URI` (dev can be http, production must be https)
- `JWT_SECRET`
- `FRONTEND_URL`

Auth endpoints:
- `GET /auth/linuxdo/login` redirect to LinuxDO authorize
- `GET /auth/linuxdo/callback` OAuth2 callback

API notes:
- `GET /save` and `POST /ops` now require `Authorization: Bearer <token>`
- Frontend login flow redirects back to `${FRONTEND_URL}/auth/callback?token=...`

Security note:
- Only allow http callback URLs in development. Use https in production for both `LINUXDO_REDIRECT_URI` and `FRONTEND_URL`.
