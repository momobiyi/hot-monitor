# 启动说明

## 环境要求

- Node.js 24.x 或兼容版本
- npm 11.x 或兼容版本
- Windows PowerShell 下建议使用 `npm.cmd`，避免执行策略拦截 `npm.ps1`

## 首次初始化

在项目根目录 `C:\code\hot-monitor` 执行：

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:init
```

如果需要接入真实 AI 和 Twitter/X，在 `.env` 中填写。

OpenRouter：

```env
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="你的 OpenRouter Key"
OPENROUTER_MODEL="openai/gpt-4.1-mini"
TWITTER_BEARER_TOKEN="你的 Twitter/X Bearer Token"
```

MiniMax：

```env
AI_PROVIDER="minimax"
MINIMAX_API_KEY="你的 MiniMax API Key"
MINIMAX_MODEL="MiniMax-M2.7"
MINIMAX_BASE_URL="https://api.minimax.io/v1"
TWITTER_BEARER_TOKEN="你的 Twitter/X Bearer Token"
```

`AI_PROVIDER` 只能取 `openrouter` 或 `minimax`。MiniMax 接入使用 OpenAI-compatible Chat Completions 接口，不需要额外 SDK。
如果你的 MiniMax Key 来自国内控制台，`MINIMAX_BASE_URL` 使用 `https://api.minimaxi.com/v1`；如果来自国际控制台，使用 `https://api.minimax.io/v1`。

当前环境中 Prisma 的 `db:push` / `migrate dev` 可能触发 schema-engine 空错误，因此本项目提供 `npm.cmd run db:init` 初始化本地 SQLite 表结构。

## 分别启动前后端

终端 1 启动后端：

```powershell
npm.cmd run dev:server
```

后端地址：

```text
http://127.0.0.1:4000/api
```

终端 2 启动前端：

```powershell
npm.cmd run dev:client
```

前端地址：

```text
http://127.0.0.1:5173
```

## 一键启动

也可以在项目根目录执行：

```powershell
npm.cmd run dev
```

该命令会同时启动后端和前端。

## 验证命令

```powershell
npm.cmd test
npm.cmd run build
```

健康检查：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4000/api/health
```

预期返回包含：

```json
{"ok":true}
```
