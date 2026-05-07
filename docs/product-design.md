# 热点雷达 MVP 产品设计

## 目标

热点雷达是一个本地自托管的响应式 Web 工具，用于自动发现指定关键词或主题范围内的热点变化，并用 AI 判断内容的真实性、相关性和新鲜度。高置信命中会通过浏览器通知提醒用户，帮助用户第一时间获取 AI 大模型、AI 编程等方向的热点变化。

## 产品形态

第一阶段只做网页版，后续在 Web 版能力稳定后再封装成 Agent Skills。界面采用“雷达指挥台”方向：深色、高对比、实时信号感强，重点展示监控项、热点流、来源健康、AI 置信度和证据链。

## 架构

前端使用 React + Vite，负责监控项配置、热点雷达流、来源健康和浏览器通知。后端使用 Express 5，提供 REST API、Socket.io 实时推送、node-cron 定时巡检和 OpenRouter AI 鉴别。数据库使用 Prisma + SQLite，适合单用户本地自托管。

## 数据源

第一版包含 Twitter/X、Bing、Google、DuckDuckGo、Hacker News、搜狗、B站、微博。Twitter/X 使用 Bearer Token；其他来源优先使用公开可访问页面或 RSS。每个来源独立超时、失败隔离，并把错误写入来源健康状态。

## AI 策略

AI 服务通过 OpenAI-compatible Chat Completions 接口接入。第一版支持 `openrouter` 和 `minimax` 两个 provider，由 `AI_PROVIDER` 环境变量切换。模型由环境变量配置。AI 输出结构化 JSON，包含相关性、真实性、新鲜度、置信度、理由、证据 URL 和是否通知。只有高相关、高可信、高新鲜度的结果才触发强通知。

## 边界

第一版是单用户、本地自托管工具，不做登录、多用户权限、云部署和 Agent Skills。浏览器通知要求页面打开并授权通知权限。平台限制访问时记录错误，不阻塞其他来源巡检。
