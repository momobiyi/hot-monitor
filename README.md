# 热点雷达

热点雷达是一个本地自托管的热点监控 Web 应用。它可以围绕指定关键词或主题自动巡检多类公开来源，并通过 AI 判断内容的相关性、真实性、新鲜度和置信度。高置信热点会实时进入页面，并在浏览器授权后触发通知。

当前版本面向单用户本地使用，重点覆盖 AI 大模型、AI 编程等方向的热点变化发现。

## 功能特性

- 监控项管理：创建、查看和触发关键词巡检。
- 多源巡检：支持 Twitter/X、Bing、Google、DuckDuckGo、Hacker News、搜狗、B 站、微博等来源适配。
- AI 鉴别：通过 OpenAI-compatible Chat Completions 接口输出结构化判断结果。
- 实时推送：使用 Socket.io 将高置信热点推送到前端。
- 浏览器通知：页面打开并授权后，对高置信热点发出系统通知。
- 来源健康：记录各来源的巡检状态、失败原因和最近更新时间。
- 本地数据：使用 Prisma + SQLite，适合单机自托管。

## 技术栈

- 前端：React 18、Vite、TypeScript、Socket.io Client
- 后端：Express 5、Socket.io、node-cron、TypeScript
- 数据库：Prisma、SQLite
- AI Provider：OpenRouter、MiniMax
- 测试：Vitest、jsdom

## 快速开始

### 环境要求

- Node.js 24.x 或兼容版本
- npm 11.x 或兼容版本
- Windows PowerShell 下建议使用 `npm.cmd`，避免执行策略拦截 `npm.ps1`

### 安装与初始化

在项目根目录执行：

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:init
```

### 配置环境变量

复制 `.env.example` 为 `.env`，并按需填写 AI 和 Twitter/X 凭据。

OpenRouter 示例：

```env
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="你的 OpenRouter Key"
OPENROUTER_MODEL="openai/gpt-4.1-mini"
TWITTER_BEARER_TOKEN="你的 Twitter/X Bearer Token"
```

MiniMax 示例：

```env
AI_PROVIDER="minimax"
MINIMAX_API_KEY="你的 MiniMax API Key"
MINIMAX_MODEL="MiniMax-M2.7"
MINIMAX_BASE_URL="https://api.minimax.io/v1"
TWITTER_BEARER_TOKEN="你的 Twitter/X Bearer Token"
```

`AI_PROVIDER` 只能取 `openrouter` 或 `minimax`。MiniMax 使用 OpenAI-compatible Chat Completions 接口，不需要额外 SDK。如果 MiniMax Key 来自国内控制台，`MINIMAX_BASE_URL` 使用 `https://api.minimaxi.com/v1`；如果来自国际控制台，使用 `https://api.minimax.io/v1`。

当前环境中 Prisma 的 `db:push` / `migrate dev` 可能触发 schema-engine 空错误，因此项目提供 `npm.cmd run db:init` 初始化本地 SQLite 表结构。

### 启动开发服务

一键启动前后端：

```powershell
npm.cmd run dev
```

也可以分别启动：

```powershell
npm.cmd run dev:server
npm.cmd run dev:client
```

访问地址：

- 前端：`http://127.0.0.1:5173`
- 后端 API：`http://127.0.0.1:4000/api`

## 验证

运行测试：

```powershell
npm.cmd test
```

运行构建：

```powershell
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

## 项目结构

```text
client/                 React + Vite 前端
server/                 Express 后端、巡检逻辑、数据源适配器
server/prisma/          Prisma schema 和本地 SQLite 配置
server/scripts/         本地数据库初始化脚本
docs/                   产品设计、实施计划和启动说明
.env.example            环境变量模板
package.json            项目脚本和依赖配置
```

## 设计边界

- 当前版本为单用户、本地自托管工具。
- 不包含登录、多用户权限和云部署能力。
- 浏览器通知要求页面保持打开并授权通知权限。
- 某个平台访问受限时，只记录来源错误，不阻塞其他来源巡检。

## 更多文档

- [产品设计](docs/product-design.md)
- [实施计划](docs/implementation-plan.md)
- [启动说明](docs/startup.md)
