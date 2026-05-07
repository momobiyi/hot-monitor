# 热点雷达 MVP 实施计划

## 目标

实现一个可本地运行的热点监控 Web 应用，包含监控项管理、多源巡检、AI 鉴别、高置信浏览器通知和响应式雷达指挥台 UI。

## 任务

1. 初始化项目结构、包配置、TypeScript 配置和文档。
2. 建立 Prisma + SQLite 数据模型：Monitor、SourceItem、AiJudgement、HotspotEvent、SourceHealth。
3. 实现后端配置、Express 5 应用、REST API 和 Socket.io。
4. 实现监控项 CRUD 与事件/来源健康查询。
5. 实现数据源适配器接口和各来源适配器。
6. 实现去重、新鲜度和 AI 高置信通知判断。
7. 接入 OpenRouter，要求 AI 返回结构化 JSON。
8. 实现 node-cron 定时巡检和手动巡检。
9. 实现 React 雷达指挥台、浏览器通知和响应式布局。
10. 运行测试、构建和本地服务验证。

## 验收

新增一个关键词后，用户可以手动触发巡检，页面展示巡检状态、来源健康、热点事件和 AI 理由。高置信热点通过 Socket.io 实时进入页面，并在授权后触发浏览器通知。

## 启动方式

详细启动步骤见 [startup.md](./startup.md)。常用命令如下：

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:init
npm.cmd run dev
```

前端地址：`http://127.0.0.1:5173`

后端地址：`http://127.0.0.1:4000/api`
